import { createBlankEarthdawn4eCharacter } from './create-character';
import {
  earthdawnDefinitionById,
  earthdawnDisciplines,
  earthdawnRaces,
} from './catalog';
import {
  earthdawn4eCharacterSchema,
  type Earthdawn4eCharacter,
} from './schema';

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const number = (value: unknown) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;
export function importStepsCharacter(
  contents: string,
  fileName: string,
): Earthdawn4eCharacter | null {
  if (!fileName.toLowerCase().endsWith('.json')) return null;
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(contents) as Record<string, unknown>;
  } catch {
    return null;
  }
  const marker = Object.keys(raw).some((key) =>
    /race|discipline|talent|attribute|legend/i.test(key),
  );
  if (!marker) return null;
  const character = createBlankEarthdawn4eCharacter({
    status: 'manual',
    mode: 'edit',
  });
  const mapped: string[] = [],
    customized: string[] = [],
    ignored: string[] = [],
    unresolved: string[] = [];
  for (const key of Object.keys(raw))
    if (/portrait|image|avatar|picture/i.test(key)) ignored.push(key);
  character.identity.name = text(raw.Name ?? raw.name);
  character.identity.player = text(raw.Player ?? raw.player);
  character.identity.description = text(raw.Description ?? raw.description);
  character.notes.log = text(raw.Log ?? raw.log);
  const raceName = text(raw.Race ?? raw.race);
  const race = earthdawnRaces.find(
    ({ name }) => name.toLowerCase() === raceName.toLowerCase(),
  );
  if (race) {
    character.identity.raceId = race.id;
    character.identity.raceName = race.name;
    for (const [id, value] of Object.entries(race.attributes))
      character.attributes[id as keyof typeof character.attributes].racial =
        value;
    mapped.push(`Race: ${race.name}`);
  } else if (raceName) {
    character.identity.raceName = raceName;
    unresolved.push(`Race: ${raceName}`);
  }
  const rawDisciplines = Array.isArray(raw.Disciplines ?? raw.disciplines)
    ? (raw.Disciplines ?? raw.disciplines)
    : [];
  for (const value of rawDisciplines as unknown[]) {
    const record =
      typeof value === 'string'
        ? { name: value }
        : (value as Record<string, unknown>);
    const name = text(record.name ?? record.Name);
    const definition = earthdawnDisciplines.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );
    character.disciplines.push({
      id: crypto.randomUUID(),
      definitionId: definition?.id ?? null,
      sourceId: definition?.sourceId ?? null,
      source: definition?.source ?? null,
      page: definition?.page ?? null,
      unresolved: !definition,
      disciplineId: definition?.id ?? null,
      name,
      circle: Math.max(1, number(record.circle ?? record.Circle) || 1),
      startedAtCircle: 1,
      questor: false,
    });
    (definition ? mapped : unresolved).push(`Discipline: ${name}`);
  }
  const importRanked = (rawValue: unknown, kind: 'talent' | 'skill') => {
    if (!Array.isArray(rawValue)) return;
    for (const value of rawValue) {
      const record = value as Record<string, unknown>;
      const name = text(record.name ?? record.Name);
      const definition = [...earthdawnDefinitionById.values()].find(
        (item) =>
          item.kind === kind && item.name.toLowerCase() === name.toLowerCase(),
      );
      const common = {
        id: crypto.randomUUID(),
        definitionId: definition?.id ?? null,
        sourceId: definition?.sourceId ?? null,
        source: definition?.source ?? null,
        page: definition?.page ?? null,
        unresolved: !definition,
        name,
        rank: number(record.rank ?? record.Rank),
        freeRank: 0,
        attribute: 'dexterity' as const,
        bonus: 0,
        notes: '',
      };
      if (kind === 'talent')
        character.talents.push({
          ...common,
          action: '',
          strain: 0,
          disciplineSources: [],
          optional: false,
        });
      else
        character.skills.push({
          ...common,
          category: 'general',
          action: '',
          strain: 0,
        });
      (definition ? mapped : unresolved).push(`${kind}: ${name}`);
    }
  };
  importRanked(raw.Talents ?? raw.talents, 'talent');
  importRanked(raw.Skills ?? raw.skills, 'skill');
  customized.push(
    'Steps fields without stable official definitions are retained as editable character text.',
  );
  character.notes.importReview = { mapped, customized, ignored, unresolved };
  return earthdawn4eCharacterSchema.parse(character);
}
