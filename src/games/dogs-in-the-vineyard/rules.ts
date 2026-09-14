import { backgrounds } from './catalog';
import type { DicePool, DitvCharacter, DitvConflict, DitvNpc } from './schema';

export const emptyDice = (): DicePool => ({ d4: 0, d6: 0, d8: 0, d10: 0 });
export const newConflict = (title = 'New conflict'): DitvConflict => ({
  id: crypto.randomUUID(),
  title,
  stakes: '',
  stage: '',
  status: 'setup',
  openingArena: 'talking',
  activeArena: 'talking',
  participants: [],
  activeParticipantId: null,
  dice: [],
  events: [],
  resolution: '',
  followUpDie: null,
  createdAt: new Date().toISOString(),
  resolvedAt: null,
});
export const addDice = (a: DicePool, b: DicePool): DicePool => ({
  d4: a.d4 + b.d4,
  d6: a.d6 + b.d6,
  d8: a.d8 + b.d8,
  d10: a.d10 + b.d10,
});
export const subtractDice = (a: DicePool, b: DicePool): DicePool => ({
  d4: a.d4 - b.d4,
  d6: a.d6 - b.d6,
  d8: a.d8 - b.d8,
  d10: a.d10 - b.d10,
});
export const sumRatedDice = (records: { dice: DicePool }[]) =>
  records.reduce((sum, x) => addDice(sum, x.dice), emptyDice());
export const diceEqual = (a: DicePool, b: DicePool) =>
  a.d4 === b.d4 && a.d6 === b.d6 && a.d8 === b.d8 && a.d10 === b.d10;
export const singleSize = (pool: DicePool) =>
  [pool.d4, pool.d6, pool.d8, pool.d10].filter((x) => x > 0).length <= 1;
export const formatDice = (p: DicePool) =>
  (['d4', 'd6', 'd8', 'd10'] as const)
    .filter((key) => p[key])
    .map((key) => `${p[key]}${key}`)
    .join(' ') || '—';
export const rollPool = (pool: DicePool, random = Math.random) =>
  (['d4', 'd6', 'd8', 'd10'] as const).flatMap((key) => {
    const size = Number(key.slice(1)) as 4 | 6 | 8 | 10;
    return Array.from({ length: pool[key] }, () => ({
      size,
      value: Math.floor(random() * size) + 1,
    }));
  });

export function creationIssues(c: DitvCharacter) {
  if (c.creation.status === 'manual') return [];
  const issues: string[] = [];
  const background = backgrounds.find((x) => x.id === c.creation.backgroundId);
  if (!c.name.trim()) issues.push('Record the Dog’s name.');
  if (!background) issues.push('Choose one published Background package.');
  if (background) {
    if (Object.values(c.stats).some((x) => x < 2))
      issues.push('Every Stat must have at least 2d6.');
    if (Object.values(c.stats).reduce((a, b) => a + b, 0) !== background.statD6)
      issues.push(`Allocate exactly ${background.statD6} Stat dice.`);
    const traitDice = sumRatedDice(
      c.traits.filter((x) => x.origin === 'creation'),
    );
    if (!diceEqual(traitDice, background.traits))
      issues.push(`Trait dice must total ${formatDice(background.traits)}.`);
    const relationshipDice = addDice(
      sumRatedDice(
        c.relationships.filter(
          (x) => x.origin === 'creation' && x.kind !== 'blood',
        ),
      ),
      c.availableRelationshipDice,
    );
    if (!diceEqual(relationshipDice, background.relationships))
      issues.push(
        `Assigned and available Relationship dice must total ${formatDice(background.relationships)}.`,
      );
  }
  if (c.traits.some((x) => !singleSize(x.dice)))
    issues.push('Each Trait must use only one die size.');
  if (c.relationships.some((x) => !singleSize(x.dice)))
    issues.push('Each Relationship must use only one die size.');
  if (
    !c.traits.some((x) => /\b(dog|watchdog|order set apart)\b/i.test(x.name)) &&
    !c.relationships.some(
      (x) => x.kind === 'institution' && /\bdogs?\b/i.test(x.name),
    )
  )
    issues.push('Record either a Dog Trait or a Relationship with the Dogs.');
  if (!c.belongings.some((x) => x.kind === 'coat'))
    issues.push('Record the Dog’s coat.');
  if (!c.creation.hopedAccomplishment.trim())
    issues.push('Record the hoped-for initiation accomplishment.');
  if (!c.creation.initiationTraitId)
    issues.push('Resolve initiation and record its resulting 1d6 Trait.');
  return issues;
}

export const arenaStats: Record<
  DitvConflict['activeArena'],
  readonly [
    'acuity' | 'body' | 'heart' | 'will',
    'acuity' | 'body' | 'heart' | 'will',
  ]
