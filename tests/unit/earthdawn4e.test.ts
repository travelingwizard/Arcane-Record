import { describe, expect, it, vi } from 'vitest';
import {
  earthdawnCatalog,
  earthdawnDisciplines,
  earthdawnKnacks,
  earthdawnQuestorDefinitions,
  earthdawnRaces,
  earthdawnSpells,
  earthdawnSources,
  earthdawnThreadItems,
} from '../../src/games/earthdawn4e/catalog';
import { createBlankEarthdawn4eCharacter } from '../../src/games/earthdawn4e/create-character';
import {
  attributeStep,
  deriveCharacter,
  rollStep,
  stepDice,
  stepDiceChart,
} from '../../src/games/earthdawn4e/engine';
import {
  earthdawn4eCharacterSchema,
  migrateEarthdawn4eCharacter,
} from '../../src/games/earthdawn4e/schema';
import { importStepsCharacter } from '../../src/games/earthdawn4e/steps-import';
import { coreTalentOptions } from '../../src/games/earthdawn4e/discipline-progressions';
import { auditEarthdawnSourceInventory } from '../../src/games/earthdawn4e/source-inventory';
import {
  appendRoll,
  attributeIncreaseCost,
  attributeTraining,
  createLegendEntry,
  disciplineCircleTraining,
  grantedDevotionCost,
  knackLearningQuote,
  legendTotals,
  missingCircleTalentRanks,
  newDisciplineTalentCost,
  previewDisciplineTalentReconciliation,
  questorRankCost,
  reconcileDisciplineTalents,
  refundableLedgerEntry,
  spellLearningCost,
  threadRankCost,
} from '../../src/games/earthdawn4e/rules';

