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
import { earthdawnPathProfiles } from '../../src/games/earthdawn4e/path-profiles';
import {
  earthdawnBasicRules,
  earthdawnCreationRules,
} from '../../src/games/earthdawn4e/basic-rules';
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
import { earthdawnSpellbookSupplement } from '../../src/games/earthdawn4e/spellbook-supplement';
import {
  auditEarthdawnCatalog,
  displayCatalogText,
} from '../../src/games/earthdawn4e/catalog-audit';
import {
  EARTHDAWN_PORTRAIT_MAX_BYTES,
  processEarthdawnPortrait,
} from '../../src/games/earthdawn4e/portrait';
import {
  appendRoll,
  advancementTargetExists,
  attributeIncreaseCost,
  attributeTraining,
  createLegendEntry,
  changeWallet,
  formatWallet,
  formatWalletAsSilver,
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
  refundBlockReason,
  spellLearningCost,
  threadRankCost,
  walletTotalCopper,
} from '../../src/games/earthdawn4e/rules';
import {
  createCustomDisciplineDraft,
  customDisciplineRepository,
} from '../../src/games/earthdawn4e/custom-discipline-repository';
import {
  matchingSharingRule,
  matrixSharingRules,
} from '../../src/games/earthdawn4e/matrix-sharing';
import { createHighCircleMatrixFixture } from '../fixtures/earthdawn-high-circle';
import {
  creatorEquipmentAdjustment,
  creatorWeaponSizeCompatibility,
  finalizeEarthdawnCreation,
  reopenEarthdawnCreation,
  reviewEarthdawnCreation,
} from '../../src/games/earthdawn4e/creator-rules';

