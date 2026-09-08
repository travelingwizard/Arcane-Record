import {
  actionNames,
  heritageTraits,
  playbookAbilities,
  playbooks,
  specialistActions,
} from './catalog';
import type { BobCharacter, BobLegion } from './schema';
export type RollKind =
  | 'action'
  | 'resistance'
  | 'fortune'
  | 'engagement'
  | 'campaign'
  | 'secondary-mission'
  | 'spy';
export function evaluateFitdRoll(dice: number[], kind: RollKind) {
  const highest = dice.length ? Math.max(...dice) : 0;
  const sixes = dice.filter((x) => x === 6).length;
  const outcome =
    highest === 0
      ? 'zero'
      : sixes >= 2
        ? 'critical'
        : highest === 6
          ? 'full'
          : highest >= 4
            ? 'partial'
            : 'bad';
  return {
    highest,
    outcome: outcome as 'critical' | 'full' | 'partial' | 'bad' | 'zero',
    stressCost:
      kind === 'resistance'
        ? highest === 0
          ? 6
          : Math.max(0, 6 - highest)
        : null,
  };
}
export function rollFitd(pool: number, kind: RollKind) {
  const count = Math.max(1, Math.abs(pool));
  const values = new Uint32Array(count);
  crypto.getRandomValues(values);
  const raw = [...values].map((x) => (x % 6) + 1);
  const dice = pool <= 0 ? [Math.min(...raw.slice(0, 2))] : raw;
  return { pool, dice, ...evaluateFitdRoll(dice, kind) };
}
export function creationIssues(c: BobCharacter) {
  const issues: string[] = [];
  const pb = playbooks.find((x) => x.id === c.playbookId);
  if (!pb) issues.push('Choose a playbook.');
  if (c.specialAbilities.length !== 1)
    issues.push('Choose exactly one starting special ability.');
  if (!c.heritageName.trim()) issues.push('Choose or describe a heritage.');
  if (
    c.heritageId.includes('unique')
      ? c.heritageTraits.length !== 0
      : c.heritageTraits.length !== 2
  )
    issues.push('Choose two heritage traits, except for a Unique Heritage.');
  if (c.creation.additionalRanks !== 4)
    issues.push('Allocate exactly four additional action ranks.');
  if (
    c.actions.some((x) => x.rating > 2) &&
    !c.creation.approvals.some((x) => x.ruleId === 'starting-action-cap')
  )
    issues.push('Starting action ratings cannot exceed 2 without approval.');
  if (!c.name.trim()) issues.push('Name the Legionnaire.');
  return issues;
}
export function applyPlaybook(
  c: BobCharacter,
  playbookName: string,
): BobCharacter {
  const pb = playbooks.find((x) => x.name === playbookName)!;
  const starting: Record<string, Record<string, number>> = {
    Heavy: { Skirmish: 2, Maneuver: 1 },
    Medic: { Research: 1, Doctor: 0 },
    Officer: { Discipline: 2, Marshal: 1 },
    Scout: { Scout: 2, Rig: 1 },
    Sniper: { Shoot: 2, Scout: 1 },
    Rookie: {},
    Soldier: { Skirmish: 1, Discipline: 1 },
  };
  const base = starting[playbookName] ?? {};
  return {
    ...c,
    playbookId: pb.id,
    actions: actionNames.map((name) => ({
      ...c.actions.find((x) => x.name === name)!,
      rating: base[name] ?? 0,
    })),
    specialAbilities: [],
    specialistAction: {
      name:
        specialistActions.find((x) => x.requirements?.includes(playbookName))
          ?.name ?? '',
      uses: 0,
      maximum: 3,
    },
    creation: { ...c.creation, additionalRanks: 0 },
  };
}
export function addActionRank(c: BobCharacter, name: string) {
  const current = c.actions.find((x) => x.name === name);
  if (!current || c.creation.additionalRanks >= 4 || current.rating >= 2)
    return c;
  return {
    ...c,
    actions: c.actions.map((x) =>
      x.name === name ? { ...x, rating: x.rating + 1 } : x,
    ),
    creation: {
      ...c.creation,
      additionalRanks: c.creation.additionalRanks + 1,
    },
  };
}
export function availableAbilities(c: BobCharacter) {
  const pb = playbooks.find((x) => x.id === c.playbookId)?.name ?? '';
  return [...(playbookAbilities[pb] ?? [])];
}
export function heritageOptions(name: string) {
  return heritageTraits[name] ?? [];
}
export function applyLegionResource(
  c: BobLegion,
  changes: Partial<
    Pick<
      BobLegion,
      'pressure' | 'time' | 'advance' | 'morale' | 'supply' | 'intel'
    >
  >,
  title: string,
) {
  return {
    ...c,
    ...changes,
    revision: c.revision + 1,
    history: [
      ...c.history,
      {
        id: crypto.randomUUID(),
        kind: 'resource',
        title,
        description: Object.entries(changes)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', '),
        createdAt: new Date().toISOString(),
      },
    ],
  };
}
export function canPromote(c: BobCharacter, target: 'Soldier' | 'Specialist') {
  if (target === 'Soldier')
    return c.playbookId.endsWith('rookie') && c.xp.playbook >= 6;
  return (
    c.playbookId.endsWith('soldier') &&
    c.xp.playbook >= 6 &&
    c.actions.filter((x) => x.rating >= 2).length >= 2
  );
}
