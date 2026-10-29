import {
  attributeModifierCosts,
  deriveCharacter,
  earthdawnAttributeValues,
  magicEffectModifierValue,
} from './engine';
import { sharingRuleWithoutPrerequisites } from './matrix-sharing';
import { earthdawnPathById, type PathBonusTarget } from './path-profiles';
import {
  createActivityEntry,
  mysticPathModifierValue,
  pathEligibility,
  reconcileFreeMatrices,
  refundableLedgerEntry,
} from './rules';
import type { Earthdawn4eCharacter } from './schema';

export const earthdawnDynamicRecordCapabilities = [
  { kind: 'race', create: true, read: true, update: true, remove: true },
  { kind: 'portrait', create: true, read: true, update: true, remove: true },
  { kind: 'discipline', create: true, read: true, update: true, remove: true },
  { kind: 'questor', create: true, read: true, update: true, remove: true },
  { kind: 'mystic-path', create: true, read: true, update: true, remove: true },
  { kind: 'talent', create: true, read: true, update: true, remove: true },
  { kind: 'skill', create: true, read: true, update: true, remove: true },
  { kind: 'knack', create: true, read: true, update: true, remove: true },
  { kind: 'spell', create: true, read: true, update: true, remove: true },
  { kind: 'matrix', create: true, read: true, update: true, remove: true },
  { kind: 'ability', create: true, read: true, update: true, remove: true },
  {
    kind: 'magic-effect',
    create: true,
    read: true,
    update: true,
    remove: true,
  },
  { kind: 'equipment', create: true, read: true, update: true, remove: true },
  { kind: 'weapon', create: true, read: true, update: true, remove: true },
  { kind: 'modifier', create: true, read: true, update: true, remove: true },
  { kind: 'note', create: true, read: true, update: true, remove: true },
] as const;

export type EarthdawnDynamicRecordKind =
  (typeof earthdawnDynamicRecordCapabilities)[number]['kind'];

export interface EarthdawnRecordTarget {
  kind: EarthdawnDynamicRecordKind;
  id: string | null;
}

export interface EarthdawnRemovalImpact {
  kind: 'remove' | 'detach' | 'add' | 'update' | 'warning' | 'derived';
  text: string;
}

export interface EarthdawnRemovalPlan {
  target: EarthdawnRecordTarget;
  title: string;
  blockers: string[];
  impacts: EarthdawnRemovalImpact[];
  refundableEntryId: string | null;
}

const unique = <T>(values: T[]) => [...new Set(values)];

const namedTarget = (
  character: Earthdawn4eCharacter,
  target: EarthdawnRecordTarget,
) => {
  const id = target.id;
  if (target.kind === 'race') return character.identity.raceName || 'Race';
  if (target.kind === 'portrait') return 'portrait';
  if (target.kind === 'discipline')
    return character.disciplines.find((item) => item.id === id)?.name;
  if (target.kind === 'questor')
    return (
      character.questorPaths.find((item) => item.id === id)?.patronName ||
      character.questor.patronName ||
      'Questor patron'
    );
  if (target.kind === 'mystic-path')
    return character.mysticPaths.find((item) => item.id === id)?.name;
  if (target.kind === 'talent')
    return character.talents.find((item) => item.id === id)?.name;
  if (target.kind === 'skill')
    return character.skills.find((item) => item.id === id)?.name;
  if (target.kind === 'knack')
    return character.knacks.find((item) => item.id === id)?.name;
  if (target.kind === 'spell')
    return character.magic.spells.find((item) => item.id === id)?.name;
  if (target.kind === 'matrix')
    return character.magic.matrices.find((item) => item.id === id)?.name;
  if (target.kind === 'ability')
    return character.abilities.find((item) => item.id === id)?.name;
  if (target.kind === 'magic-effect')
    return character.magic.effects.find((item) => item.id === id)?.name;
  if (target.kind === 'equipment')
    return character.equipment.find((item) => item.id === id)?.name;
  if (target.kind === 'weapon')
    return character.weapons.find((item) => item.id === id)?.name;
  if (target.kind === 'modifier')
    return character.health.modifiers.find((item) => item.id === id)?.name;
  if (target.kind === 'note')
    return character.notes.entries.find((item) => item.id === id)?.title;
  return undefined;
};