describe('Earthdawn Fourth Edition module', () => {
  it.each([
    ['Dwarf', 1, 'one-handed', true],
    ['Dwarf', 5, 'two-handed', true],
    ['Dwarf', 6, 'incompatible', false],
    ['Elf', 6, 'two-handed', true],
    ['Human', 7, 'incompatible', false],
    ['Obsidiman', 1, 'incompatible', false],
    ['Obsidiman', 7, 'two-handed', true],
    ['Ork', 3, 'one-handed', true],
    ['Troll', 2, 'one-handed', true],
    ['T’skrang', 2, 'tail-compatible', true],
    ['T’skrang', 6, 'two-handed', true],
    ['Windling', 1, 'one-handed', true],
    ['Windling', 2, 'two-handed', true],
    ['Windling', 3, 'incompatible', false],
  ] as const)('validates %s Size %i as %s', (race, size, mode, compatible) => {
    expect(creatorWeaponSizeCompatibility(race, size)).toMatchObject({
      mode,
      compatible,
    });
  });

  it('treats a stored Windling balance as legal and reports unknown sizes honestly', () => {
    expect(
      creatorWeaponSizeCompatibility('Windling', 5, 'windling-balanced'),
    ).toMatchObject({ compatible: true, mode: 'balanced' });
    expect(creatorWeaponSizeCompatibility('Human', 0)).toMatchObject({
      compatible: true,
      mode: 'unknown',
    });
  });

  it('quotes racial armor, T’skrang fittings, Windling balancing, and magic exemptions', () => {
    const armor = {
      ...earthdawnCatalog.find(
        (entry) => entry.equipmentMetadata?.category === 'armor',
      )!,
      price: { amount: 100, denomination: 'sp' as const },
      mechanics: JSON.stringify({ weight: 20, physicalArmor: 3 }),
    };
    expect(creatorEquipmentAdjustment(armor, 'Troll')).toMatchObject({
      baseCopper: 1000,
      adjustedCopper: 1250,
      adjustedWeight: 25,
    });
    expect(creatorEquipmentAdjustment(armor, 'Windling')).toMatchObject({
      adjustedCopper: 750,
      adjustedWeight: 4,
    });
    expect(
      creatorEquipmentAdjustment(armor, 'T’skrang', 'tail-opening'),
    ).toMatchObject({ adjustedCopper: 1100, adjustedWeight: 20 });
    expect(
      creatorEquipmentAdjustment(armor, 'T’skrang', 'full-tail'),
    ).toMatchObject({ adjustedCopper: 1250, adjustedWeight: 22 });

    const weapon = {
      ...armor,
      kind: 'weapon' as const,
      equipmentMetadata: {
        ...armor.equipmentMetadata!,
        category: 'weapon',
      },
    };
    expect(
      creatorEquipmentAdjustment(weapon, 'Windling', 'windling-balanced'),
    ).toMatchObject({ adjustedCopper: 1250, costMultiplier: 1.25 });

    const meal = {
      ...armor,
      name: 'Inn Meal',
      equipmentMetadata: {
        ...armor.equipmentMetadata!,
        category: 'food service',
      },
    };
    expect(creatorEquipmentAdjustment(meal, 'Windling')).toMatchObject({
      adjustedCopper: 500,
      costMultiplier: 0.5,
    });

    const magicArmor = {
      ...armor,
      equipmentMetadata: {
        ...armor.equipmentMetadata!,
        category: 'magic armor',
      },
    };
    expect(creatorEquipmentAdjustment(magicArmor, 'Troll')).toMatchObject({
      adjustedCopper: 1000,
      adjustedWeight: 20,
      exempt: true,
    });
  });

  it('finalizes creator purchases exactly once and grants the free starting kit', () => {
    const character = reconcileRace(
      createBlankEarthdawn4eCharacter(),
      earthdawnRaces.find(({ name }) => name === 'Human')!,
    );
    character.creation.enforceRules = false;
    character.creation.overrides.push({
      id: crypto.randomUUID(),
      code: 'creator-global-override',
      reason: 'Test incomplete allocations.',
      createdAt: '2026-10-10T12:00:00.000Z',
    });
    character.equipment.push({
      id: crypto.randomUUID(),
      definitionId: null,
      sourceId: null,
      source: null,
      page: null,
      unresolved: false,
      name: 'Copper test item',
      type: 'equipment',
      description: '',
      category: 'equipment',
      quantity: 3,
      value: '7 cp',
      costSilver: 0.7,
      price: { amount: 7, denomination: 'cp' },
      weight: 0,
      inUse: false,
      physicalArmor: 0,
      mysticArmor: 0,
      physicalDefense: 0,
      mysticDefense: 0,
      initiativePenalty: 0,
      shatterThreshold: 0,
      forgedBonus: 0,
      availability: '',
      size: 0,
      modifiers: [],
      metadataOverrides: [],
      details: {},
      notes: '',
      creationOwned: true,
      creationAcquisition: 'purchase',
      creationPriceCopper: 7,
      creationFitting: null,
    });
    const finished = finalizeEarthdawnCreation(character, {
      now: '2026-10-10T12:00:00.000Z',
      override: true,
    });
    expect(finished.wealth).toMatchObject({ gold: 9, silver: 7, copper: 9 });
    expect(finished.creation.purchaseTotalCopper).toBe(21);
    expect(finished.creation.finalizationVersion).toBe(1);
    expect(() => earthdawn4eCharacterSchema.parse(finished)).not.toThrow();
    expect(
      finished.equipment
        .filter(
          ({ creationAcquisition }) => creationAcquisition === 'starting-kit',
        )
        .map(({ name }) => name),
    ).toEqual(
      expect.arrayContaining([
        'Adventurer’s Kit',
        'Artisan Tools',
        'Starting Clothing',
        'One Week of Trail Rations',
      ]),
    );
    expect(finalizeEarthdawnCreation(finished)).toBe(finished);
  });

  it('reopens from the finalization snapshot and can finalize again exactly once', () => {
    const character = reconcileRace(
      createBlankEarthdawn4eCharacter(),
      earthdawnRaces.find(({ name }) => name === 'Human')!,
    );
    character.creation.enforceRules = false;
    const finished = finalizeEarthdawnCreation(character, {
      now: '2026-10-10T12:00:00.000Z',
      override: true,
    });
    const postCreationNote = {
      id: crypto.randomUUID(),
      kind: 'general' as const,
      title: 'Kept after reopen',
      body: 'Manual post-creation record.',
      createdAt: '2026-10-10T12:05:00.000Z',
      updatedAt: '2026-10-10T12:05:00.000Z',
      sessionDate: '',
      collapsed: false,
    };
    finished.notes.entries.push(postCreationNote);
    const reopened = reopenEarthdawnCreation(
      finished,
      '2026-10-10T13:00:00.000Z',
    );
    expect(reopened.creation.status).toBe('draft');
    expect(reopened.creation.finalizationVersion).toBe(0);
    expect(reopened.creation.revisionHistory).toHaveLength(1);
    expect(walletTotalCopper(reopened.wealth)).toBe(
      walletTotalCopper(character.wealth),
    );
    expect(
      reopened.equipment.some(
        ({ creationAcquisition }) => creationAcquisition === 'starting-kit',
      ),
    ).toBe(false);
    expect(reopened.notes.entries).toContainEqual(postCreationNote);

    const revised = finalizeEarthdawnCreation(reopened, {
      now: '2026-10-10T14:00:00.000Z',
      override: true,
    });
    expect(revised.creation.revisionHistory).toHaveLength(1);
    expect(revised.wealth).toEqual(finished.wealth);
    expect(finalizeEarthdawnCreation(revised)).toBe(revised);
    expect(() => earthdawn4eCharacterSchema.parse(revised)).not.toThrow();
  });

  it('refuses to invent a rollback for legacy finalized characters', () => {
    const legacy = createBlankEarthdawn4eCharacter({ status: 'finalized' });
    expect(() => reopenEarthdawnCreation(legacy)).toThrow(
      /no safe creation snapshot/i,
    );
  });

  it('grants a grimoire only to a qualifying magician Discipline', () => {
    const wizard = earthdawnDisciplines.find(({ name }) => name === 'Wizard')!;
    const magician = createBlankEarthdawn4eCharacter();
    magician.creation.enforceRules = false;
    magician.disciplines.push({
      id: crypto.randomUUID(),
      definitionId: wizard.id,
      sourceId: wizard.sourceId,
      source: wizard.source,
      page: wizard.page,
      unresolved: false,
      disciplineId: wizard.id,
      name: wizard.name,
      circle: 1,
      startedAtCircle: 1,
      questor: false,
      custom: false,
    });
    const finished = finalizeEarthdawnCreation(magician, { override: true });
    expect(finished.equipment.some(({ name }) => name === 'Grimoire')).toBe(
      true,
    );
    expect(
      finished.equipment.find(({ name }) => name === 'Grimoire'),
    ).toMatchObject({
      creationAcquisition: 'starting-kit',
      creationPriceCopper: 0,
    });
  });

  it('persists attribute allocations and initializes Karma from unused points', () => {
    const character = reconcileRace(
      createBlankEarthdawn4eCharacter(),
      earthdawnRaces.find(({ name }) => name === 'Windling')!,
    );
    character.attributes.dexterity.purchased = 4;
    character.creation.enforceRules = false;
    const finished = finalizeEarthdawnCreation(character, { override: true });
    expect(finished.creation.attributePoints.dexterity).toBe(4);
    expect(finished.health.karmaMaximum).toBe(26);
    expect(finished.health.karmaCurrent).toBe(26);
  });

  it.each(earthdawnRaces.map((race) => [race.name, race] as const))(
    'initializes %s Karma from its racial modifier and unused points',
    (_name, race) => {
      const character = reconcileRace(createBlankEarthdawn4eCharacter(), race);
      character.creation.enforceRules = false;
      const finished = finalizeEarthdawnCreation(character, {
        override: true,
      });
      expect(finished.health.karmaMaximum).toBe(race.karmaModifier + 25);
      expect(finished.health.karmaCurrent).toBe(finished.health.karmaMaximum);
    },
  );

  it('clamps a GM-approved creator overspend to a valid zero wallet', () => {
    const character = createBlankEarthdawn4eCharacter();
    character.wealth = {
      ...character.wealth,
      gold: 0,
      silver: 0,
      copper: 4,
      startingSilver: 0.4,
    };
    character.equipment.push({
      id: crypto.randomUUID(),
      definitionId: null,
      sourceId: null,
      source: null,
      page: null,
      unresolved: true,
      name: 'Costly item',
      type: 'equipment',
      description: '',
      category: 'equipment',
      quantity: 1,
      value: '5 cp',
      costSilver: 0.5,
      price: { amount: 5, denomination: 'cp' },
      weight: 0,
      inUse: false,
      physicalArmor: 0,
      mysticArmor: 0,
      physicalDefense: 0,
      mysticDefense: 0,
      initiativePenalty: 0,
      shatterThreshold: 0,
      forgedBonus: 0,
      availability: '',
      size: 0,
      modifiers: [],
      metadataOverrides: [],
      details: {},
      notes: '',
    });
    const finished = finalizeEarthdawnCreation(character, { override: true });
    expect(finished.wealth).toMatchObject({ gold: 0, silver: 0, copper: 0 });
    expect(
      finished.equipment.find(({ name }) => name === 'Costly item'),
    ).toMatchObject({
      creationOwned: true,
      creationAcquisition: 'purchase',
      creationPriceCopper: 5,
    });
  });

  it('blocks over-budget spells and skills while advising under-allocation', () => {
    const character = createBlankEarthdawn4eCharacter();
    character.skills.push({
      id: crypto.randomUUID(),
      definitionId: null,
      sourceId: null,
      source: null,
      page: null,
      unresolved: true,
      name: 'Overtrained',
      rank: 4,
      freeRank: 4,
      attribute: 'perception',
      bonus: 0,
      notes: '',
      category: 'general',
      action: '',
      strain: 0,
      creationOwned: true,
    });
    const review = reviewEarthdawnCreation(character);
    expect(review.blockers).toContain('Overtrained exceeds starting Rank 3.');
    expect(review.advisories).toContain('No race selected.');
  });

  it('provides separate, numerically ordered play and creation rules', () => {
    expect(earthdawnBasicRules).toHaveLength(10);
    expect(earthdawnBasicRules.map(({ kind }) => kind)).toEqual(
      Array(10).fill('basic-rule'),
    );
    expect(
      earthdawnBasicRules.map(({ ruleMetadata }) => ruleMetadata?.order),
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(earthdawnBasicRules[0]?.mechanics).toContain('DN + 15 to +19');
    expect(earthdawnBasicRules[6]?.mechanics).toContain('Last Chance Salve');

    expect(earthdawnCreationRules).toHaveLength(10);
    expect(earthdawnCreationRules.map(({ kind }) => kind)).toEqual(
      Array(10).fill('creation-rule'),
    );
    expect(
      earthdawnCreationRules.map(({ ruleMetadata }) => ruleMetadata?.order),
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(earthdawnCreationRules[2]?.mechanics).toContain(
      '+8 Total cost 1 2 3 5 7 9 12 15',
    );
    expect(earthdawnCreationRules[7]?.mechanics).toContain(
      '8 additional ranks across General, Knowledge, Artisan, or Language',
    );
  });
  it('records the supplied guided Mystic Path profiles without treating military branches as Paths', () => {
    expect(earthdawnPathProfiles.map(({ id }) => id)).toEqual([
      'outcast',
      'windmaster',
      'tail-dancer',
    ]);
    expect(
      earthdawnPathProfiles.find(({ id }) => id === 'outcast'),
    ).toMatchObject({
      initiationCost: 200,
      maximumRank: 5,
      talentCostTier: 'journeyman',
    });
    expect(
      earthdawnPathProfiles.find(({ id }) => id === 'windmaster'),
    ).toMatchObject({
      race: 'Windling',
      bloodMagicDamage: 2,
      requiredTalentRanks: { 'Melee Weapons': 5 },
    });
    expect(
      earthdawnPathProfiles.find(({ id }) => id === 'tail-dancer'),
    ).toMatchObject({
      race: 'T’skrang',
      requiredTalentRanks: { Dancing: 5, 'Melee Weapons': 5 },
    });
    expect(
      earthdawnPathProfiles.some(({ name }) => name.includes('Silver Branch')),
    ).toBe(false);
  });
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
    expect(earthdawnSpells).toHaveLength(479);
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
    expect(earthdawnSpellbookSupplement).toHaveLength(15);
    expect(
      earthdawnKnacks.reduce(
        (total, knack) => total + (knack.knackMetadata?.variants.length ?? 0),
        0,
      ),
    ).toBe(255);
    expect(
      new Set(
        earthdawnKnacks.flatMap(
          ({ knackMetadata }) =>
            knackMetadata?.variants.map(({ key }) => key) ?? [],
        ),
      ).size,
    ).toBe(255);
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
        'ed4.deeper-secrets',
      ]),
    );
    expect(
      earthdawnSpells.find(({ name }) => name === 'True Blazing Fists of Rage'),
    ).toMatchObject({
      page: 59,
      sourceId: 'ed4.deeper-secrets',
      spellMetadata: {
        effectText: expect.stringContaining('WIL+4 Mystic damage'),
        keywords: ['Illusion'],
      },
    });
    expect(
      earthdawnKnacks.find(({ name }) => name === 'Encoded Communique'),
    ).toMatchObject({
      verification: 'verified',
      page: 399,
      knackMetadata: {
        variants: expect.arrayContaining([
          expect.objectContaining({
            sourceId: 'ed4.deeper-secrets',
            page: 399,
            minimumRank: 5,
            disciplineCircle: 7,
          }),
          expect.objectContaining({
            sourceId: 'ed4.mystic-paths',
            page: 248,
          }),
        ]),
      },
    });
    const squeezeExpectations = [
      ['Squeeze Phantom Astral Spear', 1, 5, 5, 1, 392],
      ['Squeeze Phantom Crow Tear', 1, 5, 5, 1, 393],
      ['Squeeze Phantom Espagra Frenzy', 8, 10, 10, 1, 393],
      ['Squeeze Phantom Fireball', 5, 7, 7, 1, 394],
      ['Squeeze Phantom Flame', 2, 5, 5, 1, 394],
      ['Squeeze Phantom Lightning', 4, 6, 6, 1, 394],
      ['Squeeze Phantom Liquid Arrow', 2, 5, 5, 1, 394],
      ['Squeeze Phantom Star Shower', 7, 9, 9, 1, 395],
      ['Squeeze Switch', 5, 7, 7, 2, 399],
      ['Squeeze True Switch', 6, 9, 9, 2, 400],
    ] as const;
    for (const [
      name,
      knackCircle,
      minimumRank,
      disciplineCircle,
      bloodMagicDamage,
      page,
    ] of squeezeExpectations) {
      expect(
        earthdawnKnacks.find((knack) => knack.name === name),
      ).toMatchObject({
        verification: 'verified',
        sourceId: 'ed4.deeper-secrets',
        page,
        knackMetadata: {
          variants: [
            expect.objectContaining({
              knackCircle,
              minimumRank,
              discipline: 'Illusionist',
              disciplineCircle,
              bloodMagicDamage,
              matrixRestriction: 'squeeze',
              actionText: 'Passive (spell matrix attunement)',
              sourceId: 'ed4.deeper-secrets',
              page,
            }),
          ],
        },
      });
    }
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
    expect(new Set(earthdawnSpells.map(({ id }) => id)).size).toBe(479);
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
  it('audits catalog identities, variants, citations, and unavailable sentinels', () => {
    const audit = auditEarthdawnCatalog();
    expect(audit.errors).toEqual([]);
    expect(audit.definitions).toBe(earthdawnCatalog.length);
    expect(audit.variants).toBeGreaterThan(700);
    expect(audit.unavailableFields).toBeGreaterThan(0);
    expect(displayCatalogText('Not in source (Step is rank)')).toBe('');
    expect(displayCatalogText('Standard action')).toBe('Standard action');
  });
  it('manages decimal coinage with automatic change', () => {
    const character = createBlankEarthdawn4eCharacter();
    expect(walletTotalCopper(character.wealth)).toBe(1000);
    expect(moneyToCopper(2, 'gp')).toBe(200);
    const changed = changeWallet(character.wealth, -1)!;
    expect(changed).toMatchObject({ gold: 9, silver: 9, copper: 9 });
    expect(formatWallet(changed)).toBe('9 gp · 9 sp · 9 cp');
    expect(formatWalletAsSilver(changed)).toBe('99 sp 9 cp');
    expect(
      formatWalletAsSilver({
        ...character.wealth,
        gold: 1,
        silver: 2,
        copper: 5,
      }),
    ).toBe('12 sp 5 cp');
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
      divided: false,
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
      divided: false,
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
  it('verifies every matrix-sharing rule and the high-Circle migration fixture', () => {
    const fixture = createHighCircleMatrixFixture();
    expect(earthdawn4eCharacterSchema.parse(fixture)).toEqual(fixture);
    expect(
      earthdawn4eCharacterSchema.parse(JSON.parse(JSON.stringify(fixture))),
    ).toEqual(fixture);
    expect(
      fixture.magic.spells.some(
        ({ name, formKey }) => name === 'Resist Element' && formKey == null,
      ),
    ).toBe(true);
    expect(
      matrixCapacityUsed(
        fixture.magic.matrices[1]!,
        fixture.magic.spells,
        fixture.knacks,
      ),
    ).toBe(11);

    const spell = (name: string) => ({
      ...fixture.magic.spells[0]!,
      id: crypto.randomUUID(),
      name,
      circle: 1,
      formKey: null,
      formLabel: null,
    });
    const knack = (name: string) => ({
      ...fixture.knacks[0]!,
      id: crypto.randomUUID(),
      name,
    });
    for (const rule of matrixSharingRules) {
      const spells = rule.members.map(spell);
      const knacks = (rule.requiredKnacks ?? []).map(knack);
      const matrix = {
        ...fixture.magic.matrices[0]!,
        id: crypto.randomUUID(),
        spellIds: spells.map(({ id }) => id),
      };
      expect(matchingSharingRule(spells, knacks, matrix)?.id).toBe(rule.id);
      if (rule.kind === 'squeeze') {
        expect(
          matchingSharingRule(spells, knacks, {
            ...matrix,
            type: 'shared',
          }),
        ).toBeNull();
        expect(
          matchingSharingRule(spells, knacks, {
            ...matrix,
            type: 'object',
            originType: 'item',
          }),
        ).toBeNull();
        expect(
          matchingSharingRule(spells, knacks, {
            ...matrix,
            divided: true,
          }),
        ).toBeNull();
      }
    }

    const switchSpellForIssue = spell('Switch');
    const trueSwitchForIssue = spell('True Switch');
    const unrelatedForIssue = spell('Unrelated Spell');
    const spellsForIssue = [
      switchSpellForIssue,
      trueSwitchForIssue,
      unrelatedForIssue,
    ];
    const importedShared = {
      ...fixture.magic.matrices[1]!,
      spellIds: [
        switchSpellForIssue.id,
        trueSwitchForIssue.id,
        unrelatedForIssue.id,
      ],
    };
    expect(matrixIssues(importedShared, spellsForIssue, 15, [])).toEqual(
      expect.arrayContaining([
        'Missing matrix-sharing knack: Squeeze Switch.',
        'Squeeze knacks cannot be used with Shared, divided, or external spell matrices.',
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
    expect(refundBlockReason([award, purchase, dependent], purchase.id)).toBe(
      'Avoid Blow has a later advancement.',
    );

    const prerequisite = createLegendEntry({
      type: 'discipline',
      amount: -500,
      targetId: crypto.randomUUID(),
      targetName: 'Illusionist',
      description: 'Begin Illusionist',
    });
    const child = createLegendEntry({
      type: 'talent',
      amount: -300,
      targetId: crypto.randomUUID(),
      targetName: 'Spellcasting',
      description: 'Advance Spellcasting',
      dependsOnEntryIds: [prerequisite.id],
    });
    expect(refundableLedgerEntry([prerequisite, child], prerequisite.id)).toBe(
      false,
    );
    expect(refundBlockReason([prerequisite, child], prerequisite.id)).toBe(
      'Spellcasting depends on this purchase.',
    );

    const exactSpell = {
      ...createHighCircleMatrixFixture().magic.spells[0]!,
      id: crypto.randomUUID(),
      definitionId: 'shared-definition',
      formKey: 'air',
    };
    const siblingSpell = {
      ...exactSpell,
      id: crypto.randomUUID(),
      formKey: 'fire',
    };
    const targetCharacter = createBlankEarthdawn4eCharacter();
    targetCharacter.magic.spells.push(exactSpell, siblingSpell);
    const exactPurchase = createLegendEntry({
      type: 'spell',
      amount: -100,
      targetId: exactSpell.id,
      targetName: exactSpell.name,
      description: 'Learn Air form',
      definitionId: 'shared-definition',
      formKey: 'air',
    });
    const legacyPurchase = createLegendEntry({
      type: 'spell',
      amount: -100,
      targetId: 'shared-definition',
      targetName: exactSpell.name,
      description: 'Legacy spell purchase',
    });
    expect(advancementTargetExists(targetCharacter, exactPurchase)).toBe(true);
    expect(advancementTargetExists(targetCharacter, legacyPurchase)).toBe(
      false,
    );
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
