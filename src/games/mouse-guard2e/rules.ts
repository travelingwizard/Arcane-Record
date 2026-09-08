import { ranks, type GuardRankId } from './catalog';
import type { MouseGuardCharacter, MouseGuardRated } from './schema';
export const rankById = (id: GuardRankId) => ranks.find((r) => r.id === id)!;
export function chooseSkill(
  skills: MouseGuardRated[],
  name: string,
): MouseGuardRated[] {
  const found = skills.find((x) => x.name === name);
  if (!found)
    return [
      ...skills,
      {
        id: crypto.randomUUID(),
        definitionId: `mg2.core.skill.${name.toLowerCase().replaceAll(' ', '-')}`,
        name,
        rating: 2,
        marks: { pass: 0, fail: 0 },
        notes: '',
        sourceId: 'mg2.core',
        page: 228,
        origin: 'recruitment',
      },
    ];
  return skills.map((x) =>
    x.id === found.id ? { ...x, rating: Math.min(6, x.rating + 1) } : x,
  );
}
export function natureResult(answers: string[]) {
  let maximum = 3;
  let fighterDelta = 0;
  const descriptors: string[] = [];
  if (answers[0] === 'save') maximum++;
  else if (answers[0]) descriptors.push(answers[0]);
  if (answers[1] === 'hide') {
    maximum++;
    fighterDelta = -1;
  }
  if (answers[2] === 'fear') maximum++;
  else if (answers[2]) descriptors.push(answers[2]);
  return { maximum, fighterDelta, descriptors };
}
export function advancementRequirement(rating: number) {
  return { pass: rating, fail: Math.max(1, 7 - rating) };
}
export function rollD6(input: {
  base: number;
  help: number;
  trait: number;
  persona: number;
  gear: number;
  obstacle: number;
  kind: 'independent' | 'versus' | 'conflict';
}) {
  const pool = Math.max(
    0,
    input.base + input.help + input.trait + input.persona + input.gear,
  );
  const values = new Uint32Array(pool);
  crypto.getRandomValues(values);
  const dice = [...values].map((x) => (x % 6) + 1);
  const successes = dice.filter((x) => x >= 4).length;
  const margin = successes - input.obstacle;
  return {
    pool,
    dice,
    successes,
    margin,
    outcome:
      margin > 0
        ? ('success' as const)
        : margin < 0
          ? ('failure' as const)
          : ('tie' as const),
  };
}
export function recruitmentIssues(c: MouseGuardCharacter) {
  const r = rankById(c.rankId);
  const issues: string[] = [];
  if (c.age < r.age[0] || c.age > r.age[1])
    issues.push(`${r.name} age must normally be ${r.age[0]}–${r.age[1]}.`);
  if (c.wises.length < r.wiseCount)
    issues.push(
      `${r.name} requires ${r.wiseCount} Wise${r.wiseCount === 1 ? '' : 's'}.`,
    );
  if (
    c.rankId === 'tenderpaw' &&
    !c.relationships.some((x) => x.kind === 'mentor' && x.name.trim())
  )
    issues.push('A Tenderpaw requires a mentor.');
  if (c.rankId === 'tenderpaw' && c.cloakColor.trim())
    issues.push('Tenderpaws have not yet earned a cloak.');
  if (c.rankId === 'guard-captain')
    issues.push('Guard Captain recruitment requires group approval.');
  if (!c.belief.trim() || !c.goal.trim() || !c.instinct.trim())
    issues.push('Belief, Goal, and Instinct are required.');
  return issues;
}
