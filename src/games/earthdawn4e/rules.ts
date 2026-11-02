import {
  earthdawnDefinitionById,
  earthdawnDisciplines,
  earthdawnRaces,
  earthdawnTalents,
  type EarthdawnDiscipline,
  type EarthdawnRace,
} from './catalog';
import type { Earthdawn4eCharacter } from './schema';
import {
  earthdawnPathById,
  type EarthdawnPathProfile,
  type PathBonusTarget,
  pathRankModifier,
} from './path-profiles';
import {
  matchingSharingRule,
  missingSharingPrerequisites,
  matrixGroupWarnings,
  sharingRuleWithoutPrerequisites,
  squeezeSharingRules,
} from './matrix-sharing';

export type EarthdawnMatrix = Earthdawn4eCharacter['magic']['matrices'][number];

export const matrixTalentTypes = {
  'spell matrix': 'standard',
  'standard matrix': 'standard',
  'enhanced matrix': 'enhanced',
  'shared matrix': 'shared',
  'armored matrix': 'armored',
} as const;

export function matrixTypeForTalent(name: string) {
  return matrixTalentTypes[
    name.trim().toLocaleLowerCase() as keyof typeof matrixTalentTypes
  ];
}

export function isMatrixTalent(name: string) {
  return Boolean(matrixTypeForTalent(name));
}

export function matrixDeathRating(type: EarthdawnMatrix['type']) {
  if (type === 'armored') return 25;
  if (type === 'shared') return 20;
  if (type === 'enhanced') return 15;
  return 10;
}

export function matrixCapacityUsed(
  matrix: EarthdawnMatrix,
  spells: Earthdawn4eCharacter['magic']['spells'],
  knacks: Earthdawn4eCharacter['knacks'] = [],
) {
  const assigned = spells.filter((spell) => matrix.spellIds.includes(spell.id));
  if (!assigned.length) return 0;
  if (matrix.type !== 'shared')
    return Math.max(...assigned.map((spell) => spell.circle));
  const remaining = [...assigned];
  let capacity = 0;
  while (remaining.length) {
    let groupedIndexes: number[] = [];
    for (let mask = 1; mask < 1 << remaining.length; mask += 1) {
      const indexes = remaining.flatMap((_, index) =>
        mask & (1 << index) ? [index] : [],
      );
      if (
        indexes.length > groupedIndexes.length &&
        matchingSharingRule(
          indexes.map((index) => remaining[index]!),
          knacks,
          matrix,
        )
      )
        groupedIndexes = indexes;
    }
    if (groupedIndexes.length > 1) {
      capacity += Math.max(
        ...groupedIndexes.map((index) => remaining[index]!.circle),
      );
      for (const index of groupedIndexes.sort((a, b) => b - a))
        remaining.splice(index, 1);
    } else capacity += remaining.shift()!.circle;
  }
  return capacity;
}

export function canAssignSpellToMatrix(
  matrix: EarthdawnMatrix,
  candidate: Earthdawn4eCharacter['magic']['spells'][number],
  spells: Earthdawn4eCharacter['magic']['spells'],
  knacks: Earthdawn4eCharacter['knacks'],
) {
  if (candidate.circle > matrix.rank) return false;
  const assigned = spells.filter((spell) => matrix.spellIds.includes(spell.id));
  if (!assigned.length) return true;
  const prospective = [...assigned, candidate];
  if (
    matrix.type !== 'shared' &&
    !matchingSharingRule(prospective, knacks, matrix)
  )
    return false;
  const prospectiveMatrix = {
    ...matrix,
    spellIds: prospective.map(({ id }) => id),
  };
  return matrixCapacityUsed(prospectiveMatrix, spells, knacks) <= matrix.rank;
}

export function matrixIssues(
  matrix: EarthdawnMatrix,
  spells: Earthdawn4eCharacter['magic']['spells'],
  highestCircle: number,
  knacks: Earthdawn4eCharacter['knacks'] = [],
) {
  const assigned = spells.filter((spell) => matrix.spellIds.includes(spell.id));
  const issues: string[] = [];
  if (
    matrix.type !== 'shared' &&
    assigned.length > 1 &&
    !matchingSharingRule(assigned, knacks, matrix)
  )
    issues.push('These spells are not an allowed matrix-sharing combination.');
  const missing = missingSharingPrerequisites(assigned, knacks);
  if (missing.length)
    issues.push(`Missing matrix-sharing knack: ${missing.join(' and ')}.`);
  const assignedRule = sharingRuleWithoutPrerequisites(assigned);
  const containsSqueezedGroup =
    assignedRule?.kind === 'squeeze' ||
    squeezeSharingRules(assigned).length > 0;
  if (
    containsSqueezedGroup &&
    (matrix.type === 'shared' ||
      matrix.type === 'object' ||
      matrix.originType === 'item' ||
      matrix.divided)
  )
    issues.push(
      'Squeeze knacks cannot be used with Shared, divided, or external spell matrices.',
    );
  issues.push(...matrixGroupWarnings(assigned));
  if (matrixCapacityUsed(matrix, spells, knacks) > matrix.rank)
    issues.push('Assigned spell Circles exceed the matrix Rank.');
  if (assigned.some((spell) => spell.circle > highestCircle))
    issues.push('A spell exceeds the magician’s highest Discipline Circle.');
  if (matrix.damage >= matrix.deathRating)
    issues.push('The matrix is shut down until its damage is recovered.');
  return issues;
}

const matrixDisciplines = new Set([
  'Elementalist',
  'Illusionist',
  'Nethermancer',
  'Shaman',
  'Wizard',
]);

type Talent = Earthdawn4eCharacter['talents'][number];

export const FREE_TALENT_RECONCILIATION_VERSION = 1;
export const freeTalentRegistry = {
  'Air Sailor': { kind: 'talent', name: 'Air Sailing' },
  Boatman: { kind: 'choice', names: ['Pilot Boat', 'Sailing'] },
  Sailor: { kind: 'talent', name: 'Sailing' },
  Troubadour: { kind: 'talent', name: 'Entertainer' },
  Elementalist: { kind: 'matrices', count: 2 },
  Illusionist: { kind: 'matrices', count: 2 },
  Nethermancer: { kind: 'matrices', count: 2 },
  Wizard: { kind: 'matrices', count: 2 },
  Shaman: { kind: 'matrices', count: 2 },
} as const;

export function freeTalentName(
  discipline: Earthdawn4eCharacter['disciplines'][number],
) {
  const grant =
    freeTalentRegistry[discipline.name as keyof typeof freeTalentRegistry];
  if (!grant || grant.kind === 'matrices') return null;
  if (grant.kind === 'talent') return grant.name;
  return discipline.freeTalentChoice === 'sailing'
    ? 'Sailing'
    : discipline.freeTalentChoice === 'pilot-boat'
      ? 'Pilot Boat'
      : null;
}

const freeTalentDefinitionId = (name: string) =>
  `ed4.players-guide.talent.${name
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLocaleLowerCase()}`;

