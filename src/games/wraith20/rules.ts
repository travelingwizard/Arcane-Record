import type { Wr20Character } from './schema';
export const WR20_ATTRIBUTES = [
  'Strength',
  'Dexterity',
  'Stamina',
  'Charisma',
  'Manipulation',
  'Appearance',
  'Perception',
  'Intelligence',
  'Wits',
];
export const WR20_ABILITIES = [
  'Alertness',
  'Athletics',
  'Awareness',
  'Brawl',
  'Empathy',
  'Expression',
  'Intimidation',
  'Persuasion',
  'Streetwise',
  'Subterfuge',
  'Crafts',
  'Drive',
  'Etiquette',
  'Firearms',
  'Larceny',
  'Leadership',
  'Meditation',
  'Melee',
  'Performance',
  'Stealth',
  'Academics',
  'Bureaucracy',
  'Computer',
  'Enigmas',
  'Investigation',
  'Medicine',
  'Occult',
  'Politics',
  'Science',
  'Technology',
];
export function creationIssues(c: Wr20Character) {
  const issues: string[] = [];
  const sums = (xs: Wr20Character['attributes'], cats: string[]) =>
    cats
      .map((cat) =>
        xs
          .filter((x) => x.category === cat)
          .reduce(
            (n, x) =>
              n +
              x.rating -
              (x.category === cat && x.origin === 'creator' ? 1 : 0),
            0,
          ),
      )
      .sort((a, b) => b - a);
  if (c.characterType === 'wraith') {
    if (sums(c.attributes, ['physical', 'social', 'mental']).join() !== '7,5,3')
      issues.push('Attributes must use 7/5/3 above the free starting dots.');
    const ability = ['talents', 'skills', 'knowledges']
      .map((cat) =>
        c.abilities
          .filter((x) => x.category === cat)
          .reduce((n, x) => n + x.rating, 0),
      )
      .sort((a, b) => b - a);
    if (ability.join() !== '13,9,5') issues.push('Abilities must use 13/9/5.');
    if (c.abilities.some((x) => x.rating > 3))
      issues.push('Initial Ability ratings cannot exceed 3 before freebies.');
    if (c.arcanoi.reduce((n, x) => n + x.rating, 0) !== 5)
      issues.push('Allocate five Arcanoi dots.');
    if (c.arcanoi.some((x) => x.rating > 3))
      issues.push('A starting Arcanos cannot exceed 3.');
    if (c.backgrounds.reduce((n, x) => n + x.rating, 0) !== 7)
      issues.push('Allocate seven Background dots.');
    if (c.passions.reduce((n, x) => n + x.rating, 0) !== 10)
      issues.push('Allocate ten Passion dots.');
    if (c.fetters.reduce((n, x) => n + x.rating, 0) !== 10)
      issues.push('Allocate ten Fetter dots.');
    if (c.shadow.kind === 'none')
      issues.push('Create and link the character’s Shadow.');
  }
  if (
    c.characterType === 'spectre' &&
    (!c.creation.matureContent ||
      !c.creation.storytellerApproved ||
      !c.creation.approvalReason.trim())
  )
    issues.push(
      'Spectre creation requires mature-content opt-in and a recorded Storyteller approval.',
    );
  return issues;
}
export function ledgerTotals(entries: Wr20Character['experienceLedger']) {
  let total = 0,
    current = 0;
  for (const e of entries) {
    current += e.amount;
    if (e.kind === 'award' || (e.kind === 'adjustment' && e.amount > 0))
      total += e.amount;
  }
  return { total, current };
}
export function evaluateRoll(
  dice: number[],
  pool: number,
  shadowDice: number,
  difficulty: number,
) {
  const successes =
    dice.filter((d) => d >= difficulty).length -
    dice.filter((d) => d === 1).length;
  const shadowOnes = dice
    .slice(pool, pool + shadowDice)
    .filter((d) => d === 1).length;
  return {
    successes: Math.max(0, successes),
    shadowOnes,
    result:
      successes < 0
        ? ('botch' as const)
        : successes === 0
          ? ('failure' as const)
          : ('success' as const),
  };
}
