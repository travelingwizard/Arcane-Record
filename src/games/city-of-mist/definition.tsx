import type { GameSystemDefinition } from '../game-system';
import { CityCrewService } from './crew-service';
import {
  CityEditor,
  CrewEditor,
  citySections,
  crewSections,
} from './CityEditors';
import {
  cityCharacterSchema,
  cityCrewSchema,
  createCityCharacter,
  createCityCrew,
  type CityCharacter,
  type CityCrew,
  migrateCityCharacter,
} from './schema';

export const cityDefinition: GameSystemDefinition<CityCharacter> = {
  prepareExport: (character, repository) =>
    new CityCrewService(repository).prepareExport(character),
  id: 'city-of-mist',
  name: 'City of Mist',
  shortName: 'City of Mist',
  description:
    'Rift and Gatekeeper editable sheet preview; guided creation is in development.',
  currentSchemaVersion: 2,
  characterSchema: cityCharacterSchema,
  createInitialCharacter: createCityCharacter,
  variants: [
    {
      id: 'rift',
      name: 'Rift',
      shortName: 'Rift',
      description: 'Mythos and Logos theme tracking.',
      createInitialCharacter: () => createCityCharacter('rift'),
    },
    {
      id: 'gatekeeper',
      name: 'Gatekeeper',
      shortName: 'Gatekeeper',
      description: 'Mist and Logos theme tracking.',
      createInitialCharacter: () => createCityCharacter('gatekeeper'),
    },
  ],
  migrateCharacter: migrateCityCharacter,
  getDisplayName: (c) => c.name || 'Untitled City of Mist character',
  getSummary: (c) =>
    `${c.profile} · ${c.themes.filter((t) => t.state !== 'archived').length} themes`,
  getSearchText: (c) => [c.name, c.mythos, c.logos].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: `${c.name} (Copy)`,
  }),
  CharacterEditor: CityEditor,
  sections: citySections,
  sectionGroups: citySections.map((s) => ({ id: s.group, label: s.label })),
};
export const cityCrewDefinition: GameSystemDefinition<CityCrew> = {
  getDeleteWarning: async (id, repository) => {
    const references = await new CityCrewService(repository).references(id);
    return references.length
      ? `This crew is linked by ${references.length} character sheet(s): ${references.map((r) => r.name).join(', ')}. Deleting it leaves those links unavailable. Export a snapshot first. Delete anyway?`
      : null;
  },
  id: 'city-of-mist-crew',
  name: 'City of Mist Crew',
  shortName: 'Crew',
  description:
    'A standalone local crew sheet shared by linked City of Mist characters.',
  currentSchemaVersion: 1,
  characterSchema: cityCrewSchema,
  createInitialCharacter: createCityCrew,
  migrateCharacter: (data) => cityCrewSchema.parse(data),
  getDisplayName: (c) => c.name || 'Untitled crew',
  getSummary: (c) => c.concept || 'Shared local crew',
  getSearchText: (c) => `${c.name} ${c.concept} ${c.city}`,
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: `${c.name} (Copy)`,
  }),
  CharacterEditor: CrewEditor,
  sections: crewSections,
  sectionGroups: crewSections.map((s) => ({ id: s.group, label: s.label })),
};
