import type { ModuleValueSchemaDefinition } from '../../../modules/schema/module-envelope';
import {
  exaltedAbilities,
  exaltedAttributeGroups,
  exaltedSectionGroupIds,
  exaltedVirtues,
} from '../definitions';

const string = (maximum = 20_000): ModuleValueSchemaDefinition => ({
  type: 'string',
  required: true,
  maxLength: maximum,
});
const optionalString = (maximum = 20_000): ModuleValueSchemaDefinition => ({
  type: 'string',
  maxLength: maximum,
});
const integer = (
  minimum: number,
  maximum: number,
): ModuleValueSchemaDefinition => ({
  type: 'integer',
  required: true,
  minimum,
  maximum,
});
const boolean = (): ModuleValueSchemaDefinition => ({
  type: 'boolean',
  required: true,
});
const enumeration = (
  values: readonly string[],
): ModuleValueSchemaDefinition => ({
  type: 'enum',
  required: true,
  values: [...values],
});
const nullable = (
  item: ModuleValueSchemaDefinition,
): ModuleValueSchemaDefinition => ({ type: 'nullable', required: true, item });
const object = (
  properties: Record<string, ModuleValueSchemaDefinition>,
): ModuleValueSchemaDefinition => ({
  type: 'object',
  required: true,
  properties,
});
const array = (
  items: ModuleValueSchemaDefinition,
  maximum = 10_000,
): ModuleValueSchemaDefinition => ({
  type: 'array',
  required: true,
  items,
  maximum,
});

const unresolvedReference = nullable(
  object({
    definitionId: string(500),
    label: string(500),
    summary: string(),
    source: string(500),
    page: string(100),
    repairNotes: string(),
    ownedDataJson: string(),
  }),
);

const selectedReference = (
  extra: Record<string, ModuleValueSchemaDefinition>,
) =>
  object({
    id: string(100),
    definitionId: string(500),
    unresolvedReference,
    ...extra,
  });

const equipmentItem = object({
  id: string(100),
  kind: enumeration(['weapon', 'armor', 'shield', 'ammunition']),
  definitionId: nullable(string(500)),
  unresolvedReference,
  customName: string(500),
  modeId: nullable(string(500)),
  quality: enumeration(['poor', 'normal', 'exceptional', 'perfect', 'custom']),
  qualityAdjustments: object({
    speed: integer(-9, 9),
    accuracy: integer(-9, 9),
    damage: integer(-9, 9),
    defense: integer(-9, 9),
    rate: integer(-9, 9),
    range: integer(-999, 999),
  }),
  material: enumeration([
    'none',
    'orichalcum',
    'moonsilver',
    'jade',
    'starmetal',
    'soulsteel',
  ]),
  equipped: boolean(),
  attuned: boolean(),
  committedEssence: integer(0, 999),
  ammunition: object({
    current: nullable(integer(0, 999_999)),
    typeId: nullable(string(500)),
  }),
  enhancements: array(
    object({ id: string(100), label: string(500), notes: string() }),
    1_000,
  ),
  notes: string(),
});

const possession = object({
  id: string(100),
  name: string(500),
  kind: enumeration([
    'mundane',
    'weapon',
    'armor',
    'shield',
    'ammunition',
    'artifact',
    'hearthstone',
    'consumable',
    'other',
  ]),
  quantity: integer(1, 999_999),
  carried: boolean(),
  equipped: boolean(),
  stored: boolean(),
  lost: boolean(),
  loaned: boolean(),
  notes: string(),
  linkedEquipmentId: nullable(string(100)),
  linkedBackgroundIds: array(string(100), 1_000),
  artifact: nullable(
    object({
      rating: integer(0, 5),
      material: string(500),
      attuned: boolean(),
      attunementCost: integer(0, 999),
      committedEssence: integer(0, 999),
      powers: string(),
      source: string(1_000),
    }),
  ),
  createdAt: string(100),
});

