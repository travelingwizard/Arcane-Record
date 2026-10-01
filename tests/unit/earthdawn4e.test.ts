import { describe, expect, it, vi } from 'vitest';
import {
  earthdawnCatalog,
  earthdawnDisciplines,
  earthdawnKnacks,
  earthdawnQuestorDefinitions,
  earthdawnRaces,
  earthdawnSpells,
  earthdawnSources,
  earthdawnTalents,
  earthdawnThreadItems,
} from '../../src/games/earthdawn4e/catalog';
import { createBlankEarthdawn4eCharacter } from '../../src/games/earthdawn4e/create-character';
import {
  attributeStep,
  addKarmaDie,
  deriveCharacter,
  earthdawnAttributeValues,
  magicEffectModifierValue,
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
import { earthdawnTalentDescriptionRows } from '../../src/games/earthdawn4e/talent-descriptions';
import {
  EARTHDAWN_PORTRAIT_MAX_BYTES,
  processEarthdawnPortrait,
} from '../../src/games/earthdawn4e/portrait';
import {
  appendRoll,
  attributeIncreaseCost,
  attributeTraining,
  createLegendEntry,
  changeWallet,
  formatWallet,
  moneyToCopper,
  disciplineCircleTraining,
  equivalentTalentCircle,
  grantedDevotionCost,
  knackLearningQuote,
  legendTotals,
  isMatrixTalent,
  canAssignSpellToMatrix,
  matrixCapacityUsed,
  matrixDeathRating,
  matrixIssues,
  matrixTypeForTalent,
  missingCircleTalentRanks,
  newDisciplineTalentCost,
  previewDisciplineTalentReconciliation,
  questorRankCost,
  reconcileFreeMatrices,
  reconcileDisciplineTalents,
  reconcileRace,
  refundableLedgerEntry,
  spellLearningCost,
  threadRankCost,
  walletTotalCopper,
} from '../../src/games/earthdawn4e/rules';
import {
  createCustomDisciplineDraft,
  customDisciplineRepository,
} from '../../src/games/earthdawn4e/custom-discipline-repository';
import { matrixSharingRules } from '../../src/games/earthdawn4e/matrix-sharing';

describe('Earthdawn Fourth Edition module', () => {
  it('creates a valid local-first character and complete official source list', () => {
    const character = createBlankEarthdawn4eCharacter({
      status: 'manual',
      mode: 'edit',
    });
    expect(earthdawn4eCharacterSchema.parse(character)).toEqual(character);
    expect(earthdawnSources).toHaveLength(13);
    expect(character.sources.enabledSourceIds).toEqual(
      earthdawnSources.map(({ id }) => id),
    );
    expect(character.sources.defaultsVersion).toBe(2);
    expect(earthdawnRaces).toHaveLength(8);
    expect(earthdawnDisciplines).toHaveLength(15);
    expect(Object.keys(coreTalentOptions)).toHaveLength(15);
    for (const discipline of earthdawnDisciplines) {
      expect(coreTalentOptions[discipline.name]?.novice).toHaveLength(10);
      expect(coreTalentOptions[discipline.name]?.journeyman).toHaveLength(10);
      expect(coreTalentOptions[discipline.name]?.warden).toHaveLength(10);
      expect(coreTalentOptions[discipline.name]?.master).toHaveLength(8);
    }
    expect(earthdawnSpells).toHaveLength(464);
    expect(earthdawnKnacks).toHaveLength(238);
    expect(earthdawnThreadItems).toHaveLength(142);
    expect(earthdawnTalents).toHaveLength(450);
    expect(new Set(earthdawnTalents.map(({ id }) => id)).size).toBe(450);
    expect(
      earthdawnTalents.find(({ name }) => name === 'Acrobatic Defense'),
    ).toMatchObject({
      defaultAttribute: 'dexterity',
      page: 124,
      talentMetadata: {
        attributeText: 'Dexterity',
        actionText: 'Simple',
        strainText: '1',
        sourceIds: ['ed4.players-guide', 'ed4.questors'],
      },
    });
    expect(
      earthdawnTalents.find(({ name }) => name === 'Acrobatic Finesse'),
    ).toMatchObject({
      defaultAttribute: undefined,
      talentMetadata: { attributeText: 'Not in source' },
    });
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
    ).toHaveLength(19);
    expect(new Set(earthdawnThreadItems.map(({ id }) => id)).size).toBe(142);
    expect(
      earthdawnThreadItems.some(
        ({ threadItemMetadata }) =>
          threadItemMetadata?.provenance === 'workbook' &&
          Boolean(threadItemMetadata.inferredKeyKnowledge),
      ),
    ).toBe(true);
    expect(new Set(earthdawnKnacks.map(({ id }) => id)).size).toBe(238);
    expect(
      earthdawnKnacks.reduce(
        (total, knack) => total + (knack.knackMetadata?.variants.length ?? 0),
        0,
      ),
    ).toBe(254);
    expect(
      new Set(
        earthdawnKnacks.flatMap(
          ({ knackMetadata }) =>
            knackMetadata?.variants.map(({ key }) => key) ?? [],
        ),
      ).size,
    ).toBe(254);
    expect(
      new Set(
        earthdawnKnacks.flatMap(
          ({ knackMetadata }) =>
            knackMetadata?.variants.map(({ sourceId }) => sourceId) ?? [],
        ),
      ),
    ).toEqual(
      new Set([
        'ed4.companion',
        'ed4.vasgothia',
        'ed4.mystic-paths',
        'ed4.travar',
        'ed4.iopos',
        'ed4.questors',
        'ed4.user-matrix-reference',
      ]),
    );
    expect(
      earthdawnKnacks.find(({ name }) => name === 'Craft True Pattern'),
    ).toMatchObject({
      id: 'ed4.companion.knack.craft-true-pattern',
      page: 116,
      knackMetadata: {
        variants: expect.arrayContaining([
          expect.objectContaining({
            association: 'Patterncraft, Thread Smithing',
            minimumRank: 5,
            sourceId: 'ed4.companion',
            page: 116,
          }),
        ]),
      },
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
    expect(new Set(earthdawnSpells.map(({ id }) => id)).size).toBe(464);
    expect(earthdawnTalentDescriptionRows).toHaveLength(244);
    expect(
      earthdawnTalents.find(({ name }) => name === 'Acrobatic Defense')
        ?.talentMetadata?.descriptionText,
    ).toMatch(/flips and somersaults/);
    expect(earthdawnSpells.find(({ name }) => name === 'Air Armor')?.id).toBe(
      'ed4.players-guide.spell.air-armor',
    );
    expect(
      earthdawnSpells.find(({ name }) => name === 'Astral Spear')
        ?.spellMetadata,
    ).toMatchObject({
      threadsText: expect.any(String),
      difficultyText: expect.any(String),
      variants: expect.arrayContaining([
        expect.objectContaining({ sourceId: 'ed4.players-guide' }),
        expect.objectContaining({ sourceId: 'ed4.mystic-paths' }),
      ]),
    });
    expect(
      earthdawnSpells.some(
        ({ spellMetadata }) =>
          spellMetadata?.threadsValue == null &&
          /special|see text|to|\+/i.test(spellMetadata?.threadsText ?? ''),
      ),
    ).toBe(true);
    for (const discipline of [
      'Elementalist',
      'Illusionist',
      'Nethermancer',
      'Shaman',
      'Wizard',
    ]) {
      expect(
        new Set(
          earthdawnSpells
            .filter(({ requirements }) =>
              requirements.some((requirement) =>
                requirement.startsWith(discipline),
              ),
            )
            .flatMap(({ spellMetadata }) =>
              (spellMetadata?.variants ?? [])
                .filter((variant) => variant.discipline === discipline)
                .flatMap((variant) =>
                  Array.from(
                    {
                      length: variant.circleMax - variant.circleMin + 1,
                    },
                    (_, index) => variant.circleMin + index,
                  ),
                ),
            ),
        ).size,
      ).toBeGreaterThanOrEqual(8);
    }
  });
  it('manages decimal coinage with automatic change', () => {
    const character = createBlankEarthdawn4eCharacter();
    expect(walletTotalCopper(character.wealth)).toBe(1000);
    expect(moneyToCopper(2, 'gp')).toBe(200);
    const changed = changeWallet(character.wealth, -1)!;
    expect(changed).toMatchObject({ gold: 9, silver: 9, copper: 9 });
    expect(formatWallet(changed)).toBe('9 gp · 9 sp · 9 cp');
    expect(changeWallet({ ...character.wealth, silver: 0 }, -1)).toBeNull();
  });
  it('reconciles Race grants without discarding purchased attributes', () => {
    const character = createBlankEarthdawn4eCharacter();
    character.attributes.dexterity.purchased = 2;
    const windling = earthdawnRaces.find(({ name }) => name === 'Windling')!;
    const next = reconcileRace(character, windling);
    expect(next.attributes.dexterity).toMatchObject({
      racial: 11,
      purchased: 2,
    });
    expect(next.talents.some(({ name }) => name === 'Astral Sight')).toBe(true);
    expect(next.abilities.some(({ name }) => name === 'Flight')).toBe(true);
    expect(
      next.health.modifiers.find(({ target }) => target === 'physicalDefense')
        ?.value,
    ).toBe(2);
    expect(next.raceSnapshot?.movement).toBe('6 / 16 flying');
  });
  it('quotes Companion knack learning at the required Novice talent rank', () => {
    expect(knackLearningQuote(5)).toEqual({
      legendCost: 800,
      trainingDays: 5,
      silverCost: 250,
    });
  });
  it('applies only active structured magic effects to attributes and ratings', () => {
    const character = createBlankEarthdawn4eCharacter();
    const effects = [
      {
        applicable: true,
        modifierTarget: 'attribute.dexterity',
        modifierValue: 2,
      },
      {
        applicable: true,
        modifierTarget: 'physicalDefense',
        modifierValue: 3,
      },
      {
        applicable: false,
        modifierTarget: 'physicalDefense',
        modifierValue: 9,
      },
    ];
    const values = earthdawnAttributeValues(character.attributes, effects);
    expect(values.dexterity).toBe(12);
    expect(deriveCharacter(values).physicalDefense).toBe(7);
    expect(magicEffectModifierValue(effects, 'physicalDefense')).toBe(3);
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
    legacy.sources = {
      enabledSourceIds: ['ed4.players-guide'],
      showUnavailable: false,
    };
    const legacyMagic = legacy.magic as Record<string, unknown>;
    legacyMagic.effects = [
      {
        id: crypto.randomUUID(),
        definitionId: null,
        sourceId: null,
        source: null,
        page: null,
        unresolved: true,
        name: 'Legacy defense bonus',
        target: 'Physical Defense',
        rank: 1,
        applicable: true,
        effects: '',
        kind: 'pattern',
        notes: '',
      },
      {
        id: crypto.randomUUID(),
        definitionId: null,
        sourceId: null,
        source: null,
        page: null,
        unresolved: true,
        name: 'Legacy special power',
        target: 'Something unusual',
        rank: 1,
        applicable: true,
        effects: '',
        kind: 'thread',
        notes: '',
      },
    ];
    (legacy.creation as Record<string, unknown>).enforceRules = false;
    const migrated = migrateEarthdawn4eCharacter(legacy);
    expect(legendTotals(migrated.advancement.ledger)).toEqual({
      current: 900,
      total: 1200,
      spent: 300,
      corrections: 900,
    });
    expect(migrated.identity.height).toBe('');
    expect(migrated.portrait).toBeNull();
    expect(migrated.health.basicMode).toBe(true);
    expect(migrated.dice).toMatchObject({ tracking: true, historyLimit: 10 });
    expect(migrated.sources).toMatchObject({
      enabledSourceIds: earthdawnSources.map(({ id }) => id),
      defaultsVersion: 2,
    });
    expect(migrated.magic.effects[0]).toMatchObject({
      target: 'Physical Defense',
      modifierTarget: 'physicalDefense',
      modifierValue: 0,
    });
    expect(migrated.magic.effects[1]).toMatchObject({
      target: 'Something unusual',
      modifierTarget: null,
      modifierValue: 0,
    });
    expect(migrated.creation.overrides).toContainEqual(
      expect.objectContaining({
        code: 'creator-global-override',
        reason: 'Legacy GM override retained during migration.',
      }),
    );
  });
  it('enriches legacy catalog spells without changing custom records', () => {
    const character = createBlankEarthdawn4eCharacter({
      status: 'manual',
      mode: 'edit',
    });
    character.magic.spells.push({
      id: crypto.randomUUID(),
      definitionId: 'ed4.players-guide.spell.air-armor',
      sourceId: 'ed4.players-guide',
      source: 'Earthdawn Fourth Edition Player’s Guide',
      page: 271,
      unresolved: false,
      name: 'Air Armor',
      discipline: 'Elementalist',
      circle: 1,
      threads: 0,
      weaving: '',
      casting: '',
      range: '',
      duration: '',
      effect: '',
      learned: true,
      notes: '',
    });
    const migrated = migrateEarthdawn4eCharacter(character);
    expect(migrated.magic.spells[0]).toMatchObject({
      variantKey: 'ed4.players-guide|Elementalist|1',
      variantSourceId: 'ed4.players-guide',
      description: expect.any(String),
      threadsText: expect.any(String),
      difficultyText: expect.stringContaining('Weaving:'),
    });
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
  it('models matrix capacity, damage, and legacy attunement additively', () => {
    const character = createBlankEarthdawn4eCharacter();
    const firstSpell = {
      id: crypto.randomUUID(),
      definitionId: null,
      sourceId: null,
      source: null,
      page: null,
      unresolved: false,
      name: 'First Circle Spell',
      discipline: 'Wizard',
      circle: 1,
      threads: 0,
      weaving: '',
      casting: '',
      range: '',
      duration: '',
      effect: '',
      learned: true,
      notes: '',
    };
    const secondSpell = {
      ...firstSpell,
      id: crypto.randomUUID(),
      name: 'Second Circle Spell',
      circle: 2,
    };
    character.magic.spells.push(firstSpell, secondSpell);
    const matrix = {
      id: crypto.randomUUID(),
      name: 'Shared Matrix',
      type: 'shared' as const,
      source: '',
      rank: 3,
      spellId: firstSpell.id,
      spellIds: [firstSpell.id, secondSpell.id],
      prewovenThreads: 0,
      damage: 20,
      deathRating: 20,
      active: true,
      temporaryUntil: '',
      restriction: '',
      reattuning: { inProgress: false, difficulty: 0, strainPaid: 0 },
      used: true,
      notes: '',
    };
    expect(matrixCapacityUsed(matrix, character.magic.spells)).toBe(3);
    expect(matrixIssues(matrix, character.magic.spells, 2)).toContain(
      'The matrix is shut down until its damage is recovered.',
    );
    expect(matrixDeathRating('standard')).toBe(10);
    expect(matrixDeathRating('enhanced')).toBe(15);
    expect(matrixDeathRating('shared')).toBe(20);
    expect(matrixDeathRating('armored')).toBe(25);
    expect(isMatrixTalent('Standard Matrix')).toBe(true);
    expect(isMatrixTalent('Spell Matrix')).toBe(true);
    expect(isMatrixTalent('Awareness')).toBe(false);
    expect(matrixTypeForTalent('Enhanced Matrix')).toBe('enhanced');

    const legacy = structuredClone(character) as unknown as Record<
      string,
      unknown
    >;
    legacy.magic = {
      ...(legacy.magic as object),
      matrices: [
        {
          id: crypto.randomUUID(),
          type: 'standard',
          source: '',
          rank: 2,
          spellId: firstSpell.id,
          used: true,
          notes: '',
        },
      ],
    };
    const migrated = migrateEarthdawn4eCharacter(legacy);
    expect(migrated.magic.matrices[0]).toMatchObject({
      spellIds: [firstSpell.id],
      damage: 0,
      deathRating: 10,
      active: true,
    });
    expect(migrated.health.basicMode).toBe(true);
  });
  it('allows only source-defined spell groups to share non-Shared matrices', () => {
    const character = createBlankEarthdawn4eCharacter();
    const spell = (
      name: string,
      circle: number,
      formKey?: string,
      formLabel?: string,
    ) => ({
      id: crypto.randomUUID(),
      definitionId: null,
      sourceId: null,
      source: null,
      page: null,
      unresolved: false,
      name,
      discipline: 'Illusionist',
      circle,
      threads: 0,
      weaving: '',
      casting: '',
      range: '',
      duration: '',
      effect: '',
      learned: true,
      notes: '',
      formKey,
      formLabel,
    });
    const matrix = {
      id: crypto.randomUUID(),
      name: 'Standard Matrix',
      type: 'standard' as const,
      source: '',
      rank: 8,
      spellId: null,
      spellIds: [] as string[],
      prewovenThreads: 0,
      damage: 0,
      deathRating: 10,
      active: true,
      temporaryUntil: '',
      restriction: '',
      reattuning: { inProgress: false, difficulty: 0, strainPaid: 0 },
      used: false,
      notes: '',
    };
    const switchSpell = spell('Switch', 5);
    const trueSwitch = spell('True Switch', 6);
    const formExchange = spell('Form Exchange', 8);
    const unrelated = spell('Unrelated Spell', 1);
    character.magic.spells.push(
      switchSpell,
      trueSwitch,
      formExchange,
      unrelated,
    );
    matrix.spellIds = [switchSpell.id];
    expect(
      canAssignSpellToMatrix(
        matrix,
        trueSwitch,
        character.magic.spells,
        character.knacks,
      ),
    ).toBe(false);
    character.knacks.push({
      id: crypto.randomUUID(),
      definitionId: null,
      sourceId: null,
      source: null,
      page: null,
      unresolved: false,
      name: 'Squeeze Switch',
      talentId: null,
      minimumRank: 0,
      action: '',
      strain: 0,
      notes: '',
      variantKey: null,
      association: 'Patterncraft',
      description: '',
      mechanicsText: '',
      actionText: '',
      strainText: '',
      minimumRankKnown: false,
    });
    expect(
      canAssignSpellToMatrix(
        matrix,
        trueSwitch,
        character.magic.spells,
        character.knacks,
      ),
    ).toBe(true);
    matrix.spellIds.push(trueSwitch.id);
    expect(
      canAssignSpellToMatrix(
        matrix,
        unrelated,
        character.magic.spells,
        character.knacks,
      ),
    ).toBe(false);
    expect(
      canAssignSpellToMatrix(
        matrix,
        formExchange,
        character.magic.spells,
        character.knacks,
      ),
    ).toBe(false);
    character.knacks.push({
      ...character.knacks[0]!,
      id: crypto.randomUUID(),
      name: 'Squeeze True Switch',
    });
    expect(
      canAssignSpellToMatrix(
        matrix,
        formExchange,
        character.magic.spells,
        character.knacks,
      ),
    ).toBe(true);
    matrix.spellIds.push(formExchange.id);
    expect(
      matrixCapacityUsed(matrix, character.magic.spells, character.knacks),
    ).toBe(8);

    const air = spell('Resist Element', 1, 'air', 'Air');
    const fire = spell('Resist Element', 1, 'fire', 'Fire');
    const formMatrix = { ...matrix, rank: 1, spellIds: [air.id] };
    character.magic.spells.push(air, fire);
    expect(
      canAssignSpellToMatrix(
        formMatrix,
        fire,
        character.magic.spells,
        character.knacks,
      ),
    ).toBe(true);

    expect(matrixSharingRules.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        'ephemeral-bolt',
        'missiles',
        'purification',
        'blazing-fists',
        'encoded-communique',
        'phantom-astral-spear',
        'phantom-crow-tear',
        'phantom-espagra-frenzy',
        'phantom-fireball',
        'phantom-flame',
        'phantom-lightning',
        'phantom-liquid-arrow',
        'phantom-star-shower',
        'switch-pair',
        'true-switch-pair',
        'switch-trio',
      ]),
    );
  });
  it('grants and advances the two free magician matrices', () => {
    const character = createBlankEarthdawn4eCharacter();
    const wizard = earthdawnDisciplines.find(({ name }) => name === 'Wizard')!;
    character.disciplines.push({
      id: crypto.randomUUID(),
      disciplineId: wizard.id,
      name: wizard.name,
      circle: 1,
      startedAtCircle: 1,
      questor: false,
      custom: false,
      definitionId: wizard.id,
      sourceId: wizard.sourceId,
      source: wizard.source,
      page: wizard.page,
      unresolved: false,
    });
    const novice = reconcileFreeMatrices(character);
    expect(novice.magic.matrices).toHaveLength(2);
    expect(
      novice.magic.matrices.every(({ talentId }) => Boolean(talentId)),
    ).toBe(true);
    expect(
      novice.talents.filter(({ name }) => isMatrixTalent(name)),
    ).toHaveLength(2);
    expect(
      novice.magic.matrices.every(
        ({ type, rank }) => type === 'standard' && rank === 1,
      ),
    ).toBe(true);
    novice.disciplines[0]!.circle = 5;
    const journeyman = reconcileFreeMatrices(novice);
    expect(journeyman.magic.matrices.map(({ type }) => type)).toEqual([
      'enhanced',
      'standard',
    ]);
    expect(journeyman.magic.matrices.every(({ rank }) => rank === 5)).toBe(
      true,
    );
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
  it('shifts talent cost tiers for additional Disciplines and Versatility', () => {
    expect(equivalentTalentCircle(1, 0)).toBe(1);
    expect(equivalentTalentCircle(1, 1)).toBe(5);
    expect(equivalentTalentCircle(1, 2)).toBe(9);
    expect(equivalentTalentCircle(5, 1)).toBe(9);
    expect(equivalentTalentCircle(13, 3)).toBe(13);
    expect(equivalentTalentCircle(1, 0, true)).toBe(5);
  });
  it('keeps only the primary magician Discipline free matrices', () => {
    const character = createBlankEarthdawn4eCharacter();
    const wizard = earthdawnDisciplines.find(({ name }) => name === 'Wizard')!;
    const elementalist = earthdawnDisciplines.find(
      ({ name }) => name === 'Elementalist',
    )!;
    character.disciplines = [wizard, elementalist].map((definition) => ({
      id: crypto.randomUUID(),
      definitionId: definition.id,
      sourceId: definition.sourceId,
      source: definition.source,
      page: definition.page,
      unresolved: false,
      disciplineId: definition.id,
      name: definition.name,
      circle: 5,
      startedAtCircle: 1,
      questor: false,
      custom: false,
    }));
    const reconciled = reconcileFreeMatrices(character);
    expect(reconciled.magic.matrices).toHaveLength(2);
    expect(
      new Set(reconciled.magic.matrices.map(({ restriction }) => restriction)),
    ).toEqual(new Set(['Wizard']));
  });
  it('adds an exploding Karma die to a Step roll', () => {
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array)[0] = 2;
      return array;
    });
    const result = addKarmaDie(rollStep(4), 6);
    expect(result.dice).toContain('Karma');
    expect(result.rolls.at(-1)?.sides).toBe(6);
    vi.restoreAllMocks();
  });
  it('stores reusable custom Discipline drafts locally without publishing them', () => {
    localStorage.clear();
    const draft = createCustomDisciplineDraft();
    customDisciplineRepository.save({ ...draft, name: 'Test Discipline' });
    expect(customDisciplineRepository.list()).toContainEqual(
      expect.objectContaining({ name: 'Test Discipline', status: 'draft' }),
    );
    customDisciplineRepository.remove(draft.id);
    expect(customDisciplineRepository.list()).toEqual([]);
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
      spent: 300,
      corrections: 0,
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
          (page == null || page > 0),
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

  it('rejects unsafe or oversized portrait sources before decoding them', async () => {
    await expect(
      processEarthdawnPortrait(
        new File(['<svg/>'], 'portrait.svg', { type: 'image/svg+xml' }),
        'file',
      ),
    ).rejects.toThrow(/PNG, JPEG, or WebP/);
    await expect(
      processEarthdawnPortrait(
        new File(
          [new Uint8Array(EARTHDAWN_PORTRAIT_MAX_BYTES + 1)],
          'portrait.png',
          { type: 'image/png' },
        ),
        'file',
      ),
    ).rejects.toThrow(/5 MB/);
  });
});
