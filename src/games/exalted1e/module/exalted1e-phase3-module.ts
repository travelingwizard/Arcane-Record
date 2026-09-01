import type {
  ArcaneModuleEnvelope,
  ModuleComponentDefinition,
} from '../../../modules/schema/module-envelope';
import { createBlankExaltedCharacter } from '../create-character';
import {
  defaultExaltedSectionGroupOrder,
  dragonBloodedBackgrounds,
  exaltedAttributeGroups,
  exaltedSectionGroups,
  exaltedVirtues,
  solarBackgrounds,
  type ExaltedSheetType,
} from '../definitions';
import { dragonBloodedTraits } from '../reference/dragonblooded-merits-flaws';
import {
  dragonBloodedCharms,
  dragonBloodedSpells,
} from '../reference/dragonblooded-powers';
import { exaltedLanguageCatalog } from '../shared/languages/catalog';
import {
  exaltedAmmunitionCatalog,
  exaltedArmorCatalog,
  exaltedWeaponCatalog,
} from '../shared/equipment/catalog';
import { exalted1eModuleCharacterSchema } from './character-schema';
import {
  EXALTED1E_DRAGON_BLOODED_NODE_ID,
  EXALTED1E_DRAGON_BLOODED_SHEET_ID,
  EXALTED1E_MODULE_ID,
  EXALTED1E_MODULE_VERSION,
  EXALTED1E_ROOT_NODE_ID,
  EXALTED1E_SHEET_VERSION,
  EXALTED1E_SOLAR_NODE_ID,
  EXALTED1E_SOLAR_SHEET_ID,
  exalted1eDefinitionRefs,
} from './id-map';

const path = (...segments: string[]) => ({
  root: 'character' as const,
  segments,
});

const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const catalogEntries = <
  T extends {
    id: string;
    name: string;
    category?: string;
    summary?: string;
    data?: Record<string, unknown>;
  },
>(
  entries: T[],
) => entries.map((entry) => ({ ...entry, sourceRefIds: [] }));

function component(
  id: string,
  label: string,
  kind: Extract<
    ModuleComponentDefinition,
    { type: 'exalted1e-section' }
  >['kind'],
  sheetType: ExaltedSheetType,
  catalogId?: string,
  modes: Record<string, 'edit' | 'view' | 'hidden'> = {
    build: 'edit',
    play: 'view',
  },
): ModuleComponentDefinition {
  return {
    id,
    label,
    type: 'exalted1e-section',
    kind,
    sheetType,
    catalogId,
    accessibilityLabel: `${label} editor`,
    sourceRefIds: ['exalted-1e-sheet-structure'],
    layout: { width: 'full' },
    modes,
    display: { format: 'plain' },
  };
}

const identity = (sheetType: ExaltedSheetType): ModuleComponentDefinition => ({
  id: `${sheetType}-identity`,
  label: 'Identity',
  type: 'field-grid',
  columns: 3,
  fields: [
    ['name', 'Name'],
    ['player', 'Player'],
    ['concept', 'Concept'],
    ['nature', 'Nature'],
    ...(sheetType === 'solar'
      ? ([['caste', 'Caste']] as const)
      : ([
          ['aspect', 'Aspect'],
          ['house', 'House'],
        ] as const)),
    ['anima', 'Anima'],
  ].map(([id, label]) => ({
    id: `${sheetType}-${id}`,
    label,
    accessibilityLabel: label,
    dataPath: path('identity', id),
    maximumLength: id === 'anima' ? 20_000 : 500,
  })),
  accessibilityLabel: `${sheetType} identity`,
  sourceRefIds: ['exalted-1e-sheet-structure'],
  layout: { width: 'full' },
  modes: { build: 'edit', play: 'view' },
  display: { format: 'plain' },
});

const attributes: ModuleComponentDefinition = {
  id: 'shared-attributes',
  label: 'Attributes',
  type: 'grouped-dot-ratings',
  presentation: 'attributes',
  groups: exaltedAttributeGroups.map((group) => ({
    id: group.id,
    label: group.label,
    ratings: group.traits.map((trait) => ({
      id: trait.id,
      label: trait.label,
      accessibilityLabel: trait.label,
      dataPath: path('attributes', group.id, trait.id),
      minimum: 1,
      maximum: 5,
    })),
  })),
  accessibilityLabel: 'Attributes',
  sourceRefIds: ['exalted-1e-sheet-structure'],
  layout: { width: 'full' },
  modes: { build: 'edit', play: 'view' },
  display: { format: 'rating' },
};

