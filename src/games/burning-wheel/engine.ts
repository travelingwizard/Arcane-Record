import {
  burningWheelCatalog,
  burningWheelLifepathById,
  burningWheelSkillById,
  burningWheelSkillByName,
  burningWheelTraitById,
  burningWheelTraitByName,
  lifepathsForStock,
  type LifepathCatalogEntry,
  type RuleExpression,
} from './catalog';
import type { BurningWheelCharacter } from './schema';

export interface RequirementResult {
  eligible: boolean;
  requiredTraits: string[];
}

const selectedDefinitions = (character: BurningWheelCharacter) =>
  character.burn.lifepaths
    .map((selected) => ({
      selected,
      definition: burningWheelLifepathById.get(selected.definitionId),
    }))
    .filter(
      (value): value is typeof value & { definition: LifepathCatalogEntry } =>
        Boolean(value.definition),
    );

export function characterAge(character: BurningWheelCharacter) {
  let age = 0;
  let previousSetting = '';
  for (const { selected, definition } of selectedDefinitions(character)) {
    if (
      previousSetting &&
      previousSetting !== definition.setting &&
      character.stock !== 'wolf'
    ) {
      age += 1;
    }
    age += selected.time;
    previousSetting = definition.setting;
  }
  return age;
}

export function evaluateRequirement(
  expression: RuleExpression | undefined,
  character: BurningWheelCharacter,
): RequirementResult {
  if (!expression) return { eligible: true, requiredTraits: [] };
  if (!Array.isArray(expression) || expression.length === 0) {
    return { eligible: false, requiredTraits: [] };
  }
  const selected = selectedDefinitions(character);
  const names = new Set(
    selected.map(({ definition }) => definition.name.toLowerCase()),
  );
  const qualified = new Set(
    selected.map(
      ({ definition }) =>
        `${definition.setting.toLowerCase()}:${definition.name.toLowerCase()}`,
    ),
  );
  const operation = expression[0];
  const terms = expression.slice(1);
  if (typeof operation !== 'string')
    return { eligible: false, requiredTraits: [] };
  if (!operation.startsWith('+') || operation === '+has_lifepath_in') {
    const candidates = (
      operation === '+has_lifepath_in' ? terms : expression
    ).filter((term): term is string => typeof term === 'string');
    return {
      eligible: candidates.some((candidate) =>
        candidate.includes(':')
          ? qualified.has(candidate.toLowerCase())
          : names.has(candidate.toLowerCase()),
      ),
      requiredTraits: [],
    };
  }
  if (operation === '+sex') {
    return {
      eligible:
        String(terms[0] ?? '').toLowerCase() ===
        character.identity.gender.toLowerCase(),
      requiredTraits: [],
    };
  }
  if (operation === '+has_n_lifepaths_or_more') {
    return {
      eligible: selected.length >= Number(terms[0]),
      requiredTraits: [],
    };
  }
  if (operation === '+has_n_lifepaths_or_less') {
    return {
      eligible: selected.length <= Number(terms[0]),
      requiredTraits: [],
    };
  }
  if (operation === '+age_less_than') {
    return {
      eligible: characterAge(character) < Number(terms[0]),
      requiredTraits: [],
    };
  }
  if (operation === '+age_greater_than') {
    return {
      eligible: characterAge(character) > Number(terms[0]),
      requiredTraits: [],
    };
  }
  if (operation === '+trait') {
    return { eligible: true, requiredTraits: [String(terms[0] ?? '')] };
  }
  if (operation === '+has_n_lifepaths_in') {
    const needed = Number(terms[0]);
    const candidates = terms.slice(1).map(String);
    const count = selected.filter(({ definition }) =>
      candidates.some((candidate) =>
        candidate.includes(':')
          ? `${definition.setting.toLowerCase()}:${definition.name.toLowerCase()}` ===
            candidate.toLowerCase()
          : definition.name.toLowerCase() === candidate.toLowerCase(),
      ),
    ).length;
    return { eligible: count >= needed, requiredTraits: [] };
  }
  if (operation === '+not') {
    const result = evaluateRequirement(terms[0] as RuleExpression, character);
    return {
      eligible: !result.eligible,
      requiredTraits: result.requiredTraits,
    };
  }
  if (operation === '+and' || operation === '+or') {
    const results = terms.map((term) =>
      evaluateRequirement(term as RuleExpression, character),
    );
    const eligible =
      operation === '+and'
        ? results.every((result) => result.eligible)
        : results.some((result) => result.eligible);
    const contributing =
      operation === '+or'
        ? (results.find((result) => result.eligible)?.requiredTraits ?? [])
        : results.flatMap((result) => result.requiredTraits);
    return { eligible, requiredTraits: eligible ? contributing : [] };
  }
  return { eligible: false, requiredTraits: [] };
}

