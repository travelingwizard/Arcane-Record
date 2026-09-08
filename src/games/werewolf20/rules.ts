import type { W20Character, W20RatedTrait } from './schema';
export const W20_ATTRIBUTES = [
  'Strength',
  'Dexterity',
  'Stamina',
  'Charisma',
  'Manipulation',
  'Appearance',
  'Perception',
  'Intelligence',
  'Wits',
] as const;
export const W20_ABILITIES = [
  'Alertness',
  'Athletics',
  'Brawl',
  'Empathy',
  'Expression',
  'Intimidation',
  'Leadership',
  'Primal-Urge',
  'Streetwise',
  'Subterfuge',
  'Animal Ken',
  'Crafts',
  'Drive',
  'Etiquette',
  'Firearms',
  'Larceny',
  'Melee',
  'Performance',
  'Stealth',
  'Survival',
  'Academics',
  'Computer',
  'Enigmas',
  'Investigation',
  'Law',
  'Medicine',
  'Occult',
  'Rituals',
  'Science',
  'Technology',
] as const;
export const W20_FORM_NAMES = [
  'Homid',
  'Glabro',
  'Crinos',
  'Hispo',
  'Lupus',
] as const;
export function w20CreationBudgets(c: W20Character) {
  if (c.characterType === 'kinfolk')
    return {
      attributes: [6, 4, 3],
      abilities: [11, 7, 4],
      backgrounds: 5,
      gifts: 0,
      freebies: 21,
      flawCredit: 7,
    };
  return {
    attributes: [7, 5, 3],
    abilities: [13, 9, 5],
    backgrounds: 5,
    gifts: 3,
    freebies: 15,
    flawCredit: 7,
  };
}
const sum = (x: W20RatedTrait[]) => x.reduce((n, t) => n + t.rating, 0);
function spends(x: W20RatedTrait[], base: number) {
  return [...new Set(x.map((t) => t.category))].map((cat) =>
    x
      .filter((t) => t.category === cat)
      .reduce((n, t) => n + Math.max(0, t.rating - base), 0),
  );
}
export function w20CreationIssues(c: W20Character) {
  if (c.creation.status === 'manual') return [];
  const b = w20CreationBudgets(c),
    issues: string[] = [];
  if (!c.name.trim()) issues.push('Enter a character name.');
  if (!c.natureId || !c.demeanorId) issues.push('Choose Nature and Demeanor.');
  if (c.characterType === 'garou' && (!c.breedId || !c.auspiceId || !c.tribeId))
    issues.push('Choose breed, auspice, and tribe.');
  if (c.characterType === 'changing-breed' && !c.changingBreedId)
    issues.push('Choose a Changing Breed.');
  if (c.characterType === 'wyrm-aligned' && !c.wyrmTypeId)
    issues.push('Choose a Wyrm-aligned framework.');
  if (!b.attributes.every((n) => spends(c.attributes, 1).includes(n)))
    issues.push(
      `Attribute categories must spend ${b.attributes.join(', ')} dots.`,
    );
  if (!b.abilities.every((n) => spends(c.abilities, 0).includes(n)))
    issues.push(
      `Ability categories must spend ${b.abilities.join(', ')} dots.`,
    );
  if (c.abilities.some((t) => t.rating > 3 && t.origin === 'creator'))
    issues.push('Initial Abilities cannot exceed 3 before freebies.');
  if (sum(c.backgrounds) !== b.backgrounds)
    issues.push(`Allocate exactly ${b.backgrounds} Background dots.`);
  if (sum(c.gifts) !== b.gifts)
    issues.push(`Select exactly ${b.gifts} starting Gifts.`);
  if (c.creation.flawCredit > b.flawCredit)
    issues.push('No more than seven Flaw points provide credit.');
  if (c.characterType === 'wyrm-aligned' && !c.creation.matureContent)
    issues.push('Wyrm-aligned characters require mature-content opt-in.');
  const approved = new Set(c.creation.approvals.map((a) => a.ruleId));
  return issues.filter((i) => !approved.has(i));
}
export type W20XpTarget =
  | 'ability'
  | 'attribute'
  | 'gift-breed'
  | 'gift-auspice'
  | 'gift-tribe'
  | 'gift-other'
  | 'rage'
  | 'gnosis'
  | 'willpower'
  | 'rite';
export function w20XpCost(kind: W20XpTarget, current: number, rank = 1) {
  switch (kind) {
    case 'ability':
      return current === 0 ? 3 : current * 2;
    case 'attribute':
      return current * 4;
    case 'gift-breed':
    case 'gift-auspice':
    case 'gift-tribe':
      return rank * 3;
    case 'gift-other':
      return rank * 5;
    case 'rage':
      return current;
    case 'gnosis':
      return current * 2;
    case 'willpower':
      return current;
    case 'rite':
      return rank * 3;
  }
}
export function w20LedgerTotals(e: W20Character['experienceLedger']) {
  return {
    total: e.filter((x) => x.amount > 0).reduce((n, x) => n + x.amount, 0),
    current: e.reduce((n, x) => n + x.amount, 0),
  };
}
export function canRefundW20(e: W20Character['experienceLedger'], id: string) {
  const x = e.find((a) => a.id === id);
  return Boolean(
    x?.kind === 'purchase' && !e.some((a) => a.reversedEntryId === id),
  );
}
export function evaluateW20Roll(
  dice: number[],
  difficulty: number,
  specialty = false,
) {
  let successes = 0,
    ones = 0;
  for (const die of dice) {
    if (die === 1) ones++;
    else if (die >= difficulty) successes += specialty && die === 10 ? 2 : 1;
  }
  const net = successes - ones;
  return {
    successes: net,
    result: (net > 0
      ? 'success'
      : successes === 0 && ones > 0
        ? 'botch'
        : 'failure') as 'success' | 'failure' | 'botch',
  };
}
export function rollW20Pool(
  pool: number,
  difficulty: number,
  specialty = false,
) {
  const dice = Array.from(
    crypto.getRandomValues(new Uint32Array(Math.max(0, pool))),
    (n) => (n % 10) + 1,
  );
  return { dice, ...evaluateW20Roll(dice, difficulty, specialty) };
}
