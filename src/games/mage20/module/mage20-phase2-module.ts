import { createBlankMageCharacter } from '../../../systems/mage-m20/create-character';
import {
  abilityGroups,
  attributeGroups,
  healthLevels,
  identityFields,
  spheres,
} from '../../../systems/mage-m20/definitions';
import type { ModuleValueSchemaDefinition } from '../../../modules/schema/module-envelope';
import { backgroundCatalog } from '../../../systems/mage-m20/reference/backgrounds';
import { equipmentCatalog } from '../../../systems/mage-m20/reference/equipment';
import {
  instrumentCatalog,
  paradigmCatalog,
  practiceCatalog,
} from '../../../systems/mage-m20/reference/focus';
import {
  combatManeuverCatalog,
  doManeuverCatalog,
} from '../../../systems/mage-m20/reference/maneuvers';
import { meritFlawCatalog } from '../../../systems/mage-m20/reference/merits-flaws';
import { roteCatalog } from '../../../systems/mage-m20/reference/rotes';
import { wonderCatalog } from '../../../systems/mage-m20/reference/wonders';
import {
  MAGE20_GAME_NODE_ID,
  MAGE20_MODULE_ID,
  MAGE20_MODULE_VERSION,
  MAGE20_SHEET_ID,
  MAGE20_SHEET_VERSION,
  mage20DefinitionIdMap,
} from './id-map';

const path = (...segments: string[]) => ({
  root: 'character' as const,
  segments,
});

const componentId = (value: string) =>
  value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

const ratingPaths = (
  root: 'attributes' | 'abilities',
  groups: readonly {
    id: string;
    label: string;
    traits: readonly { id: string }[];
  }[],
) =>
  groups.map((group) => ({
    label: group.label,
    paths: group.traits.map(({ id }) => path(root, group.id, id)),
  }));

const requiredString = (maximum = 500): ModuleValueSchemaDefinition => ({
  type: 'string',
  required: true,
  maxLength: maximum,
});

const optionalString = (maximum = 500): ModuleValueSchemaDefinition => ({
  type: 'string',
  maxLength: maximum,
});

const bool = (): ModuleValueSchemaDefinition => ({
  type: 'boolean',
  required: true,
});

const nullable = (
  item: ModuleValueSchemaDefinition,
): ModuleValueSchemaDefinition => ({ type: 'nullable', required: true, item });

const arrayOf = (
  items: ModuleValueSchemaDefinition,
  maximum = 10_000,
): ModuleValueSchemaDefinition => ({
  type: 'array',
  required: true,
  items,
  maximum,
});