const automaticTalentCanBeRemoved = (
  character: Earthdawn4eCharacter,
  talent: Earthdawn4eCharacter['talents'][number],
) =>
  talent.creationOwned &&
  talent.disciplineSources.length === 0 &&
  talent.rank === 0 &&
  talent.freeRank === 0 &&
  (!talent.notes.trim() ||
    /Granted by (Race|.*Discipline)/i.test(talent.notes)) &&
  !character.advancement.ledger.some(
    ({ targetId, type }) => targetId === talent.id && type === 'talent',
  );

const suspendInvalidPaths = (character: Earthdawn4eCharacter) => ({
  ...character,
  mysticPaths: character.mysticPaths.map((record) => {
    const path = earthdawnPathById.get(record.definitionId);
    if (
      !path ||
      pathEligibility(character, path, record.rank).blockers.length === 0
    )
      return record;
    return {
      ...record,
      active: false,
      suspendedReason: 'A recorded prerequisite was removed.',
    };
  }),
});

const removeWithoutActivity = (
  character: Earthdawn4eCharacter,
  target: EarthdawnRecordTarget,
) => {
  const id = target.id;
  if (target.kind === 'portrait') return { ...character, portrait: null };
  if (target.kind === 'race') {
    const raceSource = character.identity.raceId
      ? `race:${character.identity.raceId}`
      : null;
    const talents = character.talents.flatMap((talent) => {
      if (!raceSource || !talent.disciplineSources.includes(raceSource))
        return [talent];
      const next = {
        ...talent,
        disciplineSources: talent.disciplineSources.filter(
          (source) => source !== raceSource,
        ),
      };
      return automaticTalentCanBeRemoved(character, next) ? [] : [next];
    });
    const attributePointsSpent = Object.values(
      character.creation.attributePoints,
    ).reduce((sum, value) => sum + (attributeModifierCosts[value] ?? 0), 0);
    const karmaMaximum = Math.max(
      0,
      25 - attributePointsSpent + character.health.karmaAdjustment,
    );
    return {
      ...character,
      identity: { ...character.identity, raceId: null, raceName: '' },
      raceSnapshot: null,
      attributes: Object.fromEntries(
        Object.entries(character.attributes).map(([attributeId, attribute]) => [
          attributeId,
          { ...attribute, racial: 10 },
        ]),
      ) as Earthdawn4eCharacter['attributes'],
      talents,
      abilities: character.abilities.filter(
        ({ definitionId }) => !definitionId?.startsWith('race-grant:'),
      ),
      health: {
        ...character.health,
        karmaMaximum,
        karmaCurrent: Math.min(character.health.karmaCurrent, karmaMaximum),
        modifiers: character.health.modifiers.filter(
          ({ name }) => !name.startsWith('Racial:'),
        ),
      },
    };
  }
  if (target.kind === 'discipline') {
    const record = character.disciplines.find((item) => item.id === id);
    if (!record) return character;
    const disciplineId = record.disciplineId;
    const freeMatrixTalentIds = new Set(
      character.magic.matrices
        .filter(({ source }) => source === `free:${record.id}`)
        .map(({ talentId }) => talentId)
        .filter((talentId): talentId is string => Boolean(talentId)),
    );
    const next = {
      ...character,
      disciplines: character.disciplines.filter((item) => item.id !== id),
      talents: character.talents.flatMap((talent) => {
        if (freeMatrixTalentIds.has(talent.id)) return [];
        if (!disciplineId || !talent.disciplineSources.includes(disciplineId))
          return [talent];
        const updated = {
          ...talent,
          disciplineSources: talent.disciplineSources.filter(
            (source) => source !== disciplineId,
          ),
        };
        return automaticTalentCanBeRemoved(character, updated) ? [] : [updated];
      }),
    };
    return suspendInvalidPaths(reconcileFreeMatrices(next));
  }
  if (target.kind === 'questor') {
    const questorPaths = character.questorPaths.filter(
      (item) => item.id !== id,
    );
    const primary = questorPaths[0];
    return {
      ...character,
      identity: {
        ...character.identity,
        passion: primary?.patronName ?? '',
      },
      questorPaths,
      questor: primary
        ? {
            ...character.questor,
            patronId: primary.patronId,
            patronName: primary.patronName,
            rank: primary.rank,
            tier: primary.tier,
            outOfFavor: primary.outOfFavor,
            notes: primary.notes,
          }
        : {
            ...character.questor,
            patronId: null,
            patronName: '',
            rank: 0,
            tier: 'none' as const,
            outOfFavor: false,
            notes: '',
          },
    };
  }
  if (target.kind === 'mystic-path') {
    const path = character.mysticPaths.find((item) => item.id === id);
    if (!path) return character;
    return {
      ...character,
      mysticPaths: character.mysticPaths.filter((item) => item.id !== id),
      health: {
        ...character.health,
        bloodMagicDamage: Math.max(
          0,
          character.health.bloodMagicDamage - path.bloodMagicDamage,
        ),
      },
    };
  }
  if (target.kind === 'talent' || target.kind === 'skill') {
    const matrices =
      target.kind === 'talent'
        ? character.magic.matrices.filter((matrix) => matrix.talentId !== id)
        : character.magic.matrices;
    const next = {
      ...character,
      talents:
        target.kind === 'talent'
          ? character.talents.filter((item) => item.id !== id)
          : character.talents,
      skills:
        target.kind === 'skill'
          ? character.skills.filter((item) => item.id !== id)
          : character.skills,
      knacks:
        target.kind === 'talent'
          ? character.knacks.map((knack) =>
              knack.talentId === id ? { ...knack, talentId: null } : knack,
            )
          : character.knacks,
      weapons: character.weapons.map((weapon) =>
        weapon.attackSourceId === id
          ? { ...weapon, attackSourceId: null }
          : weapon,
      ),
      mysticPaths: character.mysticPaths.map((path) => ({
        ...path,
        optionTalentIds: path.optionTalentIds.filter(
          (talentId) => talentId !== id,
        ),
      })),
      magic: { ...character.magic, matrices },
    };
    return suspendInvalidPaths(next);
  }
  if (target.kind === 'knack')
    return {
      ...character,
      knacks: character.knacks.filter((item) => item.id !== id),
    };
  if (target.kind === 'spell')
    return {
      ...character,
      magic: {
        ...character.magic,
        spells: character.magic.spells.filter((item) => item.id !== id),
        matrices: character.magic.matrices.map((matrix) => {
          if (!id || !matrix.spellIds.includes(id)) return matrix;
          const assigned = character.magic.spells.filter((spell) =>
            matrix.spellIds.includes(spell.id),
          );
          const removeGroup =
            sharingRuleWithoutPrerequisites(assigned)?.kind === 'squeeze';
          const spellIds = removeGroup
            ? []
            : matrix.spellIds.filter((spellId) => spellId !== id);
          return {
            ...matrix,
            spellIds,
            spellId:
              removeGroup || matrix.spellId === id
                ? (spellIds[0] ?? null)
                : matrix.spellId,
          };
        }),
      },
    };
  if (target.kind === 'matrix')
    return {
      ...character,
      magic: {
        ...character.magic,
        matrices: character.magic.matrices.filter((item) => item.id !== id),
      },
    };
  if (target.kind === 'ability')
    return {
      ...character,
      abilities: character.abilities.filter((item) => item.id !== id),
    };
  if (target.kind === 'magic-effect')
    return {
      ...character,
      magic: {
        ...character.magic,
        effects: character.magic.effects.filter((item) => item.id !== id),
      },
    };
  if (target.kind === 'equipment')
    return {
      ...character,
      equipment: character.equipment.filter((item) => item.id !== id),
    };
  if (target.kind === 'weapon')
    return {
      ...character,
      weapons: character.weapons.filter((item) => item.id !== id),
    };
  if (target.kind === 'modifier')
    return {
      ...character,
      health: {
        ...character.health,
        modifiers: character.health.modifiers.filter((item) => item.id !== id),
      },
    };
  if (target.kind === 'note')
    return {
      ...character,
      notes: {
        ...character.notes,
        entries: character.notes.entries.filter((item) => item.id !== id),
      },
    };
  return character;
};

