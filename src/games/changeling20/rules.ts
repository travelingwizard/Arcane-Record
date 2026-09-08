import type { Changeling20Character, C20RatedTrait } from './schema';

export const C20_ATTRIBUTE_NAMES = [
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
export const C20_ABILITY_NAMES = [
  'Alertness',
  'Athletics',
  'Brawl',
  'Empathy',
  'Expression',
  'Intimidation',
  'Kenning',
  'Persuasion',
  'Streetwise',
  'Subterfuge',
  'Crafts',
  'Drive',
  'Etiquette',
  'Firearms',
  'Leadership',
  'Melee',
  'Performance',
  'Security',
  'Stealth',
  'Survival',
  'Academics',
  'Computer',
  'Enigmas',
  'Gremayre',
  'Investigation',
  'Law',
  'Medicine',
  'Politics',
  'Science',
  'Technology',
] as const;

export const C20_CREATION_BUDGETS = {
  attributes: [7, 5, 3],
  abilities: [13, 9, 5],
  backgrounds: 5,
  arts: 3,
  realms: 5,
  freebies: 15,
  creditedFlaws: 7,
} as const;

export type C20XpTarget =
  'attribute' | 'ability' | 'art' | 'realm' | 'willpower' | 'glamour';

export function c20XpCost(kind: C20XpTarget, current: number) {
  if (kind === 'ability') return current === 0 ? 3 : current * 2;
  if (kind === 'art') return current === 0 ? 7 : current * 4;
  if (kind === 'realm') return current === 0 ? 5 : current * 3;
  if (kind === 'attribute') return current * 4;
  if (kind === 'willpower') return current * 2;
  return current * 3;
}

export function c20CreationIssues(c: Changeling20Character) {
  const issues: string[] = [];
  if (c.creation.status === 'manual') return issues;
  if (!c.name.trim()) issues.push('Enter a character name.');
  if (c.profile === 'kithain' && !c.kithId) issues.push('Choose a Kith.');
  if (c.profile === 'kithain' && (!c.seelieLegacyId || !c.unseelieLegacyId))
    issues.push('Choose both Legacies.');
  if (!c.thresholdId) issues.push('Choose a Threshold.');
  if (!c.antithesis.trim()) issues.push('Describe the character’s antithesis.');
  const attributes = categorySpend(c.attributes);
  const abilities = categorySpend(c.abilities);
  if (![3, 5, 7].every((n) => attributes.includes(n)))
    issues.push(
      'Attribute categories must spend 7, 5, and 3 dots above their free dots.',
    );
  if (![5, 9, 13].every((n) => abilities.includes(n)))
    issues.push('Ability categories must spend 13, 9, and 5 dots.');
  if (
    c.abilities.some((trait) => trait.rating > 3 && trait.origin === 'creator')
  )
    issues.push('Initial Ability allocations cannot exceed 3 before freebies.');
  if (sumRatings(c.backgrounds) !== C20_CREATION_BUDGETS.backgrounds)
    issues.push('Allocate exactly 5 Background points.');
  if (sumRatings(c.arts) !== C20_CREATION_BUDGETS.arts)
    issues.push('Allocate exactly 3 Art points.');
  if (sumRatings(c.realms) !== C20_CREATION_BUDGETS.realms)
    issues.push('Allocate exactly 5 Realm points.');
  if (c.creation.flawCredit > 7)
    issues.push('No more than 7 Flaw points can provide freebie credit.');
  if (
    (c.profile === 'dauntain' || c.profile === 'thallain') &&
    !c.creation.matureContent
  )
    issues.push(
      'This antagonist-oriented profile requires mature-content opt-in.',
    );
  const approved = new Set(c.creation.approvals.map(({ ruleId }) => ruleId));
  return issues.filter((issue) => !approved.has(issue));
}

export function canRefundC20Entry(
  entries: Changeling20Character['experienceLedger'],
  entryId: string,
) {
  const entry = entries.find(({ id }) => id === entryId);
  return Boolean(
    entry?.kind === 'purchase' &&
    !entries.some(({ reversedEntryId }) => reversedEntryId === entryId),
  );
}

function categorySpend(traits: C20RatedTrait[]) {
  const categories = [...new Set(traits.map((trait) => trait.category))];
  return categories.map((category) =>
    traits
      .filter((trait) => trait.category === category)
      .reduce(
        (sum, trait) =>
          sum +
          Math.max(0, trait.rating - (trait.kind === 'attribute' ? 1 : 0)),
        0,
      ),
  );
}
export const sumRatings = (traits: C20RatedTrait[]) =>
  traits.reduce((sum, trait) => sum + trait.rating, 0);

export function c20LedgerTotals(
  entries: Changeling20Character['experienceLedger'],
) {
  const total = entries
    .filter((entry) => entry.amount > 0)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const current = entries.reduce((sum, entry) => sum + entry.amount, 0);
  return { total, current };
}