function createFreeTalent(
  discipline: Earthdawn4eCharacter['disciplines'][number],
  name: string,
): Talent {
  const definition = earthdawnTalents.find(
    (candidate) =>
      candidate.name.localeCompare(name, undefined, { sensitivity: 'base' }) ===
      0,
  );
  return {
    id: crypto.randomUUID(),
    definitionId: definition?.id ?? freeTalentDefinitionId(name),
    sourceId: definition?.sourceId ?? discipline.sourceId,
    source: definition?.source ?? discipline.source,
    page: definition?.page ?? discipline.page,
    unresolved: !definition,
    name,
    rank: discipline.circle,
    freeRank: 0,
    automaticRank: discipline.circle,
    freeTalentOriginDisciplineId: discipline.id,
    freeTalentLpCredit: 0,
    freeTalentPurchasedRank: 0,
    attribute: definition?.defaultAttribute ?? 'perception',
    bonus: 0,
    notes: `Free Talent granted by ${discipline.name}.`,
    action: definition?.talentMetadata?.actionText ?? '',
    strain: 0,
    attributeText: definition?.talentMetadata?.attributeText ?? '',
    effectText: definition?.talentMetadata?.effectText ?? '',
    descriptionText: definition?.talentMetadata?.descriptionText ?? '',
    actionText: definition?.talentMetadata?.actionText ?? '',
    strainText: definition?.talentMetadata?.strainText ?? '',
    citationText:
      definition?.talentMetadata?.citationText ?? discipline.source ?? '',
    metadataOverrides: [],
    disciplineSources: discipline.disciplineId ? [discipline.disciplineId] : [],
    optional: false,
    originCircle: 1,
    originDisciplineId: discipline.disciplineId,
    creationOwned: true,
  };
}

function reconcileNonMatrixFreeTalents(character: Earthdawn4eCharacter) {
  if (character.creation.freeTalentReconciliation.pending) return character;
  const eligible = character.disciplines
    .map((discipline) => ({ discipline, name: freeTalentName(discipline) }))
    .filter(
      (
        entry,
      ): entry is {
        discipline: Earthdawn4eCharacter['disciplines'][number];
        name: string;
      } => Boolean(entry.name),
    );
  const owners = new Set(character.disciplines.map(({ id }) => id));
  let talents = character.talents.filter(
    (talent) =>
      !talent.freeTalentOriginDisciplineId ||
      owners.has(talent.freeTalentOriginDisciplineId),
  );
  for (const { discipline, name } of eligible) {
    const index = talents.findIndex(
      (talent) => talent.freeTalentOriginDisciplineId === discipline.id,
    );
    const legacyIndex =
      index >= 0
        ? index
        : talents.findIndex(
            (talent) =>
              !talent.optional &&
              !talent.freeTalentOriginDisciplineId &&
              talent.name.localeCompare(name, undefined, {
                sensitivity: 'base',
              }) === 0,
          );
    const current = legacyIndex >= 0 ? talents[legacyIndex]! : null;
    const purchasedRank = current?.freeTalentPurchasedRank ?? 0;
    const next = current
      ? {
          ...current,
          name,
          rank: Math.max(discipline.circle, purchasedRank),
          freeRank: 0,
          automaticRank: discipline.circle,
          freeTalentOriginDisciplineId: discipline.id,
        }
      : createFreeTalent(discipline, name);
    if (legacyIndex >= 0) talents[legacyIndex] = next;
    else talents = [...talents, next];
  }
  return { ...character, talents };
}

export function reconcileFreeMatrices(character: Earthdawn4eCharacter) {
  const discipline = character.disciplines.find((entry) =>
    matrixDisciplines.has(entry.name),
  );
  if (!discipline)
    return reconcileNonMatrixFreeTalents({
      ...character,
      magic: {
        ...character.magic,
        matrices: character.magic.matrices.filter(
          ({ source }) => !source.startsWith('free:'),
        ),
      },
    });
  const source = `free:${discipline.id}`;
  const eligibleMatrices = character.magic.matrices.filter(
    ({ source: matrixSource }) =>
      !matrixSource.startsWith('free:') || matrixSource === source,
  );
  const existing = eligibleMatrices.filter(
    (matrix) => matrix.source === source,
  );
  const upgradedMatrices = eligibleMatrices.map((matrix) => {
    if (matrix.source !== source) return matrix;
    const freeIndex = existing.findIndex(({ id }) => id === matrix.id);
    const type: EarthdawnMatrix['type'] =
      discipline.circle >= 5 && freeIndex === 0 ? 'enhanced' : 'standard';
    return {
      ...matrix,
      name:
        type === 'enhanced' ? 'Free Enhanced Matrix' : 'Free Standard Matrix',
      type,
      rank: discipline.circle,
      prewovenThreads: type === 'enhanced' ? 1 : 0,
      deathRating: matrixDeathRating(type),
      restriction: discipline.name,
    };
  });
  const additions = Array.from({ length: 2 - existing.length }, (_, index) => {
    const upgraded = discipline.circle >= 5 && existing.length + index === 0;
    const type = upgraded ? ('enhanced' as const) : ('standard' as const);
    return {
      id: crypto.randomUUID(),
      name: upgraded ? 'Free Enhanced Matrix' : 'Free Standard Matrix',
      type,
      source,
      rank: discipline.circle,
      spellId: null,
      spellIds: [],
      prewovenThreads: upgraded ? 1 : 0,
      damage: 0,
      deathRating: matrixDeathRating(type),
      active: true,
      temporaryUntil: '',
      restriction: discipline.name,
      reattuning: { inProgress: false, difficulty: 0, strainPaid: 0 },
      used: false,
      notes: 'Granted by magician Discipline progression.',
      originType: 'free-discipline' as const,
      talentId: null,
      divided: false,
    };
  });
  const matrices = [...upgradedMatrices, ...additions];
  const talents = [...character.talents];
  const usedTalentIds = new Set(
    matrices.map(({ talentId }) => talentId).filter(Boolean),
  );
  const template = talents.find(({ name }) => isMatrixTalent(name));
  const linkedMatrices = matrices.map((matrix) => {
    if (matrix.source !== source) return matrix;
    let talent = matrix.talentId
      ? talents.find(({ id }) => id === matrix.talentId)
      : talents.find(
          (candidate) =>
            isMatrixTalent(candidate.name) &&
            !usedTalentIds.has(candidate.id) &&
            (candidate.freeTalentOriginDisciplineId === discipline.id ||
              candidate.notes ===
                'Granted by magician Discipline progression.'),
        );
    if (!talent && template) {
      talent = {
        ...template,
        id: crypto.randomUUID(),
        name:
          matrix.type === 'enhanced' ? 'Enhanced Matrix' : 'Standard Matrix',
        rank: discipline.circle,
        freeRank: 0,
        automaticRank: discipline.circle,
        freeTalentOriginDisciplineId: discipline.id,
        freeTalentLpCredit: 0,
        freeTalentPurchasedRank: 0,
        notes: 'Granted by magician Discipline progression.',
      };
      talents.push(talent);
    }
    if (!talent) {
      const definition = earthdawnTalents.find(
        ({ name }) => name === 'Standard Matrix' || name === 'Spell Matrix',
      );
      if (definition) {
        talent = {
          id: crypto.randomUUID(),
          definitionId: definition.id,
          sourceId: definition.sourceId,
          source: definition.source,
          page: definition.page,
          unresolved: false,
          name:
            matrix.type === 'enhanced' ? 'Enhanced Matrix' : 'Standard Matrix',
          rank: discipline.circle,
          freeRank: 0,
          automaticRank: discipline.circle,
          freeTalentOriginDisciplineId: discipline.id,
          freeTalentLpCredit: 0,
          freeTalentPurchasedRank: 0,
          attribute: definition.defaultAttribute ?? 'perception',
          bonus: 0,
          notes: 'Granted by magician Discipline progression.',
          action: definition.talentMetadata?.actionText ?? 'NA',
          strain: 0,
          attributeText: definition.talentMetadata?.attributeText ?? 'Rank',
          effectText: definition.talentMetadata?.effectText ?? '',
          descriptionText: definition.talentMetadata?.descriptionText ?? '',
          actionText: definition.talentMetadata?.actionText ?? 'NA',
          strainText: definition.talentMetadata?.strainText ?? '0',
          citationText:
            definition.talentMetadata?.citationText ?? definition.source,
          metadataOverrides: [],
          disciplineSources: discipline.disciplineId
            ? [discipline.disciplineId]
            : [],
          optional: false,
          originCircle: 1,
          originDisciplineId: discipline.disciplineId,
          creationOwned: true,
        };
        talents.push(talent);
      }
    }
    if (!talent) return matrix;
    usedTalentIds.add(talent.id);
    const index = talents.findIndex(({ id }) => id === talent!.id);
    const purchasedRank = talents[index]!.freeTalentPurchasedRank ?? 0;
    const effectiveRank = Math.max(discipline.circle, purchasedRank);
    talents[index] = {
      ...talents[index]!,
      rank: effectiveRank,
      freeRank: 0,
      automaticRank: discipline.circle,
      freeTalentOriginDisciplineId: discipline.id,
    };
    return {
      ...matrix,
      rank: effectiveRank,
      originType: 'free-discipline' as const,
      talentId: talent.id,
      divided: false,
    };
  });
  return reconcileNonMatrixFreeTalents({
    ...character,
    talents,
    magic: {
      ...character.magic,
      matrices: linkedMatrices,
    },
  });
}