const recordRows = (character: Earthdawn4eCharacter) =>
  [
    ...character.disciplines.map((item) => ['Discipline', item.id, item.name]),
    ...character.questorPaths.map((item) => [
      'Questor patron',
      item.id,
      item.patronName,
    ]),
    ...character.mysticPaths.map((item) => ['Mystic Path', item.id, item.name]),
    ...character.talents.map((item) => ['Talent', item.id, item.name]),
    ...character.skills.map((item) => ['Skill', item.id, item.name]),
    ...character.knacks.map((item) => ['Knack', item.id, item.name]),
    ...character.abilities.map((item) => ['Ability', item.id, item.name]),
    ...character.magic.spells.map((item) => ['Spell', item.id, item.name]),
    ...character.magic.matrices.map((item) => ['Matrix', item.id, item.name]),
    ...character.magic.effects.map((item) => [
      'Magic effect',
      item.id,
      item.name,
    ]),
    ...character.equipment.map((item) => ['Equipment', item.id, item.name]),
    ...character.weapons.map((item) => ['Weapon', item.id, item.name]),
    ...character.health.modifiers.map((item) => [
      'Temporary modifier',
      item.id,
      item.name,
    ]),
    ...character.notes.entries.map((item) => ['Note', item.id, item.title]),
  ] as Array<[string, string, string]>;