describe('Earthdawn Fourth Edition module', () => {
  it('creates a valid local-first character and complete official source list', () => {
    const character = createBlankEarthdawn4eCharacter({
      status: 'manual',
      mode: 'edit',
    });
    expect(earthdawn4eCharacterSchema.parse(character)).toEqual(character);
    expect(earthdawnSources).toHaveLength(10);
    expect(character.sources.enabledSourceIds).toEqual(['ed4.players-guide']);
    expect(earthdawnRaces).toHaveLength(8);
    expect(earthdawnDisciplines).toHaveLength(15);
    expect(Object.keys(coreTalentOptions)).toHaveLength(15);
    for (const discipline of earthdawnDisciplines) {
      expect(coreTalentOptions[discipline.name]?.novice).toHaveLength(10);
      expect(coreTalentOptions[discipline.name]?.journeyman).toHaveLength(10);
      expect(coreTalentOptions[discipline.name]?.warden).toHaveLength(10);
      expect(coreTalentOptions[discipline.name]?.master).toHaveLength(8);
    }
    expect(earthdawnSpells).toHaveLength(216);
    expect(earthdawnKnacks).toHaveLength(142);
    expect(earthdawnThreadItems).toHaveLength(50);
    const skills = earthdawnCatalog.filter(({ kind }) => kind === 'skill');
    expect(new Set(skills.map(({ id }) => id)).size).toBe(skills.length);
    expect(new Set(skills.map(({ skillCategory }) => skillCategory))).toEqual(
      new Set(['general', 'knowledge', 'artisan', 'language']),
    );
    expect(
      skills.find(
        ({ name, skillCategory }) =>
          name === 'Acrobatic Defense' && skillCategory === 'general',
      ),
    ).toMatchObject({ defaultAttribute: 'dexterity', page: 185 });
    expect(
      skills.filter(({ skillCategory }) => skillCategory === 'language'),
    ).toHaveLength(16);
    expect(new Set(earthdawnThreadItems.map(({ id }) => id)).size).toBe(50);
    expect(new Set(earthdawnKnacks.map(({ id }) => id)).size).toBe(142);
    expect(
      earthdawnKnacks.find(({ name }) => name === 'Craft True Pattern'),
    ).toMatchObject({
      page: 116,
      requirements: ['Patterncraft, Thread Smithing rank 5'],
    });
    expect(earthdawnQuestorDefinitions.length).toBeGreaterThan(80);
    expect(
      earthdawnQuestorDefinitions.find(
        ({ name }) => name === 'Passion’s Empowerment',
      ),
    ).toMatchObject({
      kind: 'devotion',
      verification: 'verified',
    });
    expect(
      JSON.parse(
        earthdawnQuestorDefinitions.find(
          ({ name }) => name === 'Passion’s Empowerment',
        )!.mechanics,
      ).eligibility,
    ).toHaveLength(12);
    expect(new Set(earthdawnSpells.map(({ id }) => id)).size).toBe(216);
    for (const discipline of [
      'Elementalist',
      'Illusionist',
      'Nethermancer',
      'Wizard',
    ]) {
      expect(
        new Set(
          earthdawnSpells
            .filter(({ requirements }) =>
              requirements[0]?.startsWith(discipline),
            )
            .map(({ requirements }) => requirements[0]),
        ).size,
      ).toBe(8);
    }
  });
  it('quotes Companion knack learning at the required Novice talent rank', () => {
    expect(knackLearningQuote(5)).toEqual({
      legendCost: 800,
      trainingDays: 5,
      silverCost: 250,
    });
  });
  it('opens blank sheets in Build mode and migrates v1 state additively', () => {
    const character = createBlankEarthdawn4eCharacter({
      status: 'manual',
      mode: 'edit',
    });
    expect(character.creation.status).toBe('manual');
    expect(character.sheetLayout.mode).toBe('edit');
    expect(character.dice).toMatchObject({ tracking: true, historyLimit: 10 });
    const legacy = structuredClone(character) as unknown as Record<
      string,
      unknown
    >;
    legacy.advancement = { legend: { total: 1200, current: 900 }, ledger: [] };
    legacy.dice = {
      ...(legacy.dice as Record<string, unknown>),
      history: [],
      tracking: undefined,
      historyLimit: undefined,
      lastRoll: undefined,
    };
    const legacyIdentity = legacy.identity as Record<string, unknown>;
    delete legacyIdentity.height;
    delete legacyIdentity.weight;
    delete legacy.questor;
    delete legacy.weapons;
    delete legacy.wealth;
    delete legacy.reputation;
    (legacy.creation as Record<string, unknown>).enforceRules = false;
    const migrated = migrateEarthdawn4eCharacter(legacy);
    expect(legendTotals(migrated.advancement.ledger)).toEqual({
      current: 900,
      total: 1200,
    });
    expect(migrated.identity.height).toBe('');
    expect(migrated.dice).toMatchObject({ tracking: true, historyLimit: 10 });
    expect(migrated.creation.overrides).toContainEqual(
      expect.objectContaining({
        code: 'creator-global-override',
        reason: 'Legacy GM override retained during migration.',
      }),
    );
  });
  it('migrates v2 equipment additively without flattening advancement history', () => {
    const legacy = createBlankEarthdawn4eCharacter();
    const purchase = createLegendEntry({
      type: 'talent',
      amount: -100,
      targetId: 'talent-id',
      targetName: 'Avoid Blow',
      beforeRating: 0,
      afterRating: 1,
      description: 'Raise Avoid Blow',
    });
    legacy.advancement.ledger.push(purchase);
    const oldEquipment = {
      id: crypto.randomUUID(),
      definitionId: null,
      sourceId: null,
      source: null,
      page: null,
      unresolved: true,
      name: 'Old shield',
      type: 'equipment',
      description: '',
      quantity: 1,
      value: '',
      costSilver: 0,
      weight: 1,
      inUse: false,
      physicalArmor: 0,
      mysticArmor: 0,
      initiativePenalty: 0,
      forgedBonus: 0,
      notes: '',
    };
    (legacy.equipment as unknown[]).push(oldEquipment);
    const migrated = migrateEarthdawn4eCharacter(legacy);
    expect(migrated.equipment[0]).toMatchObject({
      physicalDefense: 0,
      mysticDefense: 0,
      shatterThreshold: 0,
    });
    expect(migrated.advancement.ledger[0]).toMatchObject({
      type: 'talent',
      beforeRating: 0,
      afterRating: 1,
      targetId: 'talent-id',
    });
  });
  it('adds only required Discipline talents and preserves advanced records when Circle falls', () => {
    const discipline = earthdawnDisciplines.find(
      ({ name }) => name === 'Swordmaster',
    )!;
    const throughThree = reconcileDisciplineTalents([], discipline, 3);
    expect(throughThree.length).toBeGreaterThan(0);
    expect(
      throughThree.every(
        ({ rank, creationOwned }) => rank === 0 && creationOwned,
      ),
    ).toBe(true);
    const advanced = [
      { ...throughThree[0]!, rank: 2 },
      ...throughThree.slice(1),
    ];
    const lowered = reconcileDisciplineTalents(advanced, discipline, 1);
    expect(lowered.some(({ id }) => id === advanced[0]!.id)).toBe(true);
    const preview = previewDisciplineTalentReconciliation(
      throughThree,
      discipline,
      1,
    );
    expect(preview.removed.length).toBeGreaterThan(0);
    expect(preview.added).toHaveLength(0);

    const shared = reconcileDisciplineTalents(
      [
        {
          ...throughThree[0]!,
          disciplineSources: [],
          originDisciplineId: null,
          creationOwned: false,
          rank: 1,
        },
      ],
      discipline,
      1,
    );
    expect(shared[0]!.disciplineSources).toContain(discipline.id);
  });
  it('quotes verified advancement costs and prerequisites', () => {
    expect(attributeIncreaseCost(1)).toBe(800);
    expect(attributeIncreaseCost(3)).toBe(2100);
    expect(attributeIncreaseCost(4)).toBeNull();
    expect(attributeTraining(7)).toEqual({
      days: 7,
      silverCost: 490,
      waitWeeks: 8,
    });
    expect(disciplineCircleTraining(2)).toEqual({
      hours: 40,
      periodWeeks: 3,
      silverCost: 200,
    });
    expect(spellLearningCost(3)).toBe(300);
    expect(threadRankCost(3)).toBe(300);
    expect(threadRankCost(3, true)).toBe(800);
    expect(newDisciplineTalentCost(3, 2)).toBe(500);
    expect(newDisciplineTalentCost(3, 3)).toBe(800);
    expect(newDisciplineTalentCost(3, 4)).toBe(1300);
    expect(questorRankCost(2)).toBe(300);
    expect(grantedDevotionCost(2, 4)).toBe(200);
    expect(grantedDevotionCost(2, 5)).toBe(300);

    const character = createBlankEarthdawn4eCharacter();
    const discipline = earthdawnDisciplines[0]!;
    expect(missingCircleTalentRanks(character, discipline, 2).length).toBe(
      discipline.circles[0]!.requiredTalents.length,
    );
  });
  it('derives Legend totals from immutable signed transactions', () => {
    const award = createLegendEntry({
      type: 'award',
      amount: 1000,
      targetId: null,
      targetName: '',
      description: 'Session award',
    });
    const purchase = createLegendEntry({
      type: 'talent',
      amount: -300,
      earnedAmount: 0,
      targetId: 'talent',
      targetName: 'Avoid Blow',
      description: 'Rank increase',
    });
    expect(legendTotals([award, purchase])).toEqual({
      current: 700,
      total: 1000,
    });
    expect(refundableLedgerEntry([award, purchase], purchase.id)).toBe(true);
    const dependent = createLegendEntry({
      type: 'talent',
      amount: -500,
      targetId: 'talent',
      targetName: 'Avoid Blow',
      description: 'Another rank increase',
    });
    expect(
      refundableLedgerEntry([award, purchase, dependent], purchase.id),
    ).toBe(false);
  });
  it('supports tracking and non-tracking dice history with FIFO limits', () => {
    const character = createBlankEarthdawn4eCharacter();
    const first = rollStep(8, 0, 0, 'First');
    const second = rollStep(8, 0, 0, 'Second');
    const tracked = appendRoll({ ...character.dice, historyLimit: 1 }, first);
    const pruned = appendRoll(tracked, second);
    expect(pruned.history).toEqual([second]);
    const untracked = appendRoll({ ...pruned, tracking: false }, first);
    expect(untracked.lastRoll).toBe(first);
    expect(untracked.history).toEqual([second]);
  });
  it('uses unique cited official definitions', () => {
    const ids = earthdawnCatalog.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      earthdawnCatalog.every(
        ({ sourceId, source, page }) =>
          earthdawnSources.some(({ id }) => id === sourceId) &&
          source.length > 0 &&
          page > 0,
      ),
    ).toBe(true);
    expect(auditEarthdawnSourceInventory()).toEqual([]);
    expect(
      earthdawnDisciplines.every(({ circles }) => circles.length === 15),
    ).toBe(true);
    expect(
      earthdawnCatalog.filter(({ kind }) => kind === 'skill').length,
    ).toBeGreaterThanOrEqual(70);
    expect(
      earthdawnCatalog.filter(({ kind }) => kind === 'weapon').length,
    ).toBeGreaterThanOrEqual(40);
    expect(
      earthdawnCatalog.filter(({ kind }) => kind === 'equipment').length,
    ).toBeGreaterThanOrEqual(100);
    expect(
      earthdawnCatalog.find(({ name }) => name === 'Healing Potion')
        ?.costSilver,
    ).toBe(300);
    const crystalPlate = earthdawnCatalog.find(
      ({ name }) => name === 'Crystal Plate',
    )!;
    expect(JSON.parse(crystalPlate.mechanics)).toMatchObject({
      physicalArmor: 7,
      mysticArmor: 7,
      initiativePenalty: 5,
    });
    const bodyShield = earthdawnCatalog.find(
      ({ name }) => name === 'Body Shield',
    )!;
    expect(JSON.parse(bodyShield.mechanics)).toMatchObject({
      physicalDefense: 3,
      mysticDefense: 0,
      initiativePenalty: 2,
      shatterThreshold: 21,
    });
  });
  it('calculates attributes, characteristics, and all 105 dice steps', () => {
    expect(attributeStep(16)).toBe(7);
    expect(stepDiceChart).toHaveLength(105);
    expect(stepDice(1)).toBe('1d4-2');
    expect(stepDice(8)).toBe('2d6');
    expect(stepDice(19)).toBe('1d20+2d6');
    expect(
      deriveCharacter(
        {
          dexterity: 16,
          strength: 14,
          toughness: 14,
          perception: 12,
          willpower: 11,
          charisma: 16,
        },
        1,
      ),
    ).toMatchObject({
      physicalDefense: 9,
      mysticDefense: 7,
      socialDefense: 9,
      unconsciousness: 28,
      death: 35,
      woundThreshold: 9,
    });
  });
  it('rolls exploding dice and calculates success levels', () => {
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array)[0] = 3;
      return array;
    });
    const result = rollStep(8, 0, 5, 'Attack');
    expect(result.dice).toBe('2d6');
    expect(result.total).toBe(8);
    expect(result.successLevel).toBe(1);
    expect(result.context).toBe('Attack');
  });
  it('imports Steps JSON while ignoring portraits and reviewing unknown records', () => {
    const imported = importStepsCharacter(
      JSON.stringify({
        Name: 'Ardanyan',
        Race: 'Human',
        Portrait: 'data:image/png;base64,bad',
        Disciplines: [{ Name: 'Wizard', Circle: 2 }],
        Talents: [{ Name: 'Unknown Fan Talent', Rank: 3 }],
      }),
      'steps.json',
    )!;
    expect(imported.identity).toMatchObject({
      name: 'Ardanyan',
      raceName: 'Human',
    });
    expect(imported.notes.importReview?.ignored).toContain('Portrait');
    expect(imported.notes.importReview?.unresolved).toContain(
      'talent: Unknown Fan Talent',
    );
    expect(JSON.stringify(imported)).not.toContain('data:image');
  });
});