type LedgerEntry = Earthdawn4eCharacter['advancement']['ledger'][number];
type ActivityEntry = Earthdawn4eCharacter['activity']['ledger'][number];

export type MoneyDenomination = 'cp' | 'sp' | 'gp';
const denominationCopper: Record<MoneyDenomination, number> = {
  cp: 1,
  sp: 10,
  gp: 100,
};

export function moneyToCopper(amount: number, denomination: MoneyDenomination) {
  return Math.max(0, Math.trunc(amount)) * denominationCopper[denomination];
}

export function walletTotalCopper(wealth: Earthdawn4eCharacter['wealth']) {
  return (
    Math.max(0, Math.trunc(wealth.copper)) +
    Math.max(0, Math.trunc(wealth.silver)) * 10 +
    Math.max(0, Math.trunc(wealth.gold)) * 100
  );
}

export function walletFromCopper(
  totalCopper: number,
  previous: Earthdawn4eCharacter['wealth'],
): Earthdawn4eCharacter['wealth'] {
  const safe = Math.max(0, Math.trunc(totalCopper));
  const gold = Math.floor(safe / 100);
  const afterGold = safe % 100;
  const silver = Math.floor(afterGold / 10);
  return {
    ...previous,
    gold,
    silver,
    copper: afterGold % 10,
  };
}

export function changeWallet(
  wealth: Earthdawn4eCharacter['wealth'],
  copperDelta: number,
) {
  const before = walletTotalCopper(wealth);
  const after = before + Math.trunc(copperDelta);
  return after < 0 ? null : walletFromCopper(after, wealth);
}

export function formatWallet(wealth: Earthdawn4eCharacter['wealth']) {
  return `${Math.trunc(wealth.gold)} gp · ${Math.trunc(wealth.silver)} sp · ${Math.trunc(wealth.copper)} cp`;
}

export function formatWalletAsSilver(wealth: Earthdawn4eCharacter['wealth']) {
  const totalCopper = walletTotalCopper(wealth);
  const silver = Math.floor(totalCopper / 10);
  const copper = totalCopper % 10;
  return `${silver} sp${copper ? ` ${copper} cp` : ''}`;
}

export function createActivityEntry(
  values: Partial<ActivityEntry> & Pick<ActivityEntry, 'type' | 'description'>,
): ActivityEntry {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    copperDelta: 0,
    targetId: null,
    targetName: '',
    quantityDelta: 0,
    locked: false,
    reversesId: null,
    reversedAt: null,
    before: '',
    after: '',
    ...values,
  };
}

const raceGearRules: Record<
  string,
  Pick<
    NonNullable<Earthdawn4eCharacter['raceSnapshot']>,
    'weaponSizeNotes' | 'armorCostMultiplier' | 'armorWeightMultiplier'
  >
> = {
  Dwarf: {
    weaponSizeNotes: 'One-handed Size 1–3; two-handed Size 4–5.',
    armorCostMultiplier: 1,
    armorWeightMultiplier: 1,
  },
  Elf: {
    weaponSizeNotes: 'One-handed Size 1–3; two-handed Size 4–6.',
    armorCostMultiplier: 1,
    armorWeightMultiplier: 1,
  },
  Human: {
    weaponSizeNotes: 'One-handed Size 1–3; two-handed Size 4–6.',
    armorCostMultiplier: 1,
    armorWeightMultiplier: 1,
  },
  Obsidiman: {
    weaponSizeNotes: 'One-handed Size 2–4; two-handed Size 5–7.',
    armorCostMultiplier: 1.25,
    armorWeightMultiplier: 1.25,
  },
  Ork: {
    weaponSizeNotes: 'One-handed Size 1–3; two-handed Size 4–6.',
    armorCostMultiplier: 1,
    armorWeightMultiplier: 1,
  },
  Troll: {
    weaponSizeNotes: 'One-handed Size 2–4; two-handed Size 5–7.',
    armorCostMultiplier: 1.25,
    armorWeightMultiplier: 1.25,
  },
  'T’skrang': {
    weaponSizeNotes:
      'One-handed Size 1–3; two-handed Size 4–6; tail weapons Size 1–2.',
    armorCostMultiplier: 1,
    armorWeightMultiplier: 1,
  },
  Windling: {
    weaponSizeNotes: 'One-handed Size 1; two-handed Size 2.',
    armorCostMultiplier: 0.75,
    armorWeightMultiplier: 0.2,
  },
};