const calculatedValues = (character: Earthdawn4eCharacter) => {
  const attributes = earthdawnAttributeValues(
    character.attributes,
    character.magic.effects,
  );
  const equipment = character.equipment.filter(({ inUse }) => inUse);
  const modifier = (target: string) =>
    character.health.modifiers
      .filter((item) => item.active && item.target === target)
      .reduce((sum, item) => sum + item.value, 0) +
    [...equipment, ...character.weapons.filter(({ inUse }) => inUse)]
      .flatMap(({ modifiers }) => modifiers)
      .filter((item) => item.target === target)
      .reduce((sum, item) => sum + item.value, 0) +
    magicEffectModifierValue(character.magic.effects, target) +
    ((
      [
        'physicalDefense',
        'mysticDefense',
        'socialDefense',
        'mysticArmor',
        'initiative',
        'recovery',
      ] as PathBonusTarget[]
    ).includes(target as PathBonusTarget)
      ? mysticPathModifierValue(character, target as PathBonusTarget)
      : 0);
  const derived = deriveCharacter(
    attributes,
    Math.max(1, ...character.disciplines.map(({ circle }) => circle)),
  );
  return {
    Dexterity: attributes.dexterity,
    Strength: attributes.strength,
    Toughness: attributes.toughness,
    Perception: attributes.perception,
    Willpower: attributes.willpower,
    Charisma: attributes.charisma,
    'Physical Armor':
      equipment.reduce(
        (sum, item) => sum + item.physicalArmor + item.forgedBonus,
        0,
      ) + modifier('physicalArmor'),
    'Mystic Armor':
      derived.mysticArmor +
      equipment.reduce((sum, item) => sum + item.mysticArmor, 0) +
      modifier('mysticArmor'),
    'Physical Defense':
      derived.physicalDefense +
      equipment.reduce((sum, item) => sum + item.physicalDefense, 0) +
      modifier('physicalDefense'),
    'Mystic Defense':
      derived.mysticDefense +
      equipment.reduce((sum, item) => sum + item.mysticDefense, 0) +
      modifier('mysticDefense'),
    'Social Defense': derived.socialDefense + modifier('socialDefense'),
    Initiative:
      derived.initiative +
      modifier('initiative') -
      equipment.reduce((sum, item) => sum + item.initiativePenalty, 0),
    'Carrying Capacity':
      derived.carryingCapacity + modifier('carryingCapacity'),
    'Movement modifier': modifier('movement'),
    'Blood Magic Damage': character.health.bloodMagicDamage,
    'Wound Threshold': derived.woundThreshold + modifier('woundThreshold'),
    Unconsciousness:
      derived.unconsciousness +
      character.health.unconsciousnessBonus +
      modifier('unconsciousness'),
    Death: derived.death + character.health.deathBonus + modifier('death'),
    Recovery: derived.recoveryTests + modifier('recovery'),
    Attack: modifier('attack'),
    Damage: modifier('damage'),
  };
};