export function availableLifepaths(character: BurningWheelCharacter) {
  const all = lifepathsForStock(character.stock);
  if (!character.burn.settings.enforceLifepathRequirements) return all;
  const selected = selectedDefinitions(character);
  if (selected.length === 0) {
    return all.filter(
      ({ setting, name }) =>
        !setting.toLowerCase().includes('subsetting') &&
        (name.includes('Born') ||
          name === 'Son Of A Gun' ||
          name === 'Gifted Child'),
    );
  }
  const last = selected.at(-1)!.definition;
  const allowedSettings = new Set([
    last.setting,
    ...(last.definition.key_leads ?? []),
  ]);
  return all.filter(
    (entry) =>
      allowedSettings.has(entry.setting) &&
      !entry.name.includes('Born') &&
      entry.name !== 'Son Of A Gun' &&
      evaluateRequirement(entry.definition.requires_expr, character).eligible,
  );
}

const resolvedLifepath = (
  entry: LifepathCatalogEntry,
  time: number,
  previousResourcePoints: number,
) => {
  const definition = entry.definition;
  let resourcePoints = typeof definition.res === 'number' ? definition.res : 0;
  if (definition.res === '*' && definition.res_expr?.[0] === '+mult_time') {
    resourcePoints = time * Number(definition.res_expr[1]);
  } else if (
    definition.res === '*' &&
    definition.res_expr?.[0] === '+mult_prev'
  ) {
    resourcePoints = Math.floor(
      previousResourcePoints * Number(definition.res_expr[1]),
    );
  }
  let lifepathSkillPoints = 0;
  let generalSkillPoints = 0;
  const skills: string[] = [];
  for (const group of definition.skills ?? []) {
    const [points, ...names] = group;
    if (names[0] === 'General') {
      generalSkillPoints +=
        points === '*' && definition.skills_expr?.[0] === '+mult_time'
          ? time * Number(definition.skills_expr[1])
          : Number(points);
    } else {
      lifepathSkillPoints += Number(points);
      skills.push(...names);
    }
  }
  return {
    resourcePoints,
    lifepathSkillPoints,
    generalSkillPoints,
    skills,
    traitPoints: definition.traits?.[0] ?? 0,
    traits: (definition.traits?.slice(1) ?? []) as string[],
    stat: definition.stat ?? [],
  };
};

export function burnTotals(character: BurningWheelCharacter) {
  const age = characterAge(character);
  let resources = 0;
  let lifepathSkillPoints = 0;
  let generalSkillPoints = 0;
  let traitPoints = 0;
  const statPools = { mental: 0, physical: 0, either: 0 };
  const ageRow = burningWheelCatalog.startingStatPointsByStock[
    character.stock
  ].find(({ range }) => age >= range[0] && age <= range[1]);
  statPools.mental = ageRow?.m ?? 0;
  statPools.physical = ageRow?.p ?? 0;
  const skillNames = new Set<string>();
  const lifepathTraitNames = new Set<string>();
  const requiredTraitNames = new Set<string>();
  const occurrences = new Map<string, number>();
  let previousResourcePoints = 0;

  for (const { selected, definition } of selectedDefinitions(character)) {
    const value = resolvedLifepath(
      definition,
      selected.time,
      previousResourcePoints,
    );
    const occurrence = occurrences.get(definition.displayName) ?? 0;
    occurrences.set(definition.displayName, occurrence + 1);
    if (occurrence === 1 && value.traits.length < 2) value.traitPoints--;
    if (occurrence === 2) {
      value.resourcePoints = Math.floor(value.resourcePoints / 2);
      value.lifepathSkillPoints = Math.floor(value.lifepathSkillPoints / 2);
      value.generalSkillPoints = Math.floor(value.generalSkillPoints / 2);
      value.traitPoints = 0;
      value.stat = [];
    } else if (occurrence >= 3) {
      value.resourcePoints = Math.floor(value.resourcePoints / 2);
      value.lifepathSkillPoints = 0;
      value.generalSkillPoints = 0;
      value.traitPoints = 0;
      value.stat = [];
    }
    previousResourcePoints = value.resourcePoints;
    resources += value.resourcePoints;
    lifepathSkillPoints += value.lifepathSkillPoints;
    generalSkillPoints += value.generalSkillPoints;
    traitPoints += Math.max(0, value.traitPoints);
    value.skills.forEach((name) => skillNames.add(name));
    value.traits.forEach((name) => lifepathTraitNames.add(name));
    for (const [points, kind] of value.stat) {
      if (kind === 'm') statPools.mental += points;
      else if (kind === 'p') statPools.physical += points;
      else if (selected.statChoice === 'm') statPools.mental += points;
      else if (selected.statChoice === 'p') statPools.physical += points;
      else statPools.either += points;
    }
    const requirement = evaluateRequirement(
      definition.definition.requires_expr,
      character,
    );
    requirement.requiredTraits.forEach((name) => requiredTraitNames.add(name));
    if (selected.brutalLifeTrait)
      requiredTraitNames.add(selected.brutalLifeTrait);
  }
  return {
    age,
    resources,
    lifepathSkillPoints,
    generalSkillPoints,
    traitPoints,
    statPools,
    skillNames: [...skillNames],
    lifepathTraitNames: [...lifepathTraitNames],
    requiredTraitNames: [...requiredTraitNames],
  };
}