export function reconcileRace(
  character: Earthdawn4eCharacter,
  race: EarthdawnRace,
) {
  const raceSource = `race:${race.id}`;
  const previousRaceSources = new Set(
    earthdawnRaces.map(({ id }) => `race:${id}`),
  );
  const racialTalentNames =
    race.name === 'Human'
      ? ['Versatility']
      : race.name === 'Windling'
        ? ['Astral Sight']
        : [];
  const talents = character.talents
    .filter(
      ({ disciplineSources }) =>
        !disciplineSources.some((source) => previousRaceSources.has(source)),
    )
    .map((talent) => ({
      ...talent,
      disciplineSources: [...talent.disciplineSources],
    }));
  for (const name of racialTalentNames) {
    const existing = talents.find((talent) => talent.name === name);
    if (existing) {
      const index = talents.indexOf(existing);
      talents[index] = {
        ...existing,
        disciplineSources: [
          ...new Set([...existing.disciplineSources, raceSource]),
        ],
      };
      continue;
    }
    const definition = [...earthdawnDefinitionById.values()].find(
      (candidate) => candidate.kind === 'talent' && candidate.name === name,
    );
    talents.push({
      id: crypto.randomUUID(),
      definitionId: definition?.id ?? null,
      sourceId: race.sourceId,
      source: race.source,
      page: race.page,
      unresolved: !definition,
      name,
      rank: 0,
      freeRank: 0,
      attribute: definition?.defaultAttribute ?? 'perception',
      bonus: 0,
      notes: 'Granted by Race.',
      action: definition?.talentMetadata?.actionText ?? '',
      strain: 0,
      attributeText: definition?.talentMetadata?.attributeText ?? '',
      effectText: definition?.talentMetadata?.effectText ?? '',
      descriptionText: definition?.talentMetadata?.descriptionText ?? '',
      actionText: definition?.talentMetadata?.actionText ?? '',
      strainText: definition?.talentMetadata?.strainText ?? '',
      citationText: `${race.source}${race.page ? `, p. ${race.page}` : ''}`,
      metadataOverrides: [],
      disciplineSources: [raceSource],
      optional: false,
      originCircle: null,
      originDisciplineId: null,
      creationOwned: true,
    });
  }
  const abilities = [
    ...character.abilities.filter(
      ({ definitionId }) => !definitionId?.startsWith('race-grant:'),
    ),
    ...race.abilities.map((name) => ({
      id: crypto.randomUUID(),
      definitionId: `race-grant:${race.id}:${name}`,
      sourceId: race.sourceId,
      source: race.source,
      page: race.page,
      unresolved: false,
      name,
      kind: 'racial' as const,
      notes: `Granted by ${race.name}.`,
    })),
  ];
  const modifiers = character.health.modifiers.filter(
    ({ name }) => !name.startsWith('Racial:'),
  );
  if (race.name === 'Obsidiman') {
    modifiers.push(
      {
        id: crypto.randomUUID(),
        name: 'Racial: Natural Armor',
        target: 'physicalArmor',
        value: 3,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'Racial: Increased Wound Threshold',
        target: 'woundThreshold',
        value: 3,
        active: true,
      },
    );
  }
  if (race.name === 'Windling')
    modifiers.push({
      id: crypto.randomUUID(),
      name: 'Racial: Increased Physical Defense',
      target: 'physicalDefense',
      value: 2,
      active: true,
    });
  const gear = raceGearRules[race.name] ?? {
    weaponSizeNotes: '',
    armorCostMultiplier: 1,
    armorWeightMultiplier: 1,
  };
  return {
    ...character,
    identity: { ...character.identity, raceId: race.id, raceName: race.name },
    raceSnapshot: {
      definitionId: race.id,
      name: race.name,
      movement: race.movement,
      karmaModifier: race.karmaModifier,
      abilities: [...race.abilities],
      ...gear,
    },
    attributes: Object.fromEntries(
      Object.entries(character.attributes).map(([id, attribute]) => [
        id,
        {
          ...attribute,
          racial: race.attributes[id as keyof typeof race.attributes],
        },
      ]),
    ) as Earthdawn4eCharacter['attributes'],
    talents,
    abilities,
    health: { ...character.health, modifiers },
  };
}

const talentId = (name: string) =>
  `ed4.players-guide.talent.${name
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLocaleLowerCase()}`;

export function requiredTalents(
  discipline: EarthdawnDiscipline,
  circle: number,
) {
  return discipline.circles
    .filter((entry) => entry.circle <= circle)
    .flatMap((entry) =>
      entry.requiredTalents.map((name) => ({
        name,
        circle: entry.circle,
        source: entry.source,
        page: entry.page,
      })),
    );
}

export function reconcileDisciplineTalents(
  talents: Talent[],
  discipline: EarthdawnDiscipline,
  circle: number,
) {
  const needed = requiredTalents(discipline, circle);
  const neededNames = new Set(needed.map(({ name }) => name));
  const preserved = talents
    .filter(
      (talent) =>
        talent.originDisciplineId !== discipline.id ||
        neededNames.has(talent.name) ||
        !talent.creationOwned ||
        talent.rank > 0 ||
        talent.freeRank > 0 ||
        talent.notes.trim().length > 0,
    )
    .map((talent) => {
      const required = needed.find(({ name }) => name === talent.name);
      if (
        !required ||
        talent.disciplineSources.includes(discipline.id) ||
        (talent.disciplineSources.length === 1 &&
          talent.disciplineSources[0] === 'versatility')
      )
        return talent;
      return {
        ...talent,
        disciplineSources: [...talent.disciplineSources, discipline.id],
        disciplineOriginCircles: {
          ...talent.disciplineOriginCircles,
          [discipline.id]: required.circle,
        },
        optional: false,
        optionOriginDisciplineId: talent.optional
          ? talent.originDisciplineId
          : talent.optionOriginDisciplineId,
      };
    });
  const existing = new Set(
    preserved
      .filter(
        (talent) =>
          !(
            talent.disciplineSources.length === 1 &&
            talent.disciplineSources[0] === 'versatility'
          ),
      )
      .map(({ name }) => name),
  );
  const additions: Talent[] = needed
    .filter(({ name }) => !existing.has(name))
    .map(({ name, circle: originCircle, source, page }) => {
      const fallbackDefinitionId = talentId(name);
      const definition = earthdawnTalents.find(
        (candidate) =>
          candidate.name.localeCompare(name, undefined, {
            sensitivity: 'base',
          }) === 0,
      );
      const definitionId = definition?.id ?? fallbackDefinitionId;
      return {
        id: crypto.randomUUID(),
        definitionId,
        sourceId:
          definition?.sourceId ??
          (originCircle <= 8 ? 'ed4.players-guide' : 'ed4.companion'),
        source: definition?.source ?? source,
        page: definition?.page ?? page,
        unresolved: !definition,
        name,
        rank: 0,
        freeRank: 0,
        attribute: definition?.defaultAttribute ?? 'perception',
        bonus: 0,
        notes: '',
        action: definition?.talentMetadata?.actionText ?? '',
        strain: 0,
        attributeText: definition?.talentMetadata?.attributeText ?? '',
        effectText: definition?.talentMetadata?.effectText ?? '',
        descriptionText: definition?.talentMetadata?.descriptionText ?? '',
        actionText: definition?.talentMetadata?.actionText ?? '',
        strainText: definition?.talentMetadata?.strainText ?? '',
        citationText:
          definition?.talentMetadata?.citationText ?? `${source}, p. ${page}`,
        metadataOverrides: [],
        disciplineSources: [discipline.id],
        disciplineOriginCircles: { [discipline.id]: originCircle },
        optional: false,
        originCircle,
        originDisciplineId: discipline.id,
        creationOwned: true,
      };
    });
  return [...preserved, ...additions];
}

export function previewDisciplineTalentReconciliation(
  talents: Talent[],
  discipline: EarthdawnDiscipline,
  circle: number,
) {
  const next = reconcileDisciplineTalents(talents, discipline, circle);
  const beforeIds = new Set(talents.map(({ id }) => id));
  const afterIds = new Set(next.map(({ id }) => id));
  return {
    next,
    added: next.filter(({ id }) => !beforeIds.has(id)),
    removed: talents.filter(({ id }) => !afterIds.has(id)),
    preserved: talents.filter(({ id }) => afterIds.has(id)),
  };
}

