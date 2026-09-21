import type { EarthdawnDiscipline } from './catalog';
import type { Earthdawn4eCharacter } from './schema';

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
  const preserved = talents.filter(
    (talent) =>
      talent.originDisciplineId !== discipline.id ||
      neededNames.has(talent.name) ||
      !talent.creationOwned ||
      talent.rank > 0 ||
      talent.freeRank > 0 ||
      talent.notes.trim().length > 0,
  );
  const existing = new Set(preserved.map(({ name }) => name));
  const additions: Talent[] = needed
    .filter(({ name }) => !existing.has(name))
    .map(({ name, circle: originCircle, source, page }) => ({
      id: crypto.randomUUID(),
      definitionId: talentId(name),
      sourceId: originCircle <= 8 ? 'ed4.players-guide' : 'ed4.companion',
      source,
      page,
      unresolved: false,
      name,
      rank: 0,
      freeRank: 0,
      attribute: 'dexterity',
      bonus: 0,
      notes: '',
      action: '',
      strain: 0,
      disciplineSources: [discipline.id],
      optional: false,
      originCircle,
      originDisciplineId: discipline.id,
      creationOwned: true,
    }));
  return [...preserved, ...additions];
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