export function brutalLifeOutcome(lifepathCount: number, roll: number) {
  if (lifepathCount < 5 || roll < 1 || roll > 6) return '';
  const suffers = roll === 1 || (lifepathCount > 9 && roll === 2);
  if (!suffers) return '';
  return (
    {
      5: 'Missing Digit',
      6: 'Lame',
      7: 'Missing Eye',
      8: 'Missing Hand',
      9: 'Missing Limb',
    }[lifepathCount] ?? 'Missing Limb'
  );
}

export function reconcileBurnSelections(character: BurningWheelCharacter) {
  const next = structuredClone(character);
  const existingSkills = new Set(
    next.burn.skills.map((skill) => skill.definitionId),
  );
  const existingTraits = new Set(
    next.burn.traits.map((trait) => trait.definitionId),
  );
  const requiredSkillNames = new Set<string>();
  const requiredTraitNames = new Set<string>();
  const availableSkillNames = new Set<string>();
  for (const { definition } of selectedDefinitions(next)) {
    for (const group of definition.definition.skills ?? []) {
      const names = group
        .slice(1)
        .filter((name): name is string => typeof name === 'string');
      names.forEach((name) => availableSkillNames.add(name));
      const required = names[0];
      if (required && required !== 'General') requiredSkillNames.add(required);
    }
    const traits = (definition.definition.traits?.slice(1) ?? []).filter(
      (name): name is string => typeof name === 'string',
    );
    if (traits[0]) requiredTraitNames.add(traits[0]);
    evaluateRequirement(
      definition.definition.requires_expr,
      next,
    ).requiredTraits.forEach((name) => requiredTraitNames.add(name));
  }
  const first = selectedDefinitions(next)[0]?.definition;
  first?.definition.common_traits?.forEach((name) =>
    requiredTraitNames.add(name),
  );

  for (const name of availableSkillNames) {
    const definition = burningWheelSkillByName.get(name.toLowerCase());
    if (!definition || existingSkills.has(definition.id)) continue;
    const required = requiredSkillNames.has(name);
    next.burn.skills.push({
      id: crypto.randomUUID(),
      definitionId: definition.id,
      customName: '',
      lifepathPoints: required
        ? definition.definition.magic || definition.definition.training
          ? 2
          : 1
        : 0,
      generalPoints: 0,
      tests: { routine: 0, difficult: 0, challenging: 0 },
      notes: required ? 'Required by lifepath' : 'Available from lifepath',
    });
    existingSkills.add(definition.id);
  }
  for (const name of requiredTraitNames) {
    const definition = burningWheelTraitByName.get(name.toLowerCase());
    if (!definition || existingTraits.has(definition.id)) continue;
    next.burn.traits.push({
      id: crypto.randomUUID(),
      definitionId: definition.id,
      customName: '',
      notes: requiredTraitNames.has(name)
        ? 'Required by lifepath'
        : 'Available from lifepath',
    });
    existingTraits.add(definition.id);
  }
  return next;
}

export const statDefinitions = [
  { id: 'will', label: 'Will', pool: 'mental' },
  { id: 'perception', label: 'Perception', pool: 'mental' },
  { id: 'power', label: 'Power', pool: 'physical' },
  { id: 'forte', label: 'Forte', pool: 'physical' },
  { id: 'agility', label: 'Agility', pool: 'physical' },
  { id: 'speed', label: 'Speed', pool: 'physical' },
] as const;

