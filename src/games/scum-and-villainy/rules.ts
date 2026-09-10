import type { SandvCharacter } from './schema';
export function fitdRoll(pool: number, dice: number[]) {
  const kept =
      pool > 0
        ? [...dice].sort((a, b) => b - a)
        : [...dice].sort((a, b) => a - b),
    highest = kept[0]!,
    sixes = dice.filter((x) => x === 6).length;
  return {
    kept,
    highest,
    outcome: (pool > 0 && sixes >= 2
      ? 'critical'
      : highest === 6
        ? 'full'
        : highest >= 4
          ? 'partial'
          : 'bad') as 'critical' | 'full' | 'partial' | 'bad',
  };
}
export function attributeRatings(c: SandvCharacter) {
  const groups = [
    c.actions.slice(0, 4),
    c.actions.slice(4, 8),
    c.actions.slice(8, 12),
  ];
  return {
    insight: groups[0]!.filter((x) => x.rating > 0).length,
    prowess: groups[1]!.filter((x) => x.rating > 0).length,
    resolve: groups[2]!.filter((x) => x.rating > 0).length,
  };
}
export function creationIssues(c: SandvCharacter) {
  const issues: string[] = [];
  if (!c.playbookId) issues.push('Choose a playbook.');
  if (!c.heritageId) issues.push('Choose a heritage.');
  if (!c.backgroundId) issues.push('Choose a background.');
  if (!c.vice.typeId) issues.push('Choose a vice.');
  if (c.abilities.length !== 1)
    issues.push('Choose one starting special ability.');
  if (c.actions.reduce((n, x) => n + x.rating, 0) !== 4)
    issues.push('Allocate exactly four additional action dots.');
  if (c.actions.some((x) => x.rating > 2))
    issues.push('Starting action ratings cannot exceed 2.');
  if (!c.friend.trim() || !c.rival.trim())
    issues.push('Record a friend and a rival.');
  return issues;
}