export function previewRemoval(
  character: Earthdawn4eCharacter,
  target: EarthdawnRecordTarget,
): EarthdawnRemovalPlan {
  const name = namedTarget(character, target) ?? 'record';
  const blockers: string[] = [];
  const talent =
    target.kind === 'talent'
      ? character.talents.find((item) => item.id === target.id)
      : null;
  const ability =
    target.kind === 'ability'
      ? character.abilities.find((item) => item.id === target.id)
      : null;
  const matrix =
    target.kind === 'matrix'
      ? character.magic.matrices.find((item) => item.id === target.id)
      : null;
  if (
    matrix &&
    (matrix.originType === 'talent' || matrix.originType === 'free-discipline')
  )
    blockers.push(
      `This matrix is managed by its ${matrix.originType === 'talent' ? 'Talent' : 'Discipline'} and must be removed there.`,
    );
  if (talent?.creationOwned && talent.disciplineSources.length)
    blockers.push(
      'This Talent is an automatic Race or Discipline grant and must be removed through that parent record.',
    );
  if (
    ability &&
    (ability.kind === 'racial' ||
      ability.kind === 'discipline' ||
      ability.definitionId?.startsWith('race-grant:'))
  )
    blockers.push(
      'This ability is an automatic grant and must be removed through its Race or Discipline.',
    );
  const next = blockers.length
    ? character
    : removeWithoutActivity(character, target);
  const beforeRows = recordRows(character);
  const afterRows = recordRows(next);
  const afterIds = new Set(afterRows.map(([, id]) => id));
  const beforeIds = new Set(beforeRows.map(([, id]) => id));
  const impacts: EarthdawnRemovalImpact[] = beforeRows
    .filter(([, id]) => !afterIds.has(id))
    .map(([kind, , recordName]) => ({
      kind: 'remove' as const,
      text: `${kind}: ${recordName || 'Untitled'}`,
    }));
  impacts.push(
    ...afterRows
      .filter(([, id]) => !beforeIds.has(id))
      .map(([kind, , recordName]) => ({
        kind: 'add' as const,
        text: `${kind}: ${recordName || 'Untitled'} will be granted or linked.`,
      })),
  );
  for (const before of character.magic.matrices) {
    const after = next.magic.matrices.find(({ id }) => id === before.id);
    if (!after) {
      for (const spellId of before.spellIds) {
        const spell = character.magic.spells.find(({ id }) => id === spellId);
        if (next.magic.spells.some(({ id }) => id === spellId))
          impacts.push({
            kind: 'detach',
            text: `${spell?.name ?? 'Spell'} will remain known and become unassigned when ${before.name} is removed.`,
          });
      }
      continue;
    }
    const detached = before.spellIds.filter(
      (spellId) => !after.spellIds.includes(spellId),
    );
    for (const spellId of detached) {
      const spell = character.magic.spells.find(({ id }) => id === spellId);
      impacts.push({
        kind: 'detach',
        text: `${spell?.name ?? 'Spell'} will be dislodged from ${before.name}.`,
      });
    }
  }
  for (const before of character.weapons) {
    const after = next.weapons.find(({ id }) => id === before.id);
    if (before.attackSourceId && after && !after.attackSourceId)
      impacts.push({
        kind: 'detach',
        text: `${before.name}'s selected attack Talent or Skill will be cleared.`,
      });
  }
  for (const before of character.knacks) {
    const after = next.knacks.find(({ id }) => id === before.id);
    if (before.talentId && after && !after.talentId)
      impacts.push({
        kind: 'detach',
        text: `${before.name}'s linked Talent record will be cleared; the Knack remains recorded.`,
      });
  }
  for (const before of character.mysticPaths) {
    const after = next.mysticPaths.find(({ id }) => id === before.id);
    if (!after) continue;
    const removedOptions = before.optionTalentIds.filter(
      (talentId) => !after.optionTalentIds.includes(talentId),
    );
    for (const talentId of removedOptions) {
      const talent = character.talents.find(({ id }) => id === talentId);
      impacts.push({
        kind: 'detach',
        text: `${talent?.name ?? 'Talent'} will no longer be linked as a ${before.name} option.`,
      });
    }
  }
  for (const after of next.mysticPaths) {
    const before = character.mysticPaths.find(({ id }) => id === after.id);
    if (before?.active && !after.active)
      impacts.push({
        kind: 'update',
        text: `${after.name} benefits will be suspended because a prerequisite is no longer met.`,
      });
  }
  const beforeWarnings = dependencyWarnings(character);
  const afterWarnings = dependencyWarnings(next);
  for (const [recordId, warnings] of afterWarnings) {
    const prior = new Set(beforeWarnings.get(recordId) ?? []);
    const row = afterRows.find(([, id]) => id === recordId);
    for (const warning of warnings)
      if (!prior.has(warning))
        impacts.push({
          kind: 'warning',
          text: `${row?.[2] || 'Preserved record'}: ${warning}`,
        });
  }
  const beforeValues = calculatedValues(character);
  const afterValues = calculatedValues(next);
  for (const label of Object.keys(beforeValues) as Array<
    keyof typeof beforeValues
  >)
    if (beforeValues[label] !== afterValues[label])
      impacts.push({
        kind: 'derived',
        text: `${label}: ${beforeValues[label]} → ${afterValues[label]}`,
      });
  if (
    character.advancement.ledger.some(
      ({ targetId, amount }) => targetId === target.id && amount < 0,
    )
  )
    impacts.push({
      kind: 'warning',
      text: 'Legend Point history will remain unchanged. Removing this record does not refund LP.',
    });
  if (target.kind === 'discipline')
    impacts.push({
      kind: 'warning',
      text: 'Known spells, purchased Talents, and Knacks are preserved; records that lose eligibility will show warnings.',
    });
  if (target.kind === 'race' && character.weapons.length)
    impacts.push({
      kind: 'warning',
      text: `${character.weapons.length} weapon record(s) remain owned, but Race size compatibility cannot be evaluated until another Race is selected.`,
    });
  if (
    target.kind === 'questor' &&
    character.questor.patronName !== next.questor.patronName
  )
    impacts.push({
      kind: 'update',
      text: next.questor.patronName
        ? `${next.questor.patronName} will become the primary Questor patron.`
        : 'Primary Questor status will be cleared.',
    });
  if (target.kind === 'questor')
    impacts.push({
      kind: 'warning',
      text: 'Purchased Devotions remain recorded and may show a missing-patron warning.',
    });
  if (target.kind === 'mystic-path')
    impacts.push({
      kind: 'warning',
      text: 'Purchased Path Talent Options remain recorded and will be marked as orphaned.',
    });
  const refundableEntry = [...character.advancement.ledger]
    .reverse()
    .find(
      ({ id, targetId }) =>
        targetId === target.id &&
        refundableLedgerEntry(character.advancement.ledger, id),
    );
  return {
    target,
    title: `Remove ${name}?`,
    blockers,
    impacts: unique(impacts.map((impact) => JSON.stringify(impact))).map(
      (impact) => JSON.parse(impact) as EarthdawnRemovalImpact,
    ),
    refundableEntryId: refundableEntry?.id ?? null,
  };
}

