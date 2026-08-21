import {
  burningWheelLifepathById,
  burningWheelLifepaths,
  burningWheelSkillById,
  burningWheelSkillByName,
  burningWheelTraitById,
  burningWheelTraitByName,
  type BurningWheelStock,
} from './catalog';
import { createBlankBurningWheelCharacter } from './create-character';
import { statDefinitions } from './engine';
import {
  burningWheelCharacterSchema,
  type BurningWheelCharacter,
} from './schema';

type CharredData = Record<string, unknown>;
const asArray = (value: unknown) => (Array.isArray(value) ? value : []);
const asString = (value: unknown) => (typeof value === 'string' ? value : '');
const asNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

export function importCharredCharacter(
  contents: string,
  fileName: string,
): BurningWheelCharacter | null {
  if (!/\.char$/i.test(fileName)) return null;
  let source: CharredData;
  try {
    source = JSON.parse(contents) as CharredData;
  } catch {
    return null;
  }
  const stock = asString(source.stock) as BurningWheelStock;
  if (!['man', 'dwarf', 'elf', 'orc', 'roden', 'wolf', 'troll'].includes(stock))
    return null;
  const character = createBlankBurningWheelCharacter(stock);
  character.identity.name = asString(source.name);
  character.identity.gender = asString(source.gender);
  character.burn.lifepaths = asArray(source.lifepaths).flatMap((raw) => {
    const row = asArray(raw);
    const entry = burningWheelLifepaths.find(
      (candidate) =>
        candidate.stock === stock &&
        candidate.setting === row[0] &&
        candidate.name === row[1],
    );
    if (!entry) return [];
    const defaultTime =
      typeof entry.definition.time === 'number'
        ? entry.definition.time
        : Number(entry.definition.time_expr?.[1] ?? 1);
    return [
      {
        id: crypto.randomUUID(),
        definitionId: entry.id,
        brutalLifeDie: asNumber(row[2]),
        brutalLifeTrait: asString(row[3]),
        time: asNumber(row[4]) || defaultTime,
        weaponChoice: asString(row[5]),
        statChoice: '' as const,
      },
    ];
  });
  for (const raw of asArray(source.stats)) {
    const saved = raw as CharredData;
    const id = asString(
      saved.name,
    ).toLowerCase() as keyof typeof character.burn.stats;
    if (!(id in character.burn.stats)) continue;
    const shade = asString(saved.shade);
    character.burn.stats[id] = {
      ...character.burn.stats[id],
      shade: shade === 'G' || shade === 'W' ? shade : 'B',
      mentalPoints: asNumber(saved.mentalPoints),
      physicalPoints: asNumber(saved.physicalPoints),
      eitherPoints: asNumber(saved.eitherPoints),
    };
  }
  const skillGroups = (source.skills ?? {}) as CharredData;
  character.burn.skills = [
    ...asArray(skillGroups.lifepath),
    ...asArray(skillGroups.general),
  ].flatMap((raw) => {
    const saved = raw as CharredData;
    const name = asString(saved.name);
    if (!name) return [];
    const definition = burningWheelSkillByName.get(name.toLowerCase());
    return [
      {
        id: crypto.randomUUID(),
        definitionId: definition?.id ?? null,
        customName: definition ? '' : name,
        lifepathPoints: asNumber(saved.lifepathPoints),
        generalPoints: asNumber(saved.generalPoints),
        tests: { routine: 0, difficult: 0, challenging: 0 },
        notes: '',
      },
    ];
  });
  character.burn.traits = asArray(source.traits).flatMap((raw) => {
    const name = asString((raw as CharredData).name);
    if (!name) return [];
    const definition = burningWheelTraitByName.get(name.toLowerCase());
    return [
      {
        id: crypto.randomUUID(),
        definitionId: definition?.id ?? null,
        customName: definition ? '' : name,
        notes: '',
      },
    ];
  });
  for (const kind of ['gear', 'property'] as const) {
    for (const raw of asArray(source[kind])) {
      const saved = raw as CharredData;
      character.possessions.push({
        id: crypto.randomUUID(),
        kind,
        definitionId: null,
        name: asString(saved.desc),
        cost: asNumber(saved.cost),
        notes: '',
        damaged: false,
      });
    }
  }
  character.burn.settings.appropriateWeapons =
    source.approp_weapons && typeof source.approp_weapons === 'object'
      ? (source.approp_weapons as Record<string, string[]>)
      : {};
  return burningWheelCharacterSchema.parse(character);
}

export function serializeCharredCharacter(character: BurningWheelCharacter) {
  const skillName = (skill: BurningWheelCharacter['burn']['skills'][number]) =>
    (skill.definitionId &&
      burningWheelSkillById.get(skill.definitionId)?.name) ||
    skill.customName;
  const lifepathSkillNames = new Set(
    character.burn.lifepaths.flatMap(
      (selected) =>
        burningWheelLifepathById
          .get(selected.definitionId)
          ?.definition.skills?.flatMap(([, ...names]) => names) ?? [],
    ),
  );
  const serializedSkills = character.burn.skills.map((skill) => ({
    name: skillName(skill),
    lifepathPoints: skill.lifepathPoints,
    generalPoints: skill.generalPoints,
  }));
  return JSON.stringify(
    {
      serialize_version: 1,
      name: character.identity.name,
      gender: character.identity.gender,
      stock: character.stock,
      lifepaths: character.burn.lifepaths.flatMap((selected) => {
        const definition = burningWheelLifepathById.get(selected.definitionId);
        return definition
          ? [
              [
                definition.setting,
                definition.name,
                selected.brutalLifeDie,
                selected.brutalLifeTrait,
                selected.time,
                selected.weaponChoice || null,
                definition.definition.stat ?? [],
              ],
            ]
          : [];
      }),
      stats: statDefinitions.map(({ id, label }) => ({
        name: label,
        shade: character.burn.stats[id].shade,
        mentalPoints: character.burn.stats[id].mentalPoints,
        physicalPoints: character.burn.stats[id].physicalPoints,
        eitherPoints: character.burn.stats[id].eitherPoints,
      })),
      skills: {
        lifepath: serializedSkills.filter(({ name }) =>
          lifepathSkillNames.has(name),
        ),
        general: serializedSkills.filter(
          ({ name }) => !lifepathSkillNames.has(name),
        ),
      },
      traits: character.burn.traits.map((trait) => ({
        name:
          (trait.definitionId &&
            burningWheelTraitById.get(trait.definitionId)?.name) ||
          trait.customName,
      })),
      gear: character.possessions
        .filter(({ kind }) => kind !== 'property')
        .map(({ name: desc, cost }) => ({ desc, cost })),
      property: character.possessions
        .filter(({ kind }) => kind === 'property')
        .map(({ name: desc, cost }) => ({ desc, cost })),
      relationships: character.connections.relationships.map((item) => ({
        desc: item.name,
        importance: item.importance,
        isImmedFam: item.immediateFamily,
        isOtherFam: item.otherFamily,
        isRomantic: item.romantic,
        isForbidden: item.forbidden,
        isHateful: item.hateful,
      })),
      affiliations: character.connections.affiliations.map((item) => ({
        desc: item.name,
        importance: item.importance,
      })),
      reputations: character.connections.reputations.map((item) => ({
        desc: item.name,
        importance: item.importance,
      })),
      attr_mod_questions: {},
      brutal_life_withdrawn: false,
      approp_weapons: character.burn.settings.appropriateWeapons,
    },
    null,
    2,
  );
}