export const exalted1eModuleCharacterSchema: ModuleValueSchemaDefinition =
  object({
    sheetType: enumeration(['solar', 'dragon-blooded']),
    identity: object({
      name: string(500),
      player: string(500),
      concept: string(500),
      nature: string(500),
      caste: string(500),
      aspect: string(500),
      house: string(500),
      anima: string(),
    }),
    attributes: object(
      Object.fromEntries(
        exaltedAttributeGroups.map((group) => [
          group.id,
          object(
            Object.fromEntries(
              group.traits.map((trait) => [trait.id, integer(1, 5)]),
            ),
          ),
        ]),
      ),
    ),
    abilities: object(
      Object.fromEntries(
        exaltedAbilities.map((ability) => [ability.id, integer(0, 5)]),
      ),
    ),
    favoredAbilities: array(
      enumeration(exaltedAbilities.map(({ id }) => id)),
      exaltedAbilities.length,
    ),
    backgrounds: array(
      selectedReference({
        rating: integer(0, 5),
        notes: string(),
        label: string(500),
        description: string(),
        linkedEntityIds: array(string(100), 1_000),
        createdAt: string(100),
      }),
      1_000,
    ),
    languages: array(
      object({
        id: string(100),
        definitionId: nullable(string(500)),
        unresolvedReference,
        customName: string(500),
        proficiency: enumeration(['native', 'fluent', 'limited', 'temporary']),
        spoken: boolean(),
        written: boolean(),
        notes: string(),
        sourceType: enumeration([
          'linguistics',
          'charm',
          'spell',
          'artifact',
          'custom',
        ]),
        sourceId: nullable(string(500)),
      }),
      1_000,
    ),
    derangements: array(
      object({
        id: string(100),
        definitionId: nullable(string(500)),
        unresolvedReference,
        customName: string(500),
        description: string(),
        mechanics: string(),
        duration: enumeration([
          'temporary',
          'indefinite',
          'permanent',
          'custom',
        ]),
        customDuration: string(500),
        status: enumeration(['active', 'suppressed', 'dormant', 'resolved']),
        sourceType: enumeration(['flaw', 'charm', 'spell', 'trauma', 'custom']),
        trigger: string(),
        suppressionRules: string(),
        recoveryRules: string(),
        notes: string(),
        linkedMeritFlawId: nullable(string(100)),
      }),
      1_000,
    ),
    experienceLedger: array(
      object({
        id: string(100),
        date: string(100),
        session: string(500),
        type: enumeration(['award', 'purchase', 'refund', 'adjustment']),
        amount: integer(-999_999, 999_999),
        category: string(500),
        targetId: nullable(string(500)),
        targetName: string(500),
        previousRating: nullable(integer(0, 999)),
        newRating: nullable(integer(0, 999)),
        description: string(),
        notes: string(),
        createdAt: string(100),
      }),
      10_000,
    ),
    downtimeAdvancement: array(
      object({
        id: string(100),
        startYear: string(100),
        endYear: string(100),
        yearsElapsed: integer(0, 999_999),
        attributesWillpowerGained: string(),
        abilitiesVirtuesGained: string(),
        backgroundsGained: string(),
        essenceIncrease: integer(0, 99),
        charmsLearned: string(),
        comboLearned: string(),
        notes: string(),
        createdAt: string(100),
      }),
      1_000,
    ),
    possessions: array(possession, 10_000),
    manses: array(
      object({
        id: string(100),
        name: string(500),
        rating: integer(0, 5),
        aspect: string(500),
        location: string(1_000),
        description: string(),
        powers: string(),
        source: string(1_000),
        linkedBackgroundIds: array(string(100), 1_000),
        createdAt: string(100),
      }),
      1_000,
    ),
    hearthstones: array(
      object({
        id: string(100),
        name: string(500),
        rating: integer(0, 5),
        aspect: string(500),
        powers: string(),
        source: string(1_000),
        notes: string(),
        linkedManseId: nullable(string(100)),
        socketedPossessionId: nullable(string(100)),
        createdAt: string(100),
      }),
      1_000,
    ),
    virtues: object(
      Object.fromEntries(exaltedVirtues.map(({ id }) => [id, integer(0, 5)])),
    ),
    willpower: object({
      permanent: integer(0, 10),
      temporary: integer(0, 10),
    }),
    essence: object({
      rating: integer(1, 6),
      personal: integer(0, 999),
      peripheral: integer(0, 999),
      committed: integer(0, 999),
    }),
    limit: object({ rating: integer(0, 10), virtueFlaw: string() }),
    meritsFlaws: object({
      merits: array(
        selectedReference({
          chosenCost: integer(0, 100),
          choiceLabel: string(500),
          notes: string(),
          linkedDerangementId: nullable(string(100)),
        }),
        1_000,
      ),
      flaws: array(
        selectedReference({
          chosenCost: integer(0, 100),
          choiceLabel: string(500),
          notes: string(),
          linkedDerangementId: nullable(string(100)),
        }),
        1_000,
      ),
    }),
    powers: object({
      charms: array(selectedReference({ notes: string() }), 10_000),
      spells: array(selectedReference({ notes: string() }), 10_000),
    }),
    equipment: object({
      weapons: array(equipmentItem, 10_000),
      armor: array(equipmentItem, 10_000),
      shields: array(equipmentItem, 10_000),
      ammunition: array(equipmentItem, 10_000),
    }),
    combat: object({
      profile: enumeration(['classic', 'power-combat']),
      specialties: array(
        object({
          id: string(100),
          abilityId: enumeration(exaltedAbilities.map(({ id }) => id)),
          label: string(500),
          rating: integer(1, 3),
        }),
        1_000,
      ),
      woundPenalty: integer(-4, 0),
      staticInitiativeModifier: integer(-99, 99),
      staticDodgeModifier: integer(-99, 99),
    }),
    combos: array(
      object({
        id: string(100),
        name: string(500),
        charmIds: array(string(500), 1_000),
        description: string(),
        tacticalSummary: string(),
        notes: string(),
        createdAt: string(100),
      }),
      1_000,
    ),
    notes: object({
      description: string(),
      history: string(),
      anima: string(),
      weapons: string(),
      experience: string(),
    }),
    sheetLayout: object({
      groupOrder: array(enumeration(exaltedSectionGroupIds), 5),
      mode: enumeration(['build', 'play']),
      buildOrder: array(enumeration(exaltedSectionGroupIds), 5),
      playOrder: array(enumeration(exaltedSectionGroupIds), 5),
    }),
  });

export const optionalOwnedReferenceFields = {
  unresolvedReference,
  ownedDataJson: optionalString(),
};
