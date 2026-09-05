import type { GameSystemDefinition } from '../game-system';
import { createLegendFellowship, createLegendHero } from './create-character';
import {
  LegendFellowshipEditor,
  LegendHeroEditor,
  legendFellowshipSections,
  legendHeroSections,
} from './LegendEditors';
import {
  LEGEND_FELLOWSHIP_SCHEMA_VERSION,
  LEGEND_SCHEMA_VERSION,
  legendFellowshipSchema,
  legendHeroSchema,
  migrateLegendFellowship,
  migrateLegendHero,
  type LegendFellowship,
  type LegendHero,
} from './schema';

export const legendDefinition: GameSystemDefinition<LegendHero> = {
  id: 'legend-in-the-mist',
  name: 'Legend in the Mist',
  shortName: 'Legend in the Mist',
  sheetChoiceLabel: 'Hero sheet',
  description:
    'Guided mythic Hero creation, structured play, development, and local Fellowships.',
  currentSchemaVersion: LEGEND_SCHEMA_VERSION,
  characterSchema: legendHeroSchema,
  createInitialCharacter: () => createLegendHero({ creationStatus: 'draft' }),
  creationActions: [
    {
      id: 'build',
      name: 'Build Hero',
      description:
        'Use freeform, trope, detailed themebook, or mixed creation.',
      createInitialCharacter: () =>
        createLegendHero({ creationStatus: 'draft', mode: 'build' }),
    },
    {
      id: 'blank',
      name: 'Open Blank Hero',
      description: 'Open a manual sheet without inventing creation history.',
      createInitialCharacter: () =>
        createLegendHero({ creationStatus: 'manual', mode: 'build' }),
    },
  ],
  migrateCharacter: migrateLegendHero,
  getDisplayName: (c) => c.name || 'Untitled Hero',
  getSummary: (c) =>
    `${c.themes.filter((t) => t.state !== 'archived').length} themes · ${c.mode}`,
  getSearchText: (c) =>
    [c.name, c.player, ...c.themes.map((t) => t.name)].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: `${c.name} (Copy)`,
    fellowship: { kind: 'none' },
    fellowshipSnapshot: null,
  }),
  CharacterEditor: LegendHeroEditor,
  sections: legendHeroSections,
  sectionGroups: legendHeroSections.map((s) => ({
    id: s.group,
    label: s.label,
  })),
};
export const legendFellowshipDefinition: GameSystemDefinition<LegendFellowship> =
  {
    id: 'legend-in-the-mist-fellowship',
    parentSystemId: 'legend-in-the-mist',
    sheetChoiceLabel: 'Fellowship sheet',
    name: 'Legend in the Mist Fellowship',
    shortName: 'Fellowship',
    description: 'A shared local Fellowship theme and member record.',
    currentSchemaVersion: LEGEND_FELLOWSHIP_SCHEMA_VERSION,
    characterSchema: legendFellowshipSchema,
    createInitialCharacter: createLegendFellowship,
    migrateCharacter: migrateLegendFellowship,
    getDisplayName: (c) => c.name || 'Untitled Fellowship',
    getSummary: (c) => `${c.memberNames.length} members`,
    getSearchText: (c) => [c.name, c.concept, ...c.memberNames].join(' '),
    renameCharacter: (c, name) => ({ ...c, name }),
    duplicateCharacter: (c) => ({
      ...structuredClone(c),
      name: `${c.name} (Copy)`,
    }),
    CharacterEditor: LegendFellowshipEditor,
    sections: legendFellowshipSections,
    sectionGroups: legendFellowshipSections.map((s) => ({
      id: s.group,
      label: s.label,
    })),
  };
