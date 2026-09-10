import { rootPlaybooks } from './catalog';
import type { RootVagabond } from './schema';
export const reputationThresholds = {
  prestige: { 0: 5, 1: 10, 2: 15 },
  notoriety: { 0: 3, '-1': 6, '-2': 9 },
} as const;
export function applyPlaybook(v: RootVagabond, id: string) {
  const p = rootPlaybooks.find((x) => x.id === id);
  if (!p) return v;
  const [charm, cunning, finesse, luck, might] = p.stats;
  return {
    ...v,
    playbookId: id,
    stats: { charm, cunning, finesse, luck, might },
    value: p.startingValue,
    load: {
      current: v.load.current,
      burdened: Math.max(1, 4 + might),
      maximum: Math.max(2, (4 + might) * 2),
    },
    creation: { ...v.creation, statBoost: null },
  };
}
export function applyStatBoost(
  v: RootVagabond,
  key: keyof RootVagabond['stats'],
) {
  const p = rootPlaybooks.find((x) => x.id === v.playbookId);
  if (!p || v.stats[key] >= 2) return v;
  const keys = ['charm', 'cunning', 'finesse', 'luck', 'might'] as const,
    base = Object.fromEntries(
      keys.map((k, i) => [k, p.stats[i]]),
    ) as RootVagabond['stats'];
  return {
    ...v,
    stats: { ...base, [key]: base[key] + 1 },
    creation: { ...v.creation, statBoost: key },
  };
}
export function equipmentCost(
  item: Pick<RootVagabond['equipment'][number], 'wearMaximum' | 'tags'>,
) {
  return Math.max(
    0,
    item.wearMaximum +
      item.tags.reduce((sum, tag) => sum + (tag.startsWith('-') ? -1 : 1), 0),
  );
}
export function creationIssues(v: RootVagabond) {
  const issues: string[] = [];
  const p = rootPlaybooks.find((x) => x.id === v.playbookId);
  if (!p) issues.push('Choose a playbook.');
  if (!v.name.trim()) issues.push('Enter the vagabond’s name.');
  if (!v.nature) issues.push('Choose one Nature.');
  if (v.drives.length !== 2) issues.push('Choose exactly two Drives.');
  if (v.moves.length !== (p?.startingMoves ?? 3))
    issues.push(`Choose ${p?.startingMoves ?? 3} starting moves.`);
  if (v.weaponSkills.length < 1) issues.push('Choose a starting Weapon Skill.');
  const spent = v.equipment
    .filter((x) => x.origin === 'creation')
    .reduce((sum, x) => sum + x.value, 0);
  if (p && spent > p.startingValue)
    issues.push('Starting equipment exceeds available Value.');
  return issues;
}
export function rollRoot(
  dice: [number, number],
  stat: number,
  modifier: number,
) {
  const total = dice[0] + dice[1] + stat + modifier;
  return {
    total,
    outcome: total >= 10 ? 'full' : total >= 7 ? 'mixed' : 'miss',
  } as const;
}
export function applyReputationProgress(
  r: RootVagabond['reputation'][number],
  kind: 'prestige' | 'notoriety',
  amount: number,
) {
  let next = { ...r, [kind]: r[kind] + amount };
  if (kind === 'prestige') {
    const need =
      r.rating < 0
        ? 5
        : reputationThresholds.prestige[Math.min(2, r.rating) as 0 | 1 | 2];
    if (next.prestige >= need) {
      next = {
        ...next,
        rating: Math.min(3, r.rating + 1),
        prestige: next.prestige - need,
      };
    }
  } else {
    const base = Math.min(0, r.rating) as 0 | -1 | -2;
    const need = reputationThresholds.notoriety[base];
    if (next.notoriety >= need) {
      next = {
        ...next,
        rating: Math.max(-3, r.rating - 1),
        notoriety: next.notoriety - need,
      };
    }
  }
  return next;
}
export const canAdvanceDrive = (drive: RootVagabond['drives'][number]) =>
  !drive.advancedThisSession;
