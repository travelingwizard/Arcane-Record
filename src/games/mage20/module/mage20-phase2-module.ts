import { createBlankMageCharacter } from '../../../systems/mage-m20/create-character';
import {
  abilityGroups,
  attributeGroups,
  healthLevels,
  identityFields,
  spheres,
} from '../../../systems/mage-m20/definitions';
import type { ModuleValueSchemaDefinition } from '../../../modules/schema/module-envelope';
import {
  MAGE20_GAME_NODE_ID,
  MAGE20_MODULE_ID,
  MAGE20_MODULE_VERSION,
  MAGE20_SHEET_ID,
  MAGE20_SHEET_VERSION,
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

const blank = createBlankMageCharacter();

export const mage20Phase2Defaults = {
  identity: structuredClone(blank.identity),
  attributes: structuredClone(blank.attributes),
  abilities: structuredClone(blank.abilities),
  spheres: structuredClone(blank.spheres),
  affinitySphere: blank.affinitySphere,
  enlightenment: structuredClone(blank.enlightenment),
  health: structuredClone(blank.health),
  sheetLayout: {
    mode: 'build',
    groupOrders: {
      build: ['character', 'traits', 'magick', 'condition'],
      play: ['condition', 'magick', 'traits', 'character'],
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
    'Phase 2 parity slice for Mage identity, Attributes, and Abilities.',
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
      name: 'Mage 20 Character Sheet · Phase 2 Preview',
      description:
        'Identity and core Trait parity slice. Other Mage sections remain on the legacy sheet.',
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
                values: ['character', 'traits', 'magick', 'condition'],
              },
              minimum: 4,
              maximum: 4,
            },
            play: {
              type: 'array',
              required: true,
              items: {
                type: 'enum',
                required: true,
                values: ['character', 'traits', 'magick', 'condition'],
              },
              minimum: 4,
              maximum: 4,
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
      modePath: path('sheetLayout', 'mode'),
      groupOrderPaths: {
        build: path('sheetLayout', 'groupOrders', 'build'),
        play: path('sheetLayout', 'groupOrders', 'play'),
      },
      navigationGroups: [
        { id: 'character', label: 'Character', order: 0 },
        { id: 'traits', label: 'Traits', order: 1 },
        { id: 'magick', label: 'Magic', order: 2 },
        { id: 'condition', label: 'Conditions', order: 3 },
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
          id: 'spheres',
          label: 'Spheres',
          description:
            'Choose one affinity, or select the current affinity again to clear it.',
          groupId: 'magick',
          order: 3,
          componentIds: ['sphere-ratings'],
        },
        {
          id: 'enlightenment',
          label: 'Enlightenment',
          description:
            'Ten-point tracks for Arete and Willpower, with a shared twenty-position Quintessence and Paradox wheel.',
          groupId: 'magick',
          order: 4,
          componentIds: [
            'arete-rating',
            'willpower-rating',
            'quintessence-paradox',
          ],
        },
        {
          id: 'health',
          label: 'Health',
          description:
            'Add damage from the top down. Activate a marked box to cycle through damage types and clear.',
          groupId: 'condition',
          order: 5,
          componentIds: ['health-track'],
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
  catalogs: [],
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