export function questorTier(
  rank: number,
): Earthdawn4eCharacter['questor']['tier'] {
  if (rank < 1) return 'none';
  if (rank <= 4) return 'follower';
  if (rank <= 8) return 'adherent';
  return 'exemplar';
}

export function legendTotals(ledger: readonly LedgerEntry[]) {
  const active = ledger.filter((entry) => !entry.voidedAt);
  return {
    current: active.reduce((total, entry) => total + entry.amount, 0),
    total: active.reduce((total, entry) => total + entry.earnedAmount, 0),
    spent: active.reduce(
      (total, entry) => total + (entry.amount < 0 ? -entry.amount : 0),
      0,
    ),
    corrections: active
      .filter(({ type }) => type === 'adjustment')
      .reduce((total, entry) => total + entry.amount, 0),
  };
}

const talentCosts = {
  novice: [
    0, 100, 200, 300, 500, 800, 1300, 2100, 3400, 5500, 8900, 14400, 23300,
    37700, 61000, 98700,
  ],
  journeyman: [
    0, 200, 300, 500, 800, 1300, 2100, 3400, 5500, 8900, 14400, 23300, 37700,
    61000, 98700, 159700,
  ],
  warden: [
    0, 300, 500, 800, 1300, 2100, 3400, 5500, 8900, 14400, 23300, 37700, 61000,
    98700, 159700, 258400,
  ],
  master: [
    0, 500, 800, 1300, 2100, 3400, 5500, 8900, 14400, 23300, 37700, 61000,
    98700, 159700, 258400, 418100,
  ],
} as const;

export type TalentTier = keyof typeof talentCosts;

export function talentTierRankCost(newRank: number, tier: TalentTier) {
  return talentCosts[tier][Math.min(15, Math.max(1, newRank))]!;
}

export function tierForCircle(circle: number): TalentTier {
  if (circle <= 4) return 'novice';
  if (circle <= 8) return 'journeyman';
  if (circle <= 12) return 'warden';
  return 'master';
}

export function talentRankCost(newRank: number, circle: number) {
  return talentCosts[tierForCircle(circle)][
    Math.min(15, Math.max(1, newRank))
  ]!;
}

export function freeTalentAdvanceQuote(talent: Talent) {
  const targetRank = Math.max(
    (talent.automaticRank ?? 0) + 1,
    (talent.freeTalentPurchasedRank ?? 0) + 1,
  );
  const fullCost = talentTierRankCost(targetRank, 'novice');
  return {
    targetRank,
    fullCost,
    credit: talent.freeTalentLpCredit ?? 0,
    cost: Math.max(0, fullCost - (talent.freeTalentLpCredit ?? 0)),
  };
}

export function equivalentTalentCircle(
  disciplineCircle: number,
  disciplineIndex: number,
  versatility = false,
) {
  const baseTier =
    disciplineCircle <= 4
      ? 0
      : disciplineCircle <= 8
        ? 1
        : disciplineCircle <= 12
          ? 2
          : 3;
  const shift = versatility ? 1 : Math.max(0, disciplineIndex);
  return [1, 5, 9, 13][Math.min(3, baseTier + shift)]!;
}

export function talentAdvancementCostCircle(
  character: Earthdawn4eCharacter,
  talent: Talent,
) {
  const candidates = character.disciplines.flatMap((record, index) => {
    if (
      !record.disciplineId ||
      !talent.disciplineSources.includes(record.disciplineId)
    )
      return [];
    const definition = earthdawnDisciplines.find(
      ({ id }) => id === record.disciplineId,
    );
    const originCircle =
      talent.disciplineOriginCircles?.[record.disciplineId] ??
      definition?.circles.find((circle) =>
        circle.requiredTalents.includes(talent.name),
      )?.circle ??
      talent.originCircle ??
      1;
    return [equivalentTalentCircle(originCircle, index)];
  });
  if (talent.disciplineSources.includes('versatility'))
    candidates.push(equivalentTalentCircle(talent.originCircle ?? 1, 0, true));
  return candidates.length
    ? Math.min(...candidates)
    : equivalentTalentCircle(talent.originCircle ?? 1, 0);
}

export function reconcileVersatilityTalentSlots(
  character: Earthdawn4eCharacter,
) {
  return {
    ...character,
    talents: character.talents.map((talent) => {
      if (!talent.disciplineSources.includes('versatility')) return talent;
      const disciplineTalent = character.talents.find(
        (candidate) =>
          candidate.id !== talent.id &&
          candidate.name === talent.name &&
          candidate.disciplineSources.some(
            (source) => source !== 'versatility',
          ),
      );
      return {
        ...talent,
        versatilitySlotReleased: Boolean(
          disciplineTalent && disciplineTalent.rank >= talent.rank,
        ),
      };
    }),
  };
}

export type DisciplineModifierTarget =
  | 'physicalDefense'
  | 'mysticDefense'
  | 'socialDefense'
  | 'mysticArmor'
  | 'initiative'
  | 'recovery';

const disciplineBonusPatterns: Array<[RegExp, DisciplineModifierTarget]> = [
  [/Physical Defense/i, 'physicalDefense'],
  [/Mystic Defense/i, 'mysticDefense'],
  [/Social Defense/i, 'socialDefense'],
  [/Mystic Armor/i, 'mysticArmor'],
  [/Initiative/i, 'initiative'],
  [/Recovery Test/i, 'recovery'],
];

export function disciplineProgressionEffects(character: Earthdawn4eCharacter) {
  const modifiers: Record<DisciplineModifierTarget, number> = {
    physicalDefense: 0,
    mysticDefense: 0,
    socialDefense: 0,
    mysticArmor: 0,
    initiative: 0,
    recovery: 0,
  };
  const highestCircle = Math.max(
    0,
    ...character.disciplines.map(({ circle }) => circle),
  );
  let durability = 0;
  for (let circle = 1; circle <= highestCircle; circle += 1) {
    durability += Math.max(
      0,
      ...character.disciplines.flatMap((record) => {
        if (record.circle < circle) return [];
        const definition = earthdawnDisciplines.find(
          ({ id }) => id === record.disciplineId,
        );
        return definition ? [definition.durability] : [];
      }),
    );
  }
  const karmaPermissions = new Set<string>();
  for (const record of character.disciplines) {
    const definition = earthdawnDisciplines.find(
      ({ id }) => id === record.disciplineId,
    );
    if (!definition) continue;
    for (const circle of definition.circles.filter(
      ({ circle }) => circle <= record.circle,
    )) {
      for (const bonus of circle.bonuses) {
        const amount = Number.parseInt(bonus.match(/[+-]?\d+/)?.[0] ?? '0', 10);
        const target = disciplineBonusPatterns.find(([pattern]) =>
          pattern.test(bonus),
        )?.[1];
        if (target) modifiers[target] = Math.max(modifiers[target], amount);
      }
      const permission = circle.ability.match(
        /Karma on ([^.]+?)(?: tests?|\.|$)/i,
      )?.[1];
      if (permission) karmaPermissions.add(permission.trim());
    }
  }
  return { durability, modifiers, karmaPermissions: [...karmaPermissions] };
}

