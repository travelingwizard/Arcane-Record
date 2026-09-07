export type Priority = 0 | 1 | 2 | 3 | 4;

export const priorityRows = [
  { priority: 0, attributes: 15, skills: 17, nuyen: 100, spellForce: 5 },
  { priority: 1, attributes: 17, skills: 20, nuyen: 1_000, spellForce: 10 },
  { priority: 2, attributes: 20, skills: 24, nuyen: 20_000, spellForce: 20 },
  { priority: 3, attributes: 24, skills: 30, nuyen: 400_000, spellForce: 50 },
  {
    priority: 4,
    attributes: 30,
    skills: 40,
    nuyen: 1_000_000,
    spellForce: 0,
  },
] as const;

export interface ShadowrunPriorities {
  magic: Priority;
  attributes: Priority;
  skills: Priority;
  tech: Priority;
  race: Priority;
}

export function priorityBudget(priorities: ShadowrunPriorities) {
  const row = (priority: Priority) => priorityRows[priority];
  return {
    attributePoints: row(priorities.attributes).attributes,
    skillPoints: row(priorities.skills).skills,
    nuyen: row(priorities.tech).nuyen,
    spellForce: row(priorities.tech).spellForce,
    magical:
      priorities.magic === 4 ||
      (priorities.race === 4 && priorities.magic === 3),
    metahuman: priorities.race === 4,
  };
}

export function priorityIssues(
  priorities: ShadowrunPriorities,
  metatype?: 'human' | 'elf' | 'dwarf' | 'ork' | 'troll' | 'custom',
) {
  const values = Object.values(priorities);
  const issues: string[] = [];
  if (new Set(values).size !== 5)
    issues.push('Assign each priority from 0 through 4 exactly once.');
  if (metatype === 'human' && priorities.race === 4)
    issues.push('Race priority 4 is the core metahuman option, not Human.');
  if (metatype === 'human' && priorities.magic === 3)
    issues.push('Magic priority 3 is reserved for a metahuman magician.');
  if (
    metatype &&
    !['human', 'custom'].includes(metatype) &&
    priorities.race !== 4
  )
    issues.push(
      'Elf, dwarf, ork, and troll characters require Race priority 4.',
    );
  return issues;
}
