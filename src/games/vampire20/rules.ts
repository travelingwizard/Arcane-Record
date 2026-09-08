import type { V20Character, V20RatedTrait } from './schema';

export const V20_ATTRIBUTES = [
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
export const V20_ABILITIES = [
  'Alertness',
  'Athletics',
  'Awareness',
  'Brawl',
  'Empathy',
  'Expression',
  'Intimidation',
  'Leadership',
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
  'Finance',
  'Investigation',
  'Law',
  'Medicine',
  'Occult',
  'Politics',
  'Science',
  'Technology',
] as const;
export const V20_BUDGETS = {
  attributes: [7, 5, 3],
  abilities: [13, 9, 5],
  disciplines: 3,
  backgrounds: 5,
  virtues: 7,
  freebies: 15,
  flawCredit: 7,
} as const;

export const V20_CLAN_DISCIPLINES: Record<string, string[]> = {
  assamite: ['Celerity', 'Obfuscate', 'Quietus'],
  brujah: ['Celerity', 'Potence', 'Presence'],
  giovanni: ['Dominate', 'Necromancy', 'Potence'],
  gangrel: ['Animalism', 'Fortitude', 'Protean'],
  lasombra: ['Dominate', 'Obtenebration', 'Potence'],
  malkavian: ['Auspex', 'Dementation', 'Obfuscate'],
  nosferatu: ['Animalism', 'Obfuscate', 'Potence'],
  ravnos: ['Animalism', 'Chimerstry', 'Fortitude'],
  'follower-of-set': ['Obfuscate', 'Presence', 'Serpentis'],
  toreador: ['Auspex', 'Celerity', 'Presence'],
  tremere: ['Auspex', 'Dominate', 'Thaumaturgy'],
  tzimisce: ['Animalism', 'Auspex', 'Vicissitude'],
  ventrue: ['Dominate', 'Fortitude', 'Presence'],
};

export function inClanDiscipline(lineageId: string | null, discipline: string) {
  const key = lineageId?.replace('v20.lineage.', '') ?? '';
  return (V20_CLAN_DISCIPLINES[key] ?? []).includes(discipline);
}

export type V20XpTarget =
  | 'area'
  | 'ability'
  | 'new-discipline'
  | 'new-path'
  | 'secondary-path'
  | 'ritual'
  | 'attribute'
  | 'clan-discipline'
  | 'other-discipline'
  | 'virtue'
  | 'road-virtue'
  | 'willpower'
  | 'road'
  | 'background';

export function v20XpCost(kind: V20XpTarget, current: number, rating = 1) {
  switch (kind) {
    case 'area':
      return 1;
    case 'ability':
      return current === 0 ? 3 : current * 2;
    case 'new-discipline':
      return 10;
    case 'new-path':
      return 7;
    case 'secondary-path':
      return current * 4;
    case 'ritual':
      return rating * 2;
    case 'attribute':
      return current * 4;
    case 'clan-discipline':
      return current * 5;
    case 'other-discipline':
      return current * 7;
    case 'virtue':
    case 'road-virtue':
    case 'road':
    case 'background':
      return current * 2;
    case 'willpower':
      return current;
  }
}

export function generationFromBackground(rating: number) {
  return Math.max(8, 13 - rating);
}
export function bloodLimits(generation: number) {
  if (generation <= 7) return { maximum: 20, perTurn: 4, traitMaximum: 6 };
  if (generation === 8) return { maximum: 15, perTurn: 3, traitMaximum: 5 };
  if (generation === 9) return { maximum: 14, perTurn: 2, traitMaximum: 5 };
  if (generation === 10) return { maximum: 13, perTurn: 1, traitMaximum: 5 };
  if (generation === 11) return { maximum: 12, perTurn: 1, traitMaximum: 5 };
  return { maximum: 10, perTurn: 1, traitMaximum: 5 };
}
export function startingBlood(
  die: number,
  domain: number,
  herd: number,
  maximum: number,
) {
  return Math.min(maximum, Math.max(1, die) + domain + herd);
}
export const sumV20Ratings = (traits: V20RatedTrait[]) =>
  traits.reduce((sum, trait) => sum + trait.rating, 0);

function categorySpend(traits: V20RatedTrait[], base: number) {
  return [...new Set(traits.map(({ category }) => category))].map((category) =>
    traits
      .filter((trait) => trait.category === category)
      .reduce((sum, trait) => sum + Math.max(0, trait.rating - base), 0),
  );
}

export function v20CreationBudgets(c: V20Character) {
  return c.characterType === 'vampire'
    ? {
        attributes: [7, 5, 3],
        abilities: [13, 9, 5],
        disciplines: 3,
        backgrounds: 5,
        virtues: 7,
        freebies: 15,
      }
    : {
        attributes: [6, 4, 3],
        abilities: [11, 7, 4],
        disciplines: 2,
        backgrounds: 5,
        virtues: c.characterType === 'revenant' ? 5 : 7,
        freebies: 21,
      };
}

export function v20CreationIssues(c: V20Character) {
  if (c.creation.status === 'manual') return [];
  const budgets = v20CreationBudgets(c);
  const issues: string[] = [];
  if (!c.name.trim()) issues.push('Enter a character name.');
  if (c.characterType === 'vampire' && !c.lineageId)
    issues.push('Choose a clan or bloodline.');
  if (c.characterType === 'revenant' && !c.revenantFamilyId)
    issues.push('Choose a revenant family.');
  if (c.characterType === 'ghoul' && !c.ghoulType)
    issues.push('Choose vassal or independent ghoul.');
  if (!c.roadId) issues.push('Choose Humanity or an approved Path.');
  if (!c.natureId || !c.demeanorId)
    issues.push('Choose both Nature and Demeanor.');
  if (
    !budgets.attributes.every((n) => categorySpend(c.attributes, 1).includes(n))
  )
    issues.push(
      `Attribute categories must spend ${budgets.attributes.join(', ')} dots above their free dots.`,
    );
  if (
    !budgets.abilities.every((n) => categorySpend(c.abilities, 0).includes(n))
  )
    issues.push(
      `Ability categories must spend ${budgets.abilities.join(', ')} dots.`,
    );
  if (
    c.abilities.some(({ rating, origin }) => rating > 3 && origin === 'creator')
  )
    issues.push('Initial Ability allocations cannot exceed 3 before freebies.');
  if (sumV20Ratings(c.disciplines) !== budgets.disciplines)
    issues.push(
      `Allocate exactly ${budgets.disciplines} starting Discipline dots.`,
    );
  if (
    c.characterType === 'vampire' &&
    c.lineageId !== 'v20.lineage.caitiff' &&
    c.disciplines.some(
      ({ name, rating, origin }) =>
        rating > 0 &&
        origin === 'creator' &&
        !inClanDiscipline(c.lineageId, name),
    )
  )
    issues.push(
      'Starting Discipline dots must belong to the selected lineage.',
    );
  if (sumV20Ratings(c.backgrounds) !== 5)
    issues.push('Allocate exactly 5 Background dots.');
  if (sumV20Ratings(c.virtues) !== budgets.virtues + 3)
    issues.push(
      `Virtues begin at 1 each, then receive exactly ${budgets.virtues} additional dots.`,
    );
  if (c.creation.flawCredit > 7)
    issues.push('No more than 7 Flaw points may provide freebie credit.');
  if (c.blood.current > c.blood.maximum)
    issues.push('Current Blood Pool cannot exceed its Generation maximum.');
  if (c.creation.restrictedSelection && !c.creation.matureContent)
    issues.push('Restricted content requires mature-content opt-in.');
  const approved = new Set(c.creation.approvals.map(({ ruleId }) => ruleId));
  return issues.filter((issue) => !approved.has(issue));
}

export function v20LedgerTotals(entries: V20Character['experienceLedger']) {
  return {
    total: entries
      .filter(({ amount }) => amount > 0)
      .reduce((sum, entry) => sum + entry.amount, 0),
    current: entries.reduce((sum, entry) => sum + entry.amount, 0),
  };
}
export function canRefundV20(
  entries: V20Character['experienceLedger'],
  id: string,
) {
  const entry = entries.find((item) => item.id === id);
  return Boolean(
    entry?.kind === 'purchase' &&
    !entries.some(({ reversedEntryId }) => reversedEntryId === id),
  );
}