export function equivalentDisciplineNames(name: string) {
  return name === 'Boatman' || name === 'Air Sailor' || name === 'Sailor'
    ? (['Boatman', 'Air Sailor', 'Sailor'] as const)
    : ([name] as const);
}

const noviceSkillCosts = [
  0, 200, 300, 500, 800, 1300, 2100, 3400, 5500, 8900, 14400,
];
const journeymanSkillCosts = [
  0, 300, 500, 800, 1300, 2100, 3400, 5500, 8900, 14400, 23300,
];

export function skillRankCost(newRank: number, journeyman = false) {
  const table = journeyman ? journeymanSkillCosts : noviceSkillCosts;
  return table[Math.min(10, Math.max(1, newRank))]!;
}

const attributeIncreaseCosts = [0, 800, 1300, 2100] as const;

export function attributeIncreaseCost(newIncrease: number) {
  if (!Number.isInteger(newIncrease) || newIncrease < 1 || newIncrease > 3)
    return null;
  return attributeIncreaseCosts[newIncrease];
}

export function attributeTraining(currentStep: number) {
  const step = Math.max(1, Math.trunc(currentStep));
  return {
    days: step,
    silverCost: step * step * 10,
    waitWeeks: step + 1,
  };
}

export function spellLearningCost(circle: number) {
  return talentRankCost(circle, 1);
}

export function knackLearningQuote(minimumRank: number) {
  const rank = Math.max(1, Math.trunc(minimumRank));
  return {
    legendCost: talentRankCost(rank, 1),
    trainingDays: rank,
    silverCost: rank * 50,
  };
}

export function threadRankCost(newRank: number, groupTruePattern = false) {
  return talentRankCost(newRank, groupTruePattern ? 9 : 1);
}

const circleTrainingCosts = [
  0, 0, 200, 300, 500, 800, 1000, 1500, 2000, 2500, 3500, 5000, 7500, 10000,
  15000, 20000,
] as const;

export function disciplineCircleTraining(newCircle: number) {
  if (!Number.isInteger(newCircle) || newCircle < 2 || newCircle > 15)
    return null;
  return {
    hours: 40,
    periodWeeks: 3,
    silverCost: circleTrainingCosts[newCircle],
  };
}

export function missingCircleTalentRanks(
  character: Earthdawn4eCharacter,
  discipline: EarthdawnDiscipline,
  newCircle: number,
) {
  return requiredTalents(discipline, newCircle - 1).flatMap((required) => {
    const talent = character.talents.find(
      ({ name, disciplineSources }) =>
        name === required.name &&
        (disciplineSources.includes(discipline.id) ||
          discipline.id === character.disciplines[0]?.disciplineId),
    );
    return !talent || talent.rank < newCircle
      ? [
          {
            name: required.name,
            currentRank: talent?.rank ?? 0,
            requiredRank: newCircle,
          },
        ]
      : [];
  });
}

const newDisciplineTalentCosts = {
  second: [0, 1300, 800, 500, 300, 200],
  third: [0, 2100, 1300, 800, 500, 300],
  later: [0, 3400, 2100, 1300, 800, 500],
} as const;

export function newDisciplineTalentCost(
  lowestCircle: number,
  resultingDisciplineCount: number,
) {
  const row =
    resultingDisciplineCount <= 2
      ? newDisciplineTalentCosts.second
      : resultingDisciplineCount === 3
        ? newDisciplineTalentCosts.third
        : newDisciplineTalentCosts.later;
  return row[Math.min(5, Math.max(1, Math.trunc(lowestCircle)))]!;
}

export function quoteNewDisciplineInitiation(
  character: Earthdawn4eCharacter,
  discipline: EarthdawnDiscipline,
) {
  const requiredTalents = discipline.circles[0]?.requiredTalents ?? [];
  const knownOutsideVersatility = new Set(
    character.talents
      .filter(
        ({ rank, disciplineSources }) =>
          rank >= 1 &&
          !(
            disciplineSources.length === 1 &&
            disciplineSources[0] === 'versatility'
          ),
      )
      .map(({ name }) => name),
  );
  const missingTalents = requiredTalents.filter(
    (name) => !knownOutsideVersatility.has(name),
  );
  const lowestCircle = character.disciplines.length
    ? Math.min(...character.disciplines.map(({ circle }) => circle))
    : 1;
  const perTalentCost = newDisciplineTalentCost(
    lowestCircle,
    character.disciplines.length + 1,
  );
  return {
    requiredTalents,
    missingTalents,
    optionConversions: character.talents
      .filter(
        ({ name, optional, rank }) =>
          optional && rank >= 1 && requiredTalents.includes(name),
      )
      .map(({ name }) => name),
    versatilityRestarts: character.talents
      .filter(
        ({ name, disciplineSources }) =>
          requiredTalents.includes(name) &&
          disciplineSources.length === 1 &&
          disciplineSources[0] === 'versatility',
      )
      .map(({ name }) => name),
    lowestCircle,
    perTalentCost,
    totalCost: perTalentCost * missingTalents.length,
  };
}

export function applyNewDisciplineInitiation(
  character: Earthdawn4eCharacter,
  discipline: EarthdawnDiscipline,
  recordId: string,
  freeTalentChoice: 'pilot-boat' | 'sailing' | null = null,
) {
  if (
    character.disciplines.some(
      ({ disciplineId }) => disciplineId === discipline.id,
    )
  )
    return character;
  const quote = quoteNewDisciplineInitiation(character, discipline);
  if (legendTotals(character.advancement.ledger).current < quote.totalCost)
    return character;
  const talents = reconcileDisciplineTalents(
    character.talents,
    discipline,
    1,
  ).map((talent) =>
    quote.missingTalents.includes(talent.name) &&
    talent.disciplineSources.includes(discipline.id)
      ? { ...talent, rank: 1, creationOwned: false }
      : talent,
  );
  return reconcileVersatilityTalentSlots({
    ...character,
    disciplines: [
      ...character.disciplines,
      {
        id: recordId,
        definitionId: discipline.id,
        sourceId: discipline.sourceId,
        sourceIds: discipline.sourceIds ?? [discipline.sourceId],
        source: discipline.source,
        page: discipline.page,
        pageEnd: discipline.pageEnd ?? discipline.page,
        unresolved: false,
        disciplineId: discipline.id,
        name: discipline.name,
        circle: 1,
        startedAtCircle: 1,
        questor: false,
        custom: false,
        freeTalentChoice,
      },
    ],
    talents,
    advancement: {
      ledger: [
        ...character.advancement.ledger,
        createLegendEntry({
          type: 'discipline',
          amount: -quote.totalCost,
          targetId: recordId,
          definitionId: discipline.id,
          origin: 'discipline',
          originDisciplineId: recordId,
          costCircle: 1,
          targetName: discipline.name,
          beforeRating: 0,
          afterRating: 1,
          sourceCitation: "Player's Guide pp. 456–459",
          training: `40 hours with a Fifth-Circle instructor; ${quote.missingTalents.length} missing talent(s)`,
          description: `Begin ${discipline.name} at First Circle`,
        }),
      ],
    },
  });
}