const rating = (minimum: number): ModuleValueSchemaDefinition => ({
  type: 'integer',
  required: true,
  minimum,
  maximum: 5,
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

const optionalInteger = (
  minimum: number,
  maximum: number,
): ModuleValueSchemaDefinition => ({ type: 'integer', minimum, maximum });

const requiredObject = (
  properties: Record<string, ModuleValueSchemaDefinition>,
): ModuleValueSchemaDefinition => ({
  type: 'object',
  required: true,
  properties,
});

const identitySchema = requiredObject(
  Object.fromEntries(identityFields.map(({ id }) => [id, requiredString()])),
);

const attributesSchema = requiredObject(
  Object.fromEntries(
    attributeGroups.map((group) => [
      group.id,
      requiredObject(
        Object.fromEntries(group.traits.map(({ id }) => [id, rating(1)])),
      ),
    ]),
  ),
);

const abilitiesSchema = requiredObject(
  Object.fromEntries(
    abilityGroups.map((group) => [
      group.id,
      requiredObject(
        Object.fromEntries(group.traits.map(({ id }) => [id, rating(0)])),
      ),
    ]),
  ),
);

const focusSelectionProperties = {
  id: requiredString(100),
  definitionId: optionalString(200),
  customName: optionalString(500),
  notes: requiredString(20_000),
  addedAt: requiredString(100),
  unresolvedDefinitionName: optionalString(500),
};
const focusSelectionSchema = requiredObject(focusSelectionProperties);
const instrumentSelectionSchema = requiredObject({
  ...focusSelectionProperties,
  significant: bool(),
});
const backgroundSelectionSchema = requiredObject({
  id: requiredString(100),
  definitionId: requiredString(200),
  displayName: requiredString(500),
  rating: integer(0, 20),
  notes: requiredString(20_000),
  addedAt: requiredString(100),
  pooled: bool(),
  unresolvedDefinitionName: optionalString(500),
});
const meritFlawSelectionSchema = requiredObject({
  id: requiredString(100),
  definitionId: requiredString(200),
  chosenCost: integer(-100, 100),
  notes: requiredString(20_000),
  addedAt: requiredString(100),
});
const wonderSchema = requiredObject({
  id: requiredString(100),
  definitionId: optionalString(200),
  name: requiredString(500),
  typeLabel: requiredString(500),
  rating: nullable(integer(0, 20)),
  powers: requiredString(20_000),
  notes: requiredString(20_000),
  addedAt: requiredString(100),
  unresolvedDefinitionName: optionalString(500),
});
const sphereRequirementSchema = requiredObject({
  sphereId: {
    type: 'enum',
    required: true,
    values: [...spheres.map(({ id }) => id), 'data', 'other'],
  },
  minimum: integer(0, 20),
  maximum: optionalInteger(0, 20),
  label: optionalString(500),
});
const roteSchema = requiredObject({
  id: requiredString(100),
  definitionId: optionalString(200),
  name: requiredString(500),
  sphereRequirements: arrayOf(sphereRequirementSchema, 20),
  requirementNotes: requiredString(20_000),
  effect: requiredString(20_000),
  focusNotes: requiredString(20_000),
  notes: requiredString(20_000),
  addedAt: requiredString(100),
  unresolvedDefinitionName: optionalString(500),
});
const equipmentSchema = requiredObject({
  id: requiredString(100),
  definitionId: optionalString(200),
  name: requiredString(500),
  category: {
    type: 'enum',
    required: true,
    values: ['melee', 'ranged', 'armor', 'gear'],
  },
  description: requiredString(20_000),
  quantity: integer(1, 999),
  equipped: bool(),
  notes: requiredString(20_000),
  addedAt: requiredString(100),
  unresolvedDefinitionName: optionalString(500),
});
const customCombatSchema = requiredObject({
  id: requiredString(100),
  name: requiredString(500),
  description: requiredString(20_000),
  notes: requiredString(20_000),
  addedAt: requiredString(100),
});
const selectedDoSchema = requiredObject({
  id: requiredString(100),
  definitionId: optionalString(200),
  customName: optionalString(500),
  customSummary: optionalString(20_000),
  customRoll: optionalString(500),
  customDifficulty: optionalString(500),
  customDamage: optionalString(500),
  customActions: optionalString(500),
  customSourceTitle: optionalString(500),
  customSourcePage: optionalString(100),
  notes: requiredString(20_000),
  addedAt: requiredString(100),
  unresolvedDefinitionName: optionalString(500),
});

const blank = createBlankMageCharacter();

export const mage20Phase2Defaults = {
  identity: structuredClone(blank.identity),
  attributes: structuredClone(blank.attributes),
  abilities: structuredClone(blank.abilities),
  spheres: structuredClone(blank.spheres),
  affinitySphere: blank.affinitySphere,
  enlightenment: structuredClone(blank.enlightenment),
  health: structuredClone(blank.health),
  repeatableEntries: structuredClone(blank.repeatableEntries),
  experience: structuredClone(blank.experience),
  sheetLayout: {
    mode: 'build',
    groupOrders: {
      build: [
        'character',
        'traits',
        'magick',
        'advantages',
        'condition',
        'gear',
        'paradigm',
        'records',
      ],
      play: [
        'condition',
        'magick',
        'traits',
        'gear',
        'advantages',
        'paradigm',
        'character',
        'records',
      ],
    },
  },
};

export const mage20Phase2Module = {
  format: 'arcane-record-module',
  formatVersion: 1,
  moduleId: MAGE20_MODULE_ID,
  moduleVersion: MAGE20_MODULE_VERSION,
  name: 'Mage: The Ascension 20th Anniversary Edition',
  description:
    'Complete declarative Mage 20 character sheet with local catalogs and play-state controls.',
  author: [{ name: 'Arcane Record' }],
  licenseMetadata: {
    spdxExpression: 'LicenseRef-Mage20',
    notice: 'Game names and terminology belong to their respective owners.',
    provenance:
      'Declarative structure adapted from the existing Arcane Record Mage 20 implementation.',
  },
  minimumCoreVersion: '0.1.0',
  dependencies: [],
  gameNodes: [
    {
      id: MAGE20_GAME_NODE_ID,
      name: 'Mage 20',
      description: 'Mage: The Ascension 20th Anniversary Edition',
      parentId: null,
      order: 0,
      additions: [],
      overrides: [],
      sourceRefIds: ['mage20-character-sheet'],
    },
  ],
  sheetTemplates: [
    {
      id: MAGE20_SHEET_ID,
      templateVersion: MAGE20_SHEET_VERSION,
      gameNodeId: MAGE20_GAME_NODE_ID,
      name: 'Mage 20 Character Sheet',
      description:
        'Declarative Mage 20 sheet with behavioral parity for the existing Arcane Record data model.',
      characterSchema: requiredObject({
        identity: identitySchema,
        attributes: attributesSchema,
        abilities: abilitiesSchema,
        spheres: requiredObject(
          Object.fromEntries(spheres.map(({ id }) => [id, rating(0)])),
        ),
        affinitySphere: {
          type: 'nullable',
          required: true,
          item: {
            type: 'enum',
            required: true,
            values: spheres.map(({ id }) => id),
          },
        },
        enlightenment: requiredObject({
          arete: integer(1, 10),
          willpower: integer(1, 10),
          willpowerTemporary: integer(0, 10),
          quintessence: integer(0, 20),
          paradox: integer(0, 20),
        }),
        health: requiredObject({
          damage: {
            type: 'array',
            required: true,
            items: {
              type: 'enum',
              required: true,
              values: ['bashing', 'lethal', 'aggravated'],
            },
            maximum: 7,
          },
        }),
        repeatableEntries: requiredObject({
          backgrounds: arrayOf(backgroundSelectionSchema),
          merits: arrayOf(meritFlawSelectionSchema),
          flaws: arrayOf(meritFlawSelectionSchema),
          focus: requiredObject({
            paradigms: arrayOf(focusSelectionSchema),
            practices: arrayOf(focusSelectionSchema),
            instruments: arrayOf(instrumentSelectionSchema),
            need: requiredString(20_000),
            culture: requiredString(20_000),
            notes: requiredString(20_000),
          }),
          wonders: arrayOf(wonderSchema),
          rotes: arrayOf(roteSchema),
          equipment: arrayOf(equipmentSchema),
          maneuvers: requiredObject({
            favoriteCombatManeuverIds: arrayOf(requiredString(200)),
            customCombatManeuvers: arrayOf(customCombatSchema),
            selectedDoManeuvers: arrayOf(selectedDoSchema),
          }),
        }),
        experience: requiredObject({
          total: integer(0, 999_999),
          current: integer(0, 999_999),
        }),
        sheetLayout: requiredObject({
          mode: {
            type: 'enum',
            required: true,
            values: ['build', 'play'],
          },
          groupOrders: requiredObject({
            build: {
              type: 'array',
              required: true,
              items: {
                type: 'enum',
                required: true,
                values: [
                  'character',
                  'traits',
                  'magick',
                  'advantages',
                  'condition',
                  'gear',
                  'paradigm',
                  'records',
                ],
              },
              minimum: 8,
              maximum: 8,
            },
            play: {
              type: 'array',
              required: true,
              items: {
                type: 'enum',
                required: true,
                values: [
                  'character',
                  'traits',
                  'magick',
                  'advantages',
                  'condition',
                  'gear',
                  'paradigm',
                  'records',
                ],
              },
              minimum: 8,
              maximum: 8,
            },
          }),
        }),
      }),
      defaults: mage20Phase2Defaults,
      modes: [
        { id: 'build', label: 'Build' },
        { id: 'play', label: 'Play' },
      ],
      defaultModeId: 'build',
      playModeNote:
        'Attributes and Abilities are view-only in Play mode. Identity remains editable.',
      displayNamePath: path('identity', 'name'),
      modePath: path('sheetLayout', 'mode'),
      groupOrderPaths: {
        build: path('sheetLayout', 'groupOrders', 'build'),
        play: path('sheetLayout', 'groupOrders', 'play'),
      },
      navigationGroups: [
        { id: 'character', label: 'Character', order: 0 },
        { id: 'traits', label: 'Traits', order: 1 },
        { id: 'magick', label: 'Magic', order: 2 },
        { id: 'advantages', label: 'Advantages', order: 3 },
        { id: 'condition', label: 'Conditions', order: 4 },
        { id: 'gear', label: 'Gear', order: 5 },
        { id: 'paradigm', label: 'Paradigm', order: 6 },
        { id: 'records', label: 'Records', order: 7 },
      ],
      sections: [
        {
          id: 'identity',
          label: 'Identity',
          description: 'The mortal mask.',
          groupId: 'character',
          order: 0,
          componentIds: ['identity-fields'],
          summary: {
            type: 'field-slots',
            slots: [
              {
                paths: [path('identity', 'name')],
                fallback: 'Untitled mage',
              },
              {
                paths: [
                  path('identity', 'affiliation'),
                  path('identity', 'concept'),
                ],
                fallback: 'Affiliation unrecorded',
              },
            ],
            separator: ' · ',
          },
        },
        {
          id: 'attributes',
          label: 'Attributes',
          description: 'Innate capacities.',
          groupId: 'traits',
          order: 1,
          componentIds: ['attribute-ratings'],
          summary: {
            type: 'rating-group-totals',
            groups: ratingPaths('attributes', attributeGroups),
            separator: ' · ',
          },
        },
        {
          id: 'abilities',
          label: 'Abilities',
          description: 'Learned and practiced capabilities.',
          groupId: 'traits',
          order: 2,
          componentIds: ['ability-ratings'],
          summary: {
            type: 'rated-group-counts',
            groups: ratingPaths('abilities', abilityGroups),
            separator: ' · ',
          },
        },
        {
          id: 'maneuvers',
          label: 'Maneuvers',
          description: 'Combat references and Special Do Techniques.',
          groupId: 'traits',
          order: 3,
          componentIds: ['maneuver-records'],
        },
        {
          id: 'backgrounds',
          label: 'Backgrounds',
          description: 'Advantages, allies, resources, and connections.',
          groupId: 'advantages',
          order: 4,
          componentIds: ['background-records'],
        },
        {
          id: 'merits-flaws',
          label: 'Merits & Flaws',
          description: 'Selected benefits and complications.',
          groupId: 'advantages',
          order: 5,
          componentIds: ['merit-flaw-records'],
        },
        {
          id: 'spheres',
          label: 'Spheres',
          description:
            'Choose one affinity, or select the current affinity again to clear it.',
          groupId: 'magick',
          order: 6,
          componentIds: ['sphere-ratings'],
        },
        {
          id: 'enlightenment',
          label: 'Enlightenment',
          description:
            'Ten-point tracks for Arete and Willpower, with a shared twenty-position Quintessence and Paradox wheel.',
          groupId: 'magick',
          order: 7,
          componentIds: [
            'arete-rating',
            'willpower-rating',
            'quintessence-paradox',
          ],
        },
        {
          id: 'focus',
          label: 'Focus',
          description:
            'Paradigm, practices, instruments, and personal context.',
          groupId: 'paradigm',
          order: 8,
          componentIds: ['focus-records'],
        },
        {
          id: 'wonders',
          label: 'Wonders',
          description: 'Enchanted and Enlightened objects.',
          groupId: 'paradigm',
          order: 9,
          componentIds: ['wonder-records'],
        },
        {
          id: 'rotes',
          label: 'Rotes',
          description: 'Practiced Effects and Sphere requirements.',
          groupId: 'paradigm',
          order: 10,
          componentIds: ['rote-records'],
        },
        {
          id: 'equipment',
          label: 'Equipment',
          description: 'Weapons, armor, and field gear.',
          groupId: 'gear',
          order: 11,
          componentIds: ['equipment-records'],
        },
        {
          id: 'health',
          label: 'Health',
          description:
            'Add damage from the top down. Activate a marked box to cycle through damage types and clear.',
          groupId: 'condition',
          order: 12,
          componentIds: ['health-track'],
        },
        {
          id: 'experience',
          label: 'Experience',
          description: 'Earned and currently available experience.',
          groupId: 'records',
          order: 13,
          componentIds: ['experience-total', 'experience-current'],
        },
      ],
      componentIds: [
        'identity-fields',
        'attribute-ratings',
        'ability-ratings',
        'sphere-ratings',
        'arete-rating',
        'willpower-rating',
        'quintessence-paradox',
        'health-track',
        'maneuver-records',
        'background-records',
        'merit-flaw-records',
        'focus-records',
        'wonder-records',
        'rote-records',
        'equipment-records',
        'experience-total',
        'experience-current',
      ],
      creationProfileIds: [],
      creationFlowIds: [],
    },
  ],
  reusableComponents: [
    {
      id: 'identity-fields',
      type: 'field-grid',
      label: 'Identity fields',
      accessibilityLabel: 'Mage identity fields',
      columns: 3,
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'edit' },
      fields: identityFields.map(({ id, label }) => ({
        id: componentId(id),
        label,
        accessibilityLabel: label,
        dataPath: path('identity', id),
        maximumLength: 500,
      })),
    },
    {
      id: 'attribute-ratings',
      type: 'grouped-dot-ratings',
      label: 'Attributes',
      accessibilityLabel: 'Mage Attribute ratings',
      presentation: 'attributes',
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'view' },
      groups: attributeGroups.map((group) => ({
        id: group.id,
        label: group.label,
        ratings: group.traits.map(({ id, label }) => ({
          id: componentId(id),
          label,
          accessibilityLabel: `${label} rating`,
          dataPath: path('attributes', group.id, id),
          minimum: 1,
          maximum: 5,
        })),
      })),
    },
    {
      id: 'ability-ratings',
      type: 'grouped-dot-ratings',
      label: 'Abilities',
      accessibilityLabel: 'Mage Ability ratings',
      presentation: 'abilities',
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'view' },
      groups: abilityGroups.map((group) => ({
        id: group.id,
        label: group.label,
        ratings: group.traits.map(({ id, label }) => ({
          id: componentId(id),
          label,
          accessibilityLabel: `${label} rating`,
          dataPath: path('abilities', group.id, id),
          minimum: 0,
          maximum: 5,
        })),
      })),
    },
    {
      id: 'maneuver-records',
      type: 'mage20-collection',
      kind: 'maneuvers',
      label: 'Maneuvers',
      accessibilityLabel: 'Mage Maneuvers',
      dataPath: path('repeatableEntries', 'maneuvers'),
      doRatingPath: path('abilities', 'skills', 'do'),
      catalogId: 'maneuvers',
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'view' },
    },
    {
      id: 'background-records',
      type: 'mage20-background-catalog',
      label: 'Backgrounds',
      accessibilityLabel: 'Mage Backgrounds',
      selectionsPath: path('repeatableEntries', 'backgrounds'),
      catalogId: 'backgrounds',
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'view' },
    },
    {
      id: 'merit-flaw-records',
      type: 'mage20-merits-flaws-catalog',
      label: 'Merits and Flaws',
      accessibilityLabel: 'Mage Merits and Flaws',
      meritsPath: path('repeatableEntries', 'merits'),
      flawsPath: path('repeatableEntries', 'flaws'),
      catalogId: 'merits-flaws',
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'view' },
    },
    {
      id: 'focus-records',
      type: 'mage20-collection',
      kind: 'focus',
      label: 'Focus',
      accessibilityLabel: 'Mage Focus',
      dataPath: path('repeatableEntries', 'focus'),
      catalogId: 'focus',
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'view' },
    },
    {
      id: 'wonder-records',
      type: 'mage20-collection',
      kind: 'wonders',
      label: 'Wonders',
      accessibilityLabel: 'Mage Wonders',
      dataPath: path('repeatableEntries', 'wonders'),
      catalogId: 'wonders',
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'view' },
    },
    {
      id: 'rote-records',
      type: 'mage20-collection',
      kind: 'rotes',
      label: 'Rotes',
      accessibilityLabel: 'Mage Rotes',
      dataPath: path('repeatableEntries', 'rotes'),
      catalogId: 'rotes',
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'view' },
    },
    {
      id: 'equipment-records',
      type: 'mage20-collection',
      kind: 'equipment',
      label: 'Equipment',
      accessibilityLabel: 'Mage Equipment',
      dataPath: path('repeatableEntries', 'equipment'),
      catalogId: 'equipment',
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'edit' },
    },
    {
      id: 'experience-total',
      type: 'number',
      label: 'Total Experience',
      accessibilityLabel: 'Total experience',
      dataPath: path('experience', 'total'),
      minimum: 0,
      maximum: 999999,
      layout: { width: 'half' },
      modes: { build: 'edit', play: 'edit' },
    },
    {
      id: 'experience-current',
      type: 'number',
      label: 'Current Experience',
      accessibilityLabel: 'Current experience',
      dataPath: path('experience', 'current'),
      minimum: 0,
      maximum: 999999,
      layout: { width: 'half' },
      modes: { build: 'edit', play: 'edit' },
    },
    {
      id: 'sphere-ratings',
      type: 'sphere-rating-wheel',
      label: 'Spheres',
      accessibilityLabel: 'Mage Sphere ratings and affinity',
      affinityPath: path('affinitySphere'),
      sortPreferenceKey: 'arcane-ledger:sphere-sort',
      wheelPreferenceKey: 'arcane-ledger:desktop-sphere-wheel',
      minimum: 0,
      maximum: 5,
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'view' },
      ratings: spheres.map(({ id, label }) => ({
        id,
        label,
        dataPath: path('spheres', id),
      })),
    },
    {
      id: 'arete-rating',
      type: 'dot-rating',
      label: 'Arete',
      accessibilityLabel: 'Arete rating',
      dataPath: path('enlightenment', 'arete'),
      minimum: 1,
      maximum: 10,
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'view' },
    },
    {
      id: 'willpower-rating',
      type: 'permanent-temporary-rating',
      label: 'Willpower',
      accessibilityLabel: 'Permanent and Temporary Willpower',
      permanentPath: path('enlightenment', 'willpower'),
      temporaryPath: path('enlightenment', 'willpowerTemporary'),
      permanentLabel: 'Willpower',
      temporaryLabel: 'Temporary Willpower',
      minimum: 0,
      permanentMinimum: 1,
      maximum: 10,
      temporaryDotsPreferenceKey: 'arcane-ledger:temporary-willpower-dots',
      temporaryEditableInViewMode: true,
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'view' },
    },
    {
      id: 'quintessence-paradox',
      type: 'opposed-wheel-20',
      label: 'Quintessence and Paradox',
      accessibilityLabel: 'Quintessence and Paradox wheel',
      firstPath: path('enlightenment', 'quintessence'),
      secondPath: path('enlightenment', 'paradox'),
      firstLabel: 'Quintessence',
      secondLabel: 'Paradox',
      maximum: 20,
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'edit' },
    },
    {
      id: 'health-track',
      type: 'cycling-damage-track',
      label: 'Health',
      accessibilityLabel: 'Health damage track',
      dataPath: path('health', 'damage'),
      levels: healthLevels.map(({ id, label, penalty }) => ({
        id,
        label,
        penalty,
      })),
      states: [
        { id: 'bashing', label: 'Bashing', mark: '╱' },
        { id: 'lethal', label: 'Lethal', mark: '×' },
        { id: 'aggravated', label: 'Aggravated', mark: '✱' },
      ],
      layout: { width: 'full' },
      modes: { build: 'edit', play: 'edit' },
    },
  ],
  catalogs: [
    {
      id: 'backgrounds',
      name: 'Backgrounds',
      entries: backgroundCatalog.map((entry) => ({
        id: mage20DefinitionIdMap.backgrounds[entry.id]!,
        name: entry.name,
        category: entry.restrictions[0] ?? 'standard',
        summary: entry.description,
        data: entry,
      })),
    },
    {
      id: 'merits-flaws',
      name: 'Merits & Flaws',
      entries: meritFlawCatalog.map((entry) => ({
        id: (entry.kind === 'merit'
          ? mage20DefinitionIdMap.merits
          : mage20DefinitionIdMap.flaws)[entry.id]!,
        name: entry.name,
        category: `${entry.kind}:${entry.category}`,
        summary: entry.description,
        data: entry,
      })),
    },
    {
      id: 'focus',
      name: 'Focus',
      entries: [
        ...paradigmCatalog.map((entry) => ({ ...entry, kind: 'paradigm' })),
        ...practiceCatalog.map((entry) => ({ ...entry, kind: 'practice' })),
        ...instrumentCatalog.map((entry) => ({ ...entry, kind: 'instrument' })),
      ].map((entry) => ({
        id: (entry.kind === 'paradigm'
          ? mage20DefinitionIdMap.paradigms
          : entry.kind === 'practice'
            ? mage20DefinitionIdMap.practices
            : mage20DefinitionIdMap.instruments)[entry.id]!,
        name: entry.name,
        category: entry.kind,
        summary: entry.summary,
        data: entry,
      })),
    },
    {
      id: 'wonders',
      name: 'Wonders',
      entries: wonderCatalog.map((entry) => ({
        id: mage20DefinitionIdMap.wonders[entry.id]!,
        name: entry.name,
        category: entry.family,
        summary: entry.summary,
        data: entry,
      })),
    },
    {
      id: 'rotes',
      name: 'Rotes',
      entries: roteCatalog.map((entry) => ({
        id: mage20DefinitionIdMap.rotes[entry.id]!,
        name: entry.name,
        category: entry.family,
        summary: entry.summary,
        data: entry,
      })),
    },
    {
      id: 'equipment',
      name: 'Equipment',
      entries: equipmentCatalog.map((entry) => ({
        id: mage20DefinitionIdMap.equipment[entry.id]!,
        name: entry.name,
        category: entry.category,
        summary: entry.summary,
        data: entry,
      })),
    },
    {
      id: 'maneuvers',
      name: 'Maneuvers',
      entries: [
        ...combatManeuverCatalog.map((entry) => ({ entry, kind: 'combat' })),
        ...doManeuverCatalog.map((entry) => ({ entry, kind: 'do' })),
      ].map(({ entry, kind }) => ({
        id: (kind === 'combat'
          ? mage20DefinitionIdMap.combatManeuvers
          : mage20DefinitionIdMap.doManeuvers)[entry.id]!,
        name: entry.name,
        category: kind,
        summary: entry.summary,
        data: { ...entry, kind },
      })),
    },
  ],
  diceSystems: [],
  actions: [],
  formulas: [],
  validationRules: [],
  creationProfiles: [],
  creationFlows: [],
  themes: [],
  assets: [],
  sourceReferences: [
    {
      id: 'mage20-character-sheet',
      title: 'Mage 20 character-sheet structure',
      notes: 'Structure only; no source artwork or PDF background is used.',
    },
  ],
  migrations: [],
};
