import { findLegendKit, findLegendThemebook, LEGEND_SOURCE } from './catalog';
import {
  LEGEND_FELLOWSHIP_SCHEMA_VERSION,
  LEGEND_SCHEMA_VERSION,
  type LegendFellowship,
  type LegendHero,
  type LegendTag,
  type LegendTheme,
} from './schema';

export const legendHeroBuildOrder = [
  'character',
  'creator',
  'themes',
  'backpack',
  'relationships',
  'statuses',
  'actions',
  'development',
  'records',
];

export const legendHeroPlayOrder = [
  'statuses',
  'actions',
  'themes',
  'backpack',
  'relationships',
  'development',
  'character',
  'records',
  'creator',
];

export function createLegendTag(
  kind: LegendTag['kind'],
  name = '',
  origin: LegendTag['origin'] = 'manual',
): LegendTag {
  return {
    id: crypto.randomUUID(),
    definitionId: null,
    source: LEGEND_SOURCE,
    page: 73,
    name,
    kind,
    questionId: null,
    usage: kind === 'story' ? 'standard' : 'permanent',
    scratched: false,
    burned: false,
    broad: false,
    notes: '',
    origin,
  };
}

export function createLegendTheme(
  method: LegendTheme['creationMethod'] = 'freeform',
  kitId: string | null = null,
): LegendTheme {
  const kit = findLegendKit(kitId);
  const themebook = findLegendThemebook(kit?.themebookId ?? null);
  return {
    id: crypto.randomUUID(),
    definitionId: kit?.id ?? null,
    themebookId: themebook?.id ?? kit?.themebookId ?? null,
    kitId: kit?.id ?? null,
    creationMethod: method,
    state: 'standard',
    name: kit?.name ?? '',
    might:
      kit?.might ??
      (themebook?.might === 'variable'
        ? 'origin'
        : (themebook?.might ?? 'origin')),
    powerTags: [
      createLegendTag('power', '', 'creator'),
      createLegendTag('power', '', 'creator'),
    ],
    weaknessTags: [createLegendTag('weakness', '', 'creator')],
    quest: { text: '', kind: 'custom', plannedMilestones: ['', '', ''] },
    improve: 0,
    abandon: 0,
    milestone: 0,
    improvements: [],
    notes: '',
  };
}

export function createLegendHero(options?: {
  creationStatus?: LegendHero['creation']['status'];
  mode?: LegendHero['mode'];
}): LegendHero {
  const creationStatus = options?.creationStatus ?? 'manual';
  const themes = Array.from({ length: 4 }, () =>
    createLegendTheme(creationStatus === 'manual' ? 'manual' : 'freeform'),
  );
  return {
    schemaVersion: LEGEND_SCHEMA_VERSION,
    name: '',
    player: '',
    pronouns: '',
    description: '',
    notes: '',
    mode: options?.mode ?? 'build',
    layout: {
      build: [...legendHeroBuildOrder],
      play: [...legendHeroPlayOrder],
    },
    creation: {
      status: creationStatus,
      method: 'freeform',
      step: 'method',
      selectedTropeId: null,
      approvals: [],
      finalizedAt: null,
      baselineThemes: [],
      rebuildDraft: null,
    },
    themes,
    backpack: [],
    statuses: [],
    relationships: [],
    fellowship: { kind: 'none' },
    fellowshipSnapshot: null,
    promise: 0,
    quintessences: [],
    fulfillments: [],
    magicPractices: [],
    camp: { phase: 'adventure', activitiesRemaining: 0, notes: '' },
    rolls: [],
    developmentHistory: [],
  };
}

export function createLegendFellowship(): LegendFellowship {
  return {
    schemaVersion: LEGEND_FELLOWSHIP_SCHEMA_VERSION,
    name: '',
    concept: '',
    mode: 'build',
    layout: {
      build: ['identity', 'theme', 'members', 'development', 'records'],
      play: ['theme', 'members', 'development', 'identity', 'records'],
    },
    theme: {
      ...createLegendTheme('freeform'),
      name: '',
      definitionId: 'litm.themebook.fellowship',
      themebookId: 'litm.themebook.fellowship',
      powerTags: [
        { ...createLegendTag('power', '', 'creator'), usage: 'fellowship' },
        { ...createLegendTag('power', '', 'creator'), usage: 'fellowship' },
      ],
      weaknessTags: [createLegendTag('weakness', '', 'creator')],
    },
    memberIds: [],
    memberNames: [],
    specialImprovements: [],
    notes: '',
  };
}