const virtueComponents: ModuleComponentDefinition[] = exaltedVirtues.map(
  ({ id, label }) => ({
    id: `virtue-${id}`,
    label,
    type: 'dot-rating',
    dataPath: path('virtues', id),
    minimum: 0,
    maximum: 5,
    variant: 'dots',
    accessibilityLabel: label,
    sourceRefIds: ['exalted-1e-sheet-structure'],
    layout: { width: 'half' },
    modes: { build: 'edit', play: 'view' },
    display: { format: 'rating' },
  }),
);

function normalizeDefaults(sheetType: ExaltedSheetType) {
  const blank = createBlankExaltedCharacter(sheetType);
  return {
    ...blank,
    sheetLayout: {
      ...blank.sheetLayout,
      mode: 'build',
      buildOrder: [...defaultExaltedSectionGroupOrder],
      playOrder: [...defaultExaltedSectionGroupOrder],
    },
  };
}

const sharedSections = [
  ['character', 'Character'],
  ['attributes', 'Attributes'],
  ['abilities', 'Abilities'],
  ['languages', 'Languages'],
  ['backgrounds', 'Backgrounds'],
  ['advantages', 'Advantages'],
  ['merits-flaws', 'Merits & Flaws'],
  ['derangements', 'Derangements'],
  ['powers', 'Charms & Sorcery'],
  ['equipment', 'Equipment'],
  ['combat', 'Combat'],
  ['combos', 'Combos'],
  ['possessions', 'Possessions'],
  ['experience', 'Experience'],
  ['notes', 'Notes'],
] as const;

const sectionGroups: Record<(typeof sharedSections)[number][0], string> = {
  character: 'character',
  attributes: 'character',
  abilities: 'character',
  languages: 'character',
  backgrounds: 'character',
  advantages: 'exalted',
  'merits-flaws': 'character',
  derangements: 'character',
  powers: 'exalted',
  equipment: 'resources',
  combat: 'combat',
  combos: 'combat',
  possessions: 'resources',
  experience: 'advancement',
  notes: 'advancement',
};

function componentIds(sheetType: ExaltedSheetType) {
  return [
    `${sheetType}-identity`,
    'shared-attributes',
    `${sheetType}-abilities`,
    `${sheetType}-languages`,
    `${sheetType}-backgrounds`,
    `${sheetType}-advantages`,
    `${sheetType}-merits-flaws`,
    `${sheetType}-derangements`,
    `${sheetType}-powers`,
    `${sheetType}-equipment`,
    `${sheetType}-combat`,
    `${sheetType}-combos`,
    `${sheetType}-possessions`,
    `${sheetType}-experience`,
    `${sheetType}-notes-anima`,
    `${sheetType}-notes-weapons`,
    `${sheetType}-notes-experience`,
    ...virtueComponents.map(({ id }) => id),
  ];
}

function sections(sheetType: ExaltedSheetType) {
  const noteIds = [
    `${sheetType}-notes-anima`,
    `${sheetType}-notes-weapons`,
    `${sheetType}-notes-experience`,
  ];
  return sharedSections.map(([id, label], order) => ({
    id: `${sheetType}-${id}`,
    label,
    description:
      sheetType === 'solar' && (id === 'merits-flaws' || id === 'powers')
        ? 'Preview placeholder: the Solar reference catalog has not yet been converted.'
        : undefined,
    groupId: sectionGroups[id],
    order,
    componentIds:
      id === 'notes'
        ? noteIds
        : id === 'character'
          ? [`${sheetType}-identity`]
          : id === 'attributes'
            ? ['shared-attributes']
            : id === 'advantages'
              ? [
                  `${sheetType}-advantages`,
                  ...virtueComponents.map(({ id }) => id),
                ]
              : [`${sheetType}-${id}`],
    summary:
      id === 'character'
        ? {
            type: 'field-slots' as const,
            slots: [
              { paths: [path('identity', 'name')], fallback: 'Unnamed' },
              {
                paths: [
                  path('identity', sheetType === 'solar' ? 'caste' : 'aspect'),
                ],
                fallback: sheetType === 'solar' ? 'Solar' : 'Dragon-Blooded',
              },
            ],
            separator: ' · ',
          }
        : id === 'attributes'
          ? {
              type: 'rating-group-totals' as const,
              groups: exaltedAttributeGroups.map((group) => ({
                label: group.label,
                paths: group.traits.map((trait) =>
                  path('attributes', group.id, trait.id),
                ),
              })),
              separator: ' · ',
            }
          : undefined,
  }));
}