export function statRating(
  stat: BurningWheelCharacter['burn']['stats']['will'],
) {
  const shadeCost = stat.shade === 'G' ? 5 : stat.shade === 'W' ? 10 : 0;
  return Math.max(
    0,
    stat.mentalPoints +
      stat.physicalPoints +
      stat.eitherPoints +
      stat.bonus -
      shadeCost,
  );
}

const average = (values: number[]) =>
  Math.floor(values.reduce((a, b) => a + b, 0) / values.length);

export function derivedAttributes(character: BurningWheelCharacter) {
  const stats = Object.fromEntries(
    statDefinitions.map(({ id }) => [id, statRating(character.burn.stats[id])]),
  ) as Record<(typeof statDefinitions)[number]['id'], number>;
  const modifiers = character.burn.attributeModifiers;
  const mortalWound =
    average([stats.power, stats.forte]) + 6 + (modifiers['Mortal Wound'] ?? 0);
  const forte = stats.forte;
  const superficial = Math.floor(forte / 2) + 1;
  const gap = Math.ceil(forte / 2);
  const ptgs = [
    mortalWound - 4,
    mortalWound - 3,
    mortalWound - 2,
    mortalWound - 1,
  ];
  for (let index = 0; index < ptgs.length; index++) {
    const previous = index === 0 ? superficial : ptgs[index - 1];
    ptgs[index] = Math.max(superficial, Math.min(ptgs[index], previous + gap));
  }
  const stride =
    character.stock === 'dwarf'
      ? 6
      : character.stock === 'elf' || character.stock === 'roden'
        ? 8
        : character.stock === 'wolf'
          ? 11
          : 7;
  const reputationPropertyCost =
    character.connections.reputations.reduce(
      (sum, item) => sum + reputationCost(item.importance),
      0,
    ) +
    character.possessions
      .filter(({ kind }) => kind === 'property')
      .reduce((sum, item) => sum + item.cost, 0);
  const resourceBasis =
    reputationPropertyCost +
    character.connections.affiliations.reduce(
      (sum, item) => sum + affiliationCost(item.importance),
      0,
    );
  const traitNames = new Set(
    character.burn.traits.map((trait) =>
      trait.definitionId
        ? burningWheelTraitById.get(trait.definitionId)?.name
        : trait.customName,
    ),
  );
  const hasSpitePath = selectedDefinitions(character).some(
    ({ definition }) => definition.setting === 'Path Of Spite Subsetting',
  );
  const emotionalLabel =
    character.stock === 'dwarf'
      ? 'Greed'
      : character.stock === 'elf'
        ? hasSpitePath
          ? 'Spite'
          : 'Grief'
        : character.stock === 'orc'
          ? 'Hatred'
          : character.stock === 'wolf' && traitNames.has('Chosen Wolf')
            ? 'Ancestral Taint'
            : character.stock === 'man' && traitNames.has('Faithful')
              ? 'Faith'
              : '';
  const emotional = emotionalLabel
    ? {
        label: emotionalLabel,
        shade:
          emotionalLabel === 'Faith' ? 'B' : character.burn.stats.will.shade,
        rating:
          (emotionalLabel === 'Faith'
            ? 3
            : emotionalLabel === 'Ancestral Taint'
              ? 1
              : 0) + (modifiers[emotionalLabel] ?? 0),
      }
    : null;
  return {
    stats,
    health: average([stats.will, stats.forte]) + (modifiers.Health ?? 0),
    steel: 3 + (modifiers.Steel ?? 0),
    reflexes: average([stats.perception, stats.agility, stats.speed]),
    mortalWound,
    hesitation: Math.max(0, 10 - stats.will),
    stride,
    circles:
      Math.max(1, Math.floor(stats.will / 2)) +
      (reputationPropertyCost >= 50 ? 1 : 0),
    resources: Math.floor(resourceBasis / 15),
    emotional,
    ptgs: {
      superficial,
      light: ptgs[0],
      midi: ptgs[1],
      severe: ptgs[2],
      traumatic: ptgs[3],
      mortal: mortalWound,
    },
  };
}