export function questorRankCost(newRank: number) {
  return talentRankCost(newRank, 5);
}

export function pathRankCost(path: EarthdawnPathProfile, newRank: number) {
  return talentTierRankCost(newRank, path.talentCostTier);
}

export function pathEligibility(
  character: Earthdawn4eCharacter,
  path: EarthdawnPathProfile,
  desiredRank = 1,
) {
  const blockers: string[] = [];
  const acknowledgements: string[] = [];
  const circle = Math.max(
    0,
    ...character.disciplines.map(({ circle }) => circle),
  );
  if (circle < path.minimumCircle)
    blockers.push(
      `Requires an adept Discipline at Circle ${path.minimumCircle}.`,
    );
  if (path.race && character.identity.raceName !== path.race)
    blockers.push(`Requires ${path.race}.`);
  if (
    path.questorProhibited &&
    (character.questorPaths.length > 0 || character.questor.rank > 0)
  )
    blockers.push('Questors cannot initiate or advance on this Path.');
  for (const requirement of path.requirements) {
    if (requirement.kind === 'manual') {
      acknowledgements.push(requirement.description);
      continue;
    }
    if (requirement.kind === 'knowledge-skill') {
      if (
        !character.skills.some(
          ({ category, rank }) =>
            category === 'knowledge' && rank >= requirement.rank,
        )
      )
        blockers.push(
          `Requires a Knowledge Skill at Rank ${requirement.rank}.`,
        );
      continue;
    }
    const records =
      requirement.kind === 'talent' ? character.talents : character.skills;
    if (
      !records.some(
        ({ name, rank }) =>
          name.localeCompare(requirement.name, undefined, {
            sensitivity: 'base',
          }) === 0 && rank >= requirement.rank,
      )
    )
      blockers.push(`Requires ${requirement.name} Rank ${requirement.rank}.`);
  }
  if (path.id === 'journeyman') {
    const versatility =
      character.talents.find(({ name }) => name === 'Versatility')?.rank ?? 0;
    if (versatility < desiredRank + 5)
      blockers.push(
        `Journeyman Rank ${desiredRank} requires Versatility Rank ${desiredRank + 5}.`,
      );
  }
  for (const existing of character.mysticPaths) {
    const other = earthdawnPathById.get(existing.definitionId);
    if (
      path.incompatiblePathIds.includes(existing.definitionId) ||
      other?.incompatiblePathIds.includes(path.id)
    )
      blockers.push(`${path.name} is incompatible with ${existing.name}.`);
  }
  acknowledgements.push(...path.restrictions, path.ordeal);
  return {
    blockers: [...new Set(blockers)],
    acknowledgements: [...new Set(acknowledgements)],
  };
}

export function mysticPathModifierValue(
  character: Earthdawn4eCharacter,
  target: PathBonusTarget,
) {
  return character.mysticPaths
    .filter(({ active }) => active)
    .reduce((sum, record) => {
      const profile = earthdawnPathById.get(record.definitionId);
      return (
        sum + (profile ? pathRankModifier(profile, record.rank, target) : 0)
      );
    }, 0);
}

export function grantedDevotionCost(newRank: number, questorRank: number) {
  return talentRankCost(
    newRank,
    questorRank <= 4 ? 1 : questorRank <= 8 ? 5 : 9,
  );
}

export function refundableLedgerEntry(
  ledger: readonly LedgerEntry[],
  entryId: string,
) {
  const index = ledger.findIndex(({ id }) => id === entryId);
  if (index < 0) return false;
  const entry = ledger[index]!;
  if (entry.amount >= 0 || entry.type === 'refund' || !entry.targetId)
    return false;
  if (ledger.some(({ reversesId }) => reversesId === entry.id)) return false;
  if (
    ledger
      .slice(index + 1)
      .some(({ dependsOnEntryIds }) => dependsOnEntryIds.includes(entry.id))
  )
    return false;
  return !ledger
    .slice(index + 1)
    .some(
      ({ targetId, type }) => targetId === entry.targetId && type !== 'refund',
    );
}

export function refundBlockReason(
  ledger: readonly LedgerEntry[],
  entryId: string,
) {
  const index = ledger.findIndex(({ id }) => id === entryId);
  if (index < 0) return 'The original transaction is unavailable.';
  const entry = ledger[index]!;
  if (entry.amount >= 0 || entry.type === 'refund' || !entry.targetId)
    return 'This transaction is not a refundable purchase.';
  if (ledger.some(({ reversesId }) => reversesId === entry.id))
    return 'This transaction has already been refunded.';
  const dependent = ledger
    .slice(index + 1)
    .find(({ dependsOnEntryIds }) => dependsOnEntryIds.includes(entry.id));
  if (dependent)
    return `${dependent.targetName || dependent.description} depends on this purchase.`;
  const later = ledger
    .slice(index + 1)
    .find(
      ({ targetId, type }) => targetId === entry.targetId && type !== 'refund',
    );
  return later
    ? `${later.targetName || later.description} has a later advancement.`
    : null;
}

export function advancementTargetExists(
  character: Earthdawn4eCharacter,
  entry: LedgerEntry,
) {
  if (!entry.targetId) return false;
  if (entry.type === 'talent')
    return character.talents.some(({ id }) => id === entry.targetId);
  if (entry.type === 'skill')
    return character.skills.some(({ id }) => id === entry.targetId);
  if (entry.type === 'spell')
    return character.magic.spells.some(({ id }) => id === entry.targetId);
  if (entry.type === 'knack')
    return character.knacks.some(({ id }) => id === entry.targetId);
  if (entry.type === 'thread')
    return character.magic.effects.some(({ id }) => id === entry.targetId);
  if (entry.type === 'discipline' || entry.type === 'circle')
    return character.disciplines.some(({ id }) => id === entry.targetId);
  if (entry.type === 'path')
    return character.mysticPaths.some(({ id }) => id === entry.targetId);
  if (entry.type === 'attribute')
    return entry.targetId.startsWith('attribute:');
  if (entry.type === 'questor') return true;
  return false;
}

export function appendRoll(
  dice: Earthdawn4eCharacter['dice'],
  result: NonNullable<Earthdawn4eCharacter['dice']['lastRoll']>,
) {
  if (!dice.tracking) return { ...dice, lastRoll: result };
  const history = [result, ...dice.history];
  return {
    ...dice,
    lastRoll: result,
    history:
      dice.historyLimit === null
        ? history
        : history.slice(0, dice.historyLimit),
  };
}

export function createLegendEntry(
  values: Pick<
    LedgerEntry,
    'type' | 'amount' | 'targetId' | 'targetName' | 'description'
  > &
    Partial<Omit<LedgerEntry, 'id' | 'date' | 'createdAt'>>,
): LedgerEntry {
  const createdAt = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    date: createdAt.slice(0, 10),
    earnedAmount: values.amount > 0 ? values.amount : 0,
    beforeRating: null,
    afterRating: null,
    silverCost: 0,
    training: '',
    sourceCitation: '',
    reversesId: null,
    definitionId: null,
    variantKey: null,
    formKey: null,
    origin: null,
    originDisciplineId: null,
    costCircle: null,
    dependsOnEntryIds: [],
    manual: false,
    voidedAt: null,
    voidReason: '',
    ...values,
    createdAt,
  };
}

