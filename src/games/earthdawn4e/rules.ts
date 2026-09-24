import { earthdawnDefinitionById, type EarthdawnDiscipline } from './catalog';
import type { Earthdawn4eCharacter } from './schema';

export type EarthdawnMatrix = Earthdawn4eCharacter['magic']['matrices'][number];

export function matrixDeathRating(type: EarthdawnMatrix['type']) {
  if (type === 'armored') return 25;
  if (type === 'shared') return 20;
  if (type === 'enhanced') return 15;
  return 10;
}

export function matrixCapacityUsed(
  matrix: EarthdawnMatrix,
  spells: Earthdawn4eCharacter['magic']['spells'],
) {
  const assigned = spells.filter((spell) => matrix.spellIds.includes(spell.id));
  return matrix.type === 'shared'
    ? assigned.reduce((sum, spell) => sum + spell.circle, 0)
    : assigned.length
      ? Math.max(...assigned.map((spell) => spell.circle))
      : 0;
}

export function matrixIssues(
  matrix: EarthdawnMatrix,
  spells: Earthdawn4eCharacter['magic']['spells'],
  highestCircle: number,
) {
  const assigned = spells.filter((spell) => matrix.spellIds.includes(spell.id));
  const issues: string[] = [];
  if (matrix.type !== 'shared' && assigned.length > 1)
    issues.push('This matrix normally holds one spell.');
  if (matrixCapacityUsed(matrix, spells) > matrix.rank)
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

export function reconcileFreeMatrices(character: Earthdawn4eCharacter) {
  const discipline = character.disciplines.find((entry) =>
    matrixDisciplines.has(entry.name),
  );
  if (!discipline) return character;
  const source = `free:${discipline.id}`;
  const existing = character.magic.matrices.filter(
    (matrix) => matrix.source === source,
  );
  const upgradedMatrices = character.magic.matrices.map((matrix) => {
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
    };
  });
  return {
    ...character,
    magic: {
      ...character.magic,
      matrices: [...upgradedMatrices, ...additions],
    },
  };
}

type Talent = Earthdawn4eCharacter['talents'][number];
type LedgerEntry = Earthdawn4eCharacter['advancement']['ledger'][number];

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
    .map((talent) =>
      neededNames.has(talent.name) &&
      !talent.disciplineSources.includes(discipline.id)
        ? {
            ...talent,
            disciplineSources: [...talent.disciplineSources, discipline.id],
          }
        : talent,
    );
  const existing = new Set(preserved.map(({ name }) => name));
  const additions: Talent[] = needed
    .filter(({ name }) => !existing.has(name))
    .map(({ name, circle: originCircle, source, page }) => {
      const definitionId = talentId(name);
      const definition = earthdawnDefinitionById.get(definitionId);
      return {
        id: crypto.randomUUID(),
        definitionId,
        sourceId: originCircle <= 8 ? 'ed4.players-guide' : 'ed4.companion',
        source,
        page,
        unresolved: false,
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
        actionText: definition?.talentMetadata?.actionText ?? '',
        strainText: definition?.talentMetadata?.strainText ?? '',
        citationText:
          definition?.talentMetadata?.citationText ?? `${source}, p. ${page}`,
        metadataOverrides: [],
        disciplineSources: [discipline.id],
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
  return {
    current: ledger.reduce((total, entry) => total + entry.amount, 0),
    total: ledger.reduce((total, entry) => total + entry.earnedAmount, 0),
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

export function questorRankCost(newRank: number) {
  return talentRankCost(newRank, 5);
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
  return !ledger
    .slice(index + 1)
    .some(
      ({ targetId, type }) => targetId === entry.targetId && type !== 'refund',
    );
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
    ...values,
    createdAt,
  };
}