function sheetTemplate(sheetType: ExaltedSheetType) {
  const isSolar = sheetType === 'solar';
  return {
    id: isSolar ? EXALTED1E_SOLAR_SHEET_ID : EXALTED1E_DRAGON_BLOODED_SHEET_ID,
    templateVersion: EXALTED1E_SHEET_VERSION,
    gameNodeId: isSolar
      ? EXALTED1E_SOLAR_NODE_ID
      : EXALTED1E_DRAGON_BLOODED_NODE_ID,
    name: isSolar ? 'Solar Character Sheet' : 'Dragon-Blooded Character Sheet',
    description:
      'Editable Exalted First Edition sheet using shared declarative systems.',
    characterSchema: exalted1eModuleCharacterSchema,
    defaults: normalizeDefaults(sheetType),
    modes: [
      { id: 'build', label: 'Build' },
      { id: 'play', label: 'Play' },
    ],
    defaultModeId: 'build',
    playModeNote:
      'Play mode protects permanent ratings while keeping transient pools and play records available.',
    displayNamePath: path('identity', 'name'),
    modePath: path('sheetLayout', 'mode'),
    groupOrderPaths: {
      build: path('sheetLayout', 'buildOrder'),
      play: path('sheetLayout', 'playOrder'),
    },
    navigationGroups: exaltedSectionGroups.map((group, order) => ({
      id: group.id,
      label: group.label,
      order,
    })),
    sections: sections(sheetType),
    componentIds: componentIds(sheetType),
    creationProfileIds: [],
    creationFlowIds: [],
  };
}

const advancedComponents: ModuleComponentDefinition[] = (
  ['solar', 'dragon-blooded'] as const
).flatMap((sheetType) => {
  const isSolar = sheetType === 'solar';
  const playEditable = { build: 'edit', play: 'edit' } as const;
  return [
    identity(sheetType),
    component(`${sheetType}-abilities`, 'Abilities', 'abilities', sheetType),
    component(
      `${sheetType}-languages`,
      'Languages',
      'languages',
      sheetType,
      'languages',
    ),
    component(
      `${sheetType}-backgrounds`,
      'Backgrounds',
      'backgrounds',
      sheetType,
      'backgrounds',
    ),
    component(
      `${sheetType}-advantages`,
      'Advantages',
      'advantages',
      sheetType,
      undefined,
      playEditable,
    ),
    isSolar
      ? ({
          id: `${sheetType}-merits-flaws`,
          label: 'Solar Merits & Flaws preview',
          type: 'static-text',
          text: 'Preview placeholder: Solar Merits & Flaws reference data is not yet available. Existing Solar sheets remain editable without implying a completed catalog.',
          accessibilityLabel: 'Solar Merits and Flaws preview placeholder',
          sourceRefIds: ['exalted-1e-sheet-structure'],
          layout: { width: 'full' },
          modes: playEditable,
          display: { format: 'plain' },
        } satisfies ModuleComponentDefinition)
      : component(
          `${sheetType}-merits-flaws`,
          'Merits & Flaws',
          'merits-flaws',
          sheetType,
          'dragon-blooded-traits',
        ),
    component(
      `${sheetType}-derangements`,
      'Derangements',
      'derangements',
      sheetType,
      'derangements',
      playEditable,
    ),
    isSolar
      ? ({
          id: `${sheetType}-powers`,
          label: 'Solar Charms & Sorcery preview',
          type: 'static-text',
          text: 'Preview placeholder: the Solar Charm and Sorcery catalog is not yet converted. No rules or selectable powers are implied by this placeholder.',
          accessibilityLabel: 'Solar Charms and Sorcery preview placeholder',
          sourceRefIds: ['exalted-1e-sheet-structure'],
          layout: { width: 'full' },
          modes: playEditable,
          display: { format: 'plain' },
        } satisfies ModuleComponentDefinition)
      : component(
          `${sheetType}-powers`,
          'Charms & Sorcery',
          'powers',
          sheetType,
          'dragon-blooded-powers',
        ),
    component(
      `${sheetType}-equipment`,
      'Equipment',
      'equipment',
      sheetType,
      'equipment',
      playEditable,
    ),
    component(
      `${sheetType}-combat`,
      'Combat',
      'combat',
      sheetType,
      'dragon-blooded-powers',
      playEditable,
    ),
    component(`${sheetType}-combos`, 'Combos', 'combos', sheetType),
    component(
      `${sheetType}-possessions`,
      'Possessions',
      'possessions',
      sheetType,
      undefined,
      playEditable,
    ),
    component(
      `${sheetType}-experience`,
      'Experience',
      'experience',
      sheetType,
      'advancement',
      playEditable,
    ),
    ...(
      ['description', 'history', 'anima', 'weapons', 'experience'] as const
    ).map((note): ModuleComponentDefinition => ({
      id: `${sheetType}-notes-${note}`,
      label: `${note[0]!.toUpperCase()}${note.slice(1)} notes`,
      type: 'text',
      dataPath: path('notes', note),
      maximumLength: 20_000,
      accessibilityLabel: `${note} notes`,
      sourceRefIds: ['exalted-1e-sheet-structure'],
      layout: { width: 'full' },
      modes: playEditable,
      display: { format: 'plain' },
    })),
  ];
});