export type FreeTalentReconciliationPreview = {
  grants: string[];
  rankChanges: string[];
  restoredTalentPoints: number;
  refundableEntryIds: string[];
  refundableLegendPoints: number;
  ambiguousTalentIds: string[];
  needsBoatmanChoice: boolean;
};

export function previewFreeTalentReconciliation(
  character: Earthdawn4eCharacter,
): FreeTalentReconciliationPreview {
  const grants: string[] = [];
  const rankChanges: string[] = [];
  const refundableEntryIds: string[] = [];
  const ambiguousTalentIds: string[] = [];
  let restoredTalentPoints = 0;
  let refundableLegendPoints = 0;
  const reversed = new Set(
    character.advancement.ledger
      .map(({ reversesId }) => reversesId)
      .filter((id): id is string => Boolean(id)),
  );
  for (const discipline of character.disciplines) {
    const name = freeTalentName(discipline);
    if (!name) continue;
    const talent = character.talents.find(
      (candidate) =>
        candidate.freeTalentOriginDisciplineId === discipline.id ||
        candidate.name.localeCompare(name, undefined, {
          sensitivity: 'base',
        }) === 0,
    );
    if (!talent) {
      grants.push(`${name} at Rank ${discipline.circle}`);
      continue;
    }
    if (talent.rank !== discipline.circle || talent.freeRank > 0)
      rankChanges.push(
        `${name}: Rank ${talent.rank + talent.freeRank} → automatic Rank ${discipline.circle}`,
      );
    restoredTalentPoints +=
      talent.freeRank + (character.creation.talentPoints[talent.id] ?? 0);
    const entries = character.advancement.ledger.filter(
      (entry) =>
        entry.type === 'talent' &&
        entry.targetId === talent.id &&
        entry.amount < 0 &&
        !entry.voidedAt &&
        !reversed.has(entry.id),
    );
    for (const entry of entries) {
      if (
        (entry.afterRating ?? Number.POSITIVE_INFINITY) <= discipline.circle
      ) {
        refundableEntryIds.push(entry.id);
        refundableLegendPoints += -entry.amount;
      } else if (!ambiguousTalentIds.includes(talent.id)) {
        ambiguousTalentIds.push(talent.id);
      }
    }
    if (
      talent.rank > discipline.circle &&
      entries.every((entry) => entry.afterRating == null)
    )
      ambiguousTalentIds.push(talent.id);
  }
  const freeMatrixCount = character.magic.matrices.filter(({ source }) =>
    source.startsWith('free:'),
  ).length;
  if (
    character.disciplines.some(({ name }) => matrixDisciplines.has(name)) &&
    freeMatrixCount < 2
  )
    grants.push(`${2 - freeMatrixCount} free Standard Matrix talent(s)`);
  for (const matrix of character.magic.matrices.filter(({ source }) =>
    source.startsWith('free:'),
  )) {
    const discipline = character.disciplines.find(
      ({ id }) => matrix.source === `free:${id}`,
    );
    const talent = matrix.talentId
      ? character.talents.find(({ id }) => id === matrix.talentId)
      : null;
    if (!discipline || !talent) continue;
    if (talent.rank !== discipline.circle || talent.freeRank > 0)
      rankChanges.push(
        `${talent.name}: Rank ${talent.rank + talent.freeRank} → automatic Rank ${discipline.circle}`,
      );
    restoredTalentPoints +=
      talent.freeRank + (character.creation.talentPoints[talent.id] ?? 0);
    const entries = character.advancement.ledger.filter(
      (entry) =>
        entry.type === 'talent' &&
        entry.targetId === talent.id &&
        entry.amount < 0 &&
        !entry.voidedAt &&
        !reversed.has(entry.id),
    );
    for (const entry of entries) {
      if (
        (entry.afterRating ?? Number.POSITIVE_INFINITY) <= discipline.circle &&
        !refundableEntryIds.includes(entry.id)
      ) {
        refundableEntryIds.push(entry.id);
        refundableLegendPoints += -entry.amount;
      } else if (
        (entry.afterRating ?? Number.POSITIVE_INFINITY) > discipline.circle &&
        !ambiguousTalentIds.includes(talent.id)
      ) {
        ambiguousTalentIds.push(talent.id);
      }
    }
  }
  return {
    grants,
    rankChanges,
    restoredTalentPoints,
    refundableEntryIds,
    refundableLegendPoints,
    ambiguousTalentIds: [...new Set(ambiguousTalentIds)],
    needsBoatmanChoice: character.disciplines.some(
      ({ name, freeTalentChoice }) => name === 'Boatman' && !freeTalentChoice,
    ),
  };
}

export function applyFreeTalentReconciliation(
  character: Earthdawn4eCharacter,
): Earthdawn4eCharacter {
  const preview = previewFreeTalentReconciliation(character);
  const managedFreeTalentIds = new Set([
    ...character.magic.matrices
      .filter(({ source, talentId }) => source.startsWith('free:') && talentId)
      .map(({ talentId }) => talentId!),
    ...character.talents
      .filter((talent) =>
        character.disciplines.some(
          (discipline) => freeTalentName(discipline) === talent.name,
        ),
      )
      .map(({ id }) => id),
  ]);
  const refundEntries = character.advancement.ledger
    .filter(({ id }) => preview.refundableEntryIds.includes(id))
    .map((entry) =>
      createLegendEntry({
        type: 'refund',
        amount: -entry.amount,
        earnedAmount: 0,
        targetId: entry.targetId,
        targetName: entry.targetName,
        beforeRating: entry.afterRating,
        afterRating: entry.beforeRating,
        reversesId: entry.id,
        definitionId: entry.definitionId,
        origin: entry.origin,
        originDisciplineId: entry.originDisciplineId,
        description: `Free Talent reconciliation refund for ${entry.targetName}.`,
      }),
    );
  const reconciled = reconcileFreeMatrices({
    ...character,
    talents: character.talents.map((talent) => {
      if (!preview.ambiguousTalentIds.includes(talent.id))
        return { ...talent, freeRank: 0 };
      const owner = character.disciplines.find(
        (discipline) =>
          freeTalentName(discipline) === talent.name ||
          character.magic.matrices.some(
            (matrix) =>
              matrix.talentId === talent.id &&
              matrix.source === `free:${discipline.id}`,
          ),
      );
      return owner
        ? {
            ...talent,
            freeRank: 0,
            automaticRank: owner.circle,
            freeTalentOriginDisciplineId: owner.id,
            freeTalentPurchasedRank: Math.max(talent.rank, owner.circle),
            freeTalentLpCredit: 0,
          }
        : talent;
    }),
    creation: {
      ...character.creation,
      talentPoints: Object.fromEntries(
        Object.entries(character.creation.talentPoints).map(([id, value]) => [
          id,
          managedFreeTalentIds.has(id) ? 0 : value,
        ]),
      ),
      freeTalentReconciliation: {
        version: FREE_TALENT_RECONCILIATION_VERSION,
        pending: false,
        reviewedAt: new Date().toISOString(),
        ambiguousTalentIds: preview.ambiguousTalentIds,
      },
    },
    advancement: {
      ledger: [...character.advancement.ledger, ...refundEntries],
    },
  });
  return reconciled;
}
