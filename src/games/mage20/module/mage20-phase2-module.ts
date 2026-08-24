import { createBlankMageCharacter } from '../../../systems/mage-m20/create-character';
import {
  abilityGroups,
  attributeGroups,
  identityFields,
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
  sheetLayout: {
    mode: 'build',
    groupOrders: {
      build: ['character', 'traits'],
      play: ['traits', 'character'],
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
                values: ['character', 'traits'],
              },
              minimum: 2,
              maximum: 2,
            },
            play: {
              type: 'array',
              required: true,
              items: {
                type: 'enum',
                required: true,
                values: ['character', 'traits'],
              },
              minimum: 2,
              maximum: 2,
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
      ],
      componentIds: ['identity-fields', 'attribute-ratings', 'ability-ratings'],
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