const backgroundAvailability = new Map<string, Set<ExaltedSheetType>>();
solarBackgrounds.forEach(({ id }) =>
  backgroundAvailability.set(id, new Set(['solar'])),
);
dragonBloodedBackgrounds.forEach(({ id }) => {
  const current = backgroundAvailability.get(id) ?? new Set<ExaltedSheetType>();
  current.add('dragon-blooded');
  backgroundAvailability.set(id, current);
});

export const exalted1ePhase3Module: ArcaneModuleEnvelope = {
  format: 'arcane-record-module',
  formatVersion: 1,
  moduleId: EXALTED1E_MODULE_ID,
  moduleVersion: EXALTED1E_MODULE_VERSION,
  name: 'Arcane Record · Exalted First Edition',
  description:
    'Shared Exalted First Edition systems with Solar and Dragon-Blooded child sheets.',
  author: [{ name: 'Arcane Record' }],
  licenseMetadata: {
    spdxExpression: 'LicenseRef-Arcane-Record-Local',
    notice:
      'Original Arcane Record implementation. Source citations are reference metadata.',
    provenance:
      'Converted from Arcane Record’s existing Exalted First Edition schemas and browser-local editors.',
  },
  minimumCoreVersion: '0.1.0',
  dependencies: [],
  gameNodes: [
    {
      id: EXALTED1E_ROOT_NODE_ID,
      name: 'Exalted First Edition',
      description: 'Shared character systems used by all Exalted variants.',
      parentId: null,
      order: 0,
      additions: [...exalted1eDefinitionRefs.shared],
      overrides: [],
      sourceRefIds: ['exalted-1e-sheet-structure'],
    },
    {
      id: EXALTED1E_SOLAR_NODE_ID,
      name: 'Solar Exalted',
      description:
        'Solar character sheet with explicit preview placeholders for unfinished catalogs.',
      parentId: EXALTED1E_ROOT_NODE_ID,
      order: 1,
      additions: [...exalted1eDefinitionRefs.solar],
      overrides: [],
      sourceRefIds: ['exalted-1e-sheet-structure'],
    },
    {
      id: EXALTED1E_DRAGON_BLOODED_NODE_ID,
      name: 'Dragon-Blooded',
      description:
        'Terrestrial Exalted character sheet and reference catalogs.',
      parentId: EXALTED1E_ROOT_NODE_ID,
      order: 2,
      additions: [...exalted1eDefinitionRefs.dragonBlooded],
      overrides: [
        {
          target: 'catalog/advancement/shared-advancement',
          fields: {
            essenceCost: 'current rating × 10 XP',
            newPowerCost: '12 XP; 10 if Favored or Aspect',
            immaculateCost: '15 XP; 12 if Favored or Aspect',
          },
        },
      ],
      sourceRefIds: ['dragon-blooded-reference-catalogs'],
    },
  ],
  sheetTemplates: [sheetTemplate('solar'), sheetTemplate('dragon-blooded')],
  reusableComponents: [attributes, ...virtueComponents, ...advancedComponents],
  catalogs: [
    {
      id: 'languages',
      name: 'Shared Exalted Languages',
      entries: catalogEntries([
        {
          id: 'shared-languages',
          name: 'Shared language system',
          category: 'system',
          data: { catalogKind: 'system-marker' },
        },
        ...exaltedLanguageCatalog.map((entry) => ({
          id: entry.id,
          name: entry.name,
          category: 'language',
          data: clean({ ...entry, catalogKind: 'language' }),
        })),
      ]),
    },
    {
      id: 'backgrounds',
      name: 'Shared Exalted Backgrounds',
      entries: catalogEntries(
        [
          ['shared-backgrounds', 'Shared Background system'],
          ['solar-backgrounds', 'Solar Background availability'],
          [
            'dragon-blooded-backgrounds',
            'Dragon-Blooded Background availability',
          ],
        ]
          .map(([id, name]) => ({
            id,
            name,
            category: 'system',
            data: { catalogKind: 'system-marker' },
          }))
          .concat(
            [...backgroundAvailability].map(([id, availability]) => {
              const definition =
                solarBackgrounds.find((entry) => entry.id === id) ??
                dragonBloodedBackgrounds.find((entry) => entry.id === id)!;
              return {
                id: `background-${id}`,
                name: definition.label,
                category: 'background',
                data: clean({
                  ...definition,
                  catalogKind: 'background',
                  availability: [...availability],
                }),
              };
            }),
          ),
      ),
    },
    {
      id: 'equipment',
      name: 'Shared Exalted Equipment',
      entries: catalogEntries([
        {
          id: 'shared-equipment',
          name: 'Shared equipment system',
          category: 'system',
          data: { catalogKind: 'system-marker' },
        },
        ...exaltedWeaponCatalog.map((entry) => ({
          id: `weapon-${entry.id}`,
          name: entry.name,
          category: 'weapon',
          data: clean({ ...entry, catalogKind: 'weapon' }),
        })),
        ...exaltedArmorCatalog.map((entry) => ({
          id: `armor-${entry.id}`,
          name: entry.name,
          category: 'armor',
          data: clean({ ...entry, catalogKind: 'armor' }),
        })),
        ...exaltedAmmunitionCatalog.map((entry) => ({
          id: `ammunition-${entry.id}`,
          name: entry.name,
          category: 'ammunition',
          data: clean({ ...entry, catalogKind: 'ammunition' }),
        })),
      ]),
    },
    {
      id: 'derangements',
      name: 'Shared Exalted Derangements',
      entries: catalogEntries([
        {
          id: 'shared-derangements',
          name: 'Shared Derangement records',
          category: 'system',
          data: { catalogKind: 'system-marker' },
        },
      ]),
    },
    {
      id: 'advancement',
      name: 'Shared Exalted Advancement',
      entries: catalogEntries([
        {
          id: 'shared-advancement',
          name: 'Shared advancement ledger',
          category: 'system',
          data: { catalogKind: 'system-marker' },
        },
      ]),
    },
    {
      id: 'variant-rules',
      name: 'Exalted Variant Rules',
      entries: catalogEntries([
        {
          id: 'solar-limit',
          name: 'Solar Limit and Virtue Flaw',
          category: 'solar',
          data: { catalogKind: 'variant-rule' },
        },
        {
          id: 'dragon-blooded-advancement',
          name: 'Dragon-Blooded Advancement Overrides',
          category: 'dragon-blooded',
          data: { catalogKind: 'variant-rule' },
        },
      ]),
    },
    {
      id: 'dragon-blooded-traits',
      name: 'Dragon-Blooded Merits & Flaws',
      entries: catalogEntries([
        {
          id: 'dragon-blooded-merits-flaws',
          name: 'Dragon-Blooded Trait availability',
          category: 'system',
          data: { catalogKind: 'system-marker' },
        },
        ...dragonBloodedTraits.map((entry) => ({
          id: entry.id,
          name: entry.name,
          category: entry.kind,
          summary: entry.summary,
          data: clean({ ...entry, catalogKind: 'trait' }),
        })),
      ]),
    },
    {
      id: 'dragon-blooded-powers',
      name: 'Dragon-Blooded Charms & Sorcery',
      entries: catalogEntries([
        {
          id: 'dragon-blooded-charms-sorcery',
          name: 'Dragon-Blooded power availability',
          category: 'system',
          data: { catalogKind: 'system-marker' },
        },
        ...dragonBloodedCharms.map((entry) => ({
          id: entry.id,
          name: entry.name,
          category: 'charm',
          summary: entry.summary,
          data: clean({ ...entry, catalogKind: 'charm' }),
        })),
        ...dragonBloodedSpells.map((entry) => ({
          id: entry.id,
          name: entry.name,
          category: 'spell',
          summary: entry.summary,
          data: clean({ ...entry, catalogKind: 'spell' }),
        })),
      ]),
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
      id: 'exalted-1e-sheet-structure',
      title: 'Arcane Record Exalted First Edition sheet structure',
      notes:
        'Structure and editable character-owned records; no source artwork is reused.',
    },
    {
      id: 'dragon-blooded-reference-catalogs',
      title: 'Arcane Record Dragon-Blooded reference catalogs',
      notes:
        'Existing source/page metadata is retained on individual catalog data.',
    },
  ],
  migrations: [],
};