> = {
  talking: ['acuity', 'heart'],
  physical: ['body', 'heart'],
  fighting: ['body', 'will'],
  gunfighting: ['acuity', 'will'],
};

export function classifySee(dieCount: number) {
  if (dieCount < 1) throw new Error('A See requires at least one die.');
  return dieCount === 1
    ? 'reverse'
    : dieCount === 2
      ? 'block-or-dodge'
      : 'take-the-blow';
}
export function falloutSummary(results: number[]) {
  const ordered = [...results].sort((a, b) => b - a);
  const sum = (ordered[0] ?? 0) + (ordered[1] ?? 0);
  return {
    sum,
    ones: results.filter((x) => x === 1).length,
    shortTerm: sum < 8,
    lasting: sum >= 8,
    injured: sum >= 12,
    badlyInjured: sum >= 16,
    dead: sum >= 20,
    experienceEligible: results.includes(1),
  };
}

const statTable = [
  [4, 3, 2, 2],
  [4, 3, 3, 2],
  [4, 4, 3, 2],
  [5, 4, 3, 2],
  [5, 5, 3, 2],
  [4, 4, 4, 3],
  [5, 4, 4, 3],
  [5, 5, 4, 3],
  [6, 5, 4, 3],
  [6, 5, 5, 4],
] as const;
const traitTable: (DicePool | null)[] = [
  { d4: 2, d6: 0, d8: 0, d10: 0 },
  { d4: 1, d6: 0, d8: 0, d10: 0 },
  { d4: 0, d6: 1, d8: 0, d10: 0 },
  { d4: 0, d6: 0, d8: 1, d10: 0 },
  { d4: 0, d6: 0, d8: 0, d10: 1 },
  { d4: 0, d6: 2, d8: 0, d10: 0 },
  { d4: 0, d6: 0, d8: 2, d10: 0 },
  { d4: 0, d6: 0, d8: 0, d10: 2 },
  null,
  null,
];
const relationshipTable: DicePool[] = [
  { d4: 2, d6: 0, d8: 0, d10: 0 },
  { d4: 1, d6: 0, d8: 0, d10: 0 },
  { d4: 0, d6: 1, d8: 0, d10: 0 },
  { d4: 0, d6: 0, d8: 1, d10: 0 },
  { d4: 0, d6: 0, d8: 0, d10: 1 },
  { d4: 0, d6: 2, d8: 0, d10: 0 },
  { d4: 0, d6: 0, d8: 2, d10: 0 },
  { d4: 0, d6: 0, d8: 0, d10: 2 },
  { d4: 0, d6: 3, d8: 0, d10: 0 },
  { d4: 0, d6: 0, d8: 3, d10: 0 },
];
const freeTable: DicePool[] = [
  { d4: 2, d6: 0, d8: 0, d10: 0 },
  { d4: 0, d6: 2, d8: 0, d10: 0 },
  { d4: 0, d6: 4, d8: 0, d10: 0 },
  { d4: 0, d6: 0, d8: 1, d10: 0 },
  { d4: 0, d6: 0, d8: 2, d10: 0 },
  { d4: 0, d6: 0, d8: 0, d10: 1 },
];
const d = (size: number, random: () => number) =>
  Math.floor(random() * size) + 1;
export function generateProtoNpc(random = Math.random): DitvNpc {
  const stats = statTable[d(10, random) - 1]!;
  const traits = Array.from(
    { length: 4 },
    () => traitTable[d(8, random) - 1]!,
  ).filter(Boolean);
  const relationships = Array.from(
    { length: 2 },
    () => relationshipTable[d(10, random) - 1]!,
  );
  const record = (dice: DicePool, name = '') => ({
    id: crypto.randomUUID(),
    name,
    dice,
    notes: '',
    origin: 'creation' as const,
    temporaryUntilConflict: false,
    sourceId: 'ditv.core',
    page: 125,
  });
  return {
    id: crypto.randomUUID(),
    name: '',
    status: 'proto',
    kind: 'ordinary',
    stats: {
      acuity: stats[0],
      body: stats[1],
      heart: stats[2],
      will: stats[3],
    },
    traits: traits.map((x) => record(x)),
    relationships: [
      record({ d4: 0, d6: 1, d8: 0, d10: 0 }, 'Blood'),
      ...relationships.map((x) => record(x)),
    ],
    belongings: [],
    wants: '',
    manifestations: [],
    powers: [],
    groupSize: 1,
    notes: '',
  };
}
export function generateProtoBatch(random = Math.random) {
  const npcs = Array.from({ length: 6 }, () => generateProtoNpc(random));
  const freeDice = Array.from(
    { length: 3 },
    () => freeTable[d(6, random) - 1]!,
  ).reduce(addDice, emptyDice());
  return { npcs, freeDice };
}