export function applyRemoval(
  character: Earthdawn4eCharacter,
  target: EarthdawnRecordTarget,
) {
  const plan = previewRemoval(character, target);
  if (plan.blockers.length) return character;
  const name = namedTarget(character, target) ?? 'record';
  const next = removeWithoutActivity(character, target);
  if (!character.activity.tracking) return next;
  const equipment =
    target.kind === 'equipment'
      ? character.equipment.find(({ id }) => id === target.id)
      : target.kind === 'weapon'
        ? character.weapons.find(({ id }) => id === target.id)
        : null;
  return {
    ...next,
    activity: {
      ...next.activity,
      ledger: [
        ...next.activity.ledger,
        createActivityEntry({
          type:
            target.kind === 'equipment' || target.kind === 'weapon'
              ? 'equipment'
              : target.kind === 'race'
                ? 'race'
                : 'correction',
          description: `Removed ${name}. Advancement history was preserved.`,
          targetId: target.id,
          targetName: name,
          quantityDelta: equipment ? -equipment.quantity : 0,
          before: 'Present',
          after: 'Removed',
        }),
      ],
    },
  };
}

export function dependencyWarnings(character: Earthdawn4eCharacter) {
  const warnings = new Map<string, string[]>();
  const add = (id: string, warning: string) =>
    warnings.set(id, unique([...(warnings.get(id) ?? []), warning]));
  const talentNames = new Set(character.talents.map(({ name }) => name));
  const spellNames = new Set(character.magic.spells.map(({ name }) => name));
  const disciplineNames = new Set(
    character.disciplines.map(({ name }) => name),
  );
  for (const knack of character.knacks) {
    if (knack.association && !knack.talentId) {
      const associations = knack.association
        .split(/,|\bor\b/i)
        .map((item) => item.trim())
        .filter(Boolean);
      if (
        associations.length &&
        !associations.some((name) => talentNames.has(name))
      )
        add(knack.id, `Missing associated Talent: ${knack.association}.`);
    }
    const missingSpells = (knack.requiredSpells ?? []).filter(
      (name) => !spellNames.has(name),
    );
    if (missingSpells.length)
      add(knack.id, `Missing known spell: ${missingSpells.join(', ')}.`);
    if (knack.discipline && !disciplineNames.has(knack.discipline))
      add(knack.id, `Missing Discipline: ${knack.discipline}.`);
  }
  for (const spell of character.magic.spells)
    if (spell.discipline && !disciplineNames.has(spell.discipline))
      add(spell.id, `No recorded ${spell.discipline} Discipline.`);
  for (const talent of character.talents)
    if (
      talent.pathOriginId &&
      !character.mysticPaths.some(({ id }) => id === talent.pathOriginId)
    )
      add(talent.id, 'The originating Mystic Path is no longer recorded.');
  for (const ability of character.abilities)
    if (ability.kind === 'questor' && !character.questorPaths.length)
      add(ability.id, 'No Questor patron is currently recorded.');
  return warnings;
}