export function skillRating(
  character: BurningWheelCharacter,
  skill: BurningWheelCharacter['burn']['skills'][number],
) {
  const definition = skill.definitionId
    ? burningWheelSkillById.get(skill.definitionId)
    : undefined;
  const attributes = derivedAttributes(character);
  const roots = definition?.definition.roots ?? ['Perception'];
  const rootRatings = roots.map((root) => {
    const id = root.toLowerCase() as keyof typeof attributes.stats;
    return attributes.stats[id] ?? 0;
  });
  const openCost =
    definition?.definition.magic || definition?.definition.training ? 2 : 1;
  const spent = skill.lifepathPoints + skill.generalPoints;
  return spent === 0
    ? 0
    : Math.max(0, Math.floor(average(rootRatings) / 2) + spent - openCost);
}

export function relationshipCost(
  relationship: BurningWheelCharacter['connections']['relationships'][number],
) {
  let cost = { minor: 5, significant: 10, powerful: 15 }[
    relationship.importance
  ];
  if (relationship.immediateFamily) cost -= 2;
  if (relationship.otherFamily) cost -= 1;
  if (relationship.romantic) cost -= 2;
  if (relationship.forbidden) cost -= 1;
  if (relationship.hateful) cost -= 2;
  return Math.max(0, cost);
}

export const affiliationCost = (importance: 'small' | 'large' | 'national') =>
  ({ small: 10, large: 25, national: 50 })[importance];
export const reputationCost = (importance: 'local' | 'regional' | 'national') =>
  ({ local: 7, regional: 25, national: 45 })[importance];

export function spentResourcePoints(character: BurningWheelCharacter) {
  return (
    character.possessions.reduce((sum, item) => sum + item.cost, 0) +
    character.connections.relationships.reduce(
      (sum, item) => sum + relationshipCost(item),
      0,
    ) +
    character.connections.affiliations.reduce(
      (sum, item) => sum + affiliationCost(item.importance),
      0,
    ) +
    character.connections.reputations.reduce(
      (sum, item) => sum + reputationCost(item.importance),
      0,
    )
  );
}

export function traitCost(character: BurningWheelCharacter) {
  const totals = burnTotals(character);
  const lifepathNames = new Set(totals.lifepathTraitNames);
  const first = selectedDefinitions(character)[0]?.definition;
  const commonNames = new Set(first?.definition.common_traits ?? []);
  return character.burn.traits.reduce((sum, trait) => {
    const definition = trait.definitionId
      ? burningWheelTraitById.get(trait.definitionId)
      : undefined;
    if (!definition) return sum;
    if (commonNames.has(definition.name)) return sum;
    return (
      sum +
      (lifepathNames.has(definition.name)
        ? 1
        : (definition.definition.cost ?? 0))
    );
  }, 0);
}

export function unresolvedBurnWarnings(character: BurningWheelCharacter) {
  const totals = burnTotals(character);
  const warnings: string[] = [];
  const used = { mental: 0, physical: 0, either: 0 };
  for (const stat of Object.values(character.burn.stats)) {
    used.mental += stat.mentalPoints;
    used.physical += stat.physicalPoints;
    used.either += stat.eitherPoints;
  }
  for (const pool of ['mental', 'physical', 'either'] as const) {
    if (used[pool] > totals.statPools[pool]) {
      warnings.push(`${pool} stat points exceed the available pool.`);
    }
  }
  const skillSpent = character.burn.skills.reduce(
    (sum, skill) => ({
      lifepath: sum.lifepath + skill.lifepathPoints,
      general: sum.general + skill.generalPoints,
    }),
    { lifepath: 0, general: 0 },
  );
  if (skillSpent.lifepath > totals.lifepathSkillPoints)
    warnings.push('Lifepath skill points exceed the available pool.');
  if (skillSpent.general > totals.generalSkillPoints)
    warnings.push('General skill points exceed the available pool.');
  if (traitCost(character) > totals.traitPoints)
    warnings.push('Trait points exceed the available pool.');
  if (spentResourcePoints(character) > totals.resources)
    warnings.push('Resource points exceed the available pool.');
  const selectedTraits = new Set(
    character.burn.traits.map((trait) =>
      trait.definitionId
        ? burningWheelTraitById.get(trait.definitionId)?.name.toLowerCase()
        : trait.customName.toLowerCase(),
    ),
  );
  for (const required of totals.requiredTraitNames) {
    if (
      !selectedTraits.has(required.toLowerCase()) &&
      !burningWheelTraitByName.has(required.toLowerCase())
    ) {
      warnings.push(
        `The ${required} Trait required by a lifepath is unresolved.`,
      );
    }
  }
  return warnings;
}
