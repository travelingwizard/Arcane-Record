import {
  exaltedAbilities,
  exaltedAttributeGroups,
  type ExaltedAbilityId,
  type ExaltedAttributeGroupId,
} from './definitions';
import type { ExaltedCharacterType, ExaltedSourceId } from './profiles';
import type { Exalted1eCharacter } from './schema';
import { getExaltedFamilyPowers } from './reference/family-powers';

export interface ExaltedRuleCitation {
  sourceId: ExaltedSourceId;
  printedPage: number;
  pdfPage: number;
}

export interface ExaltedCasteDefinition {
  id: string;
  name: string;
  associatedAbilityIds?: readonly ExaltedAbilityId[];
  associatedAttributeIds?: readonly string[];
  citation: ExaltedRuleCitation;
}

export interface ExaltedFamilyCreationRules {
  type: ExaltedCharacterType;
  attributeBudgets: readonly [number, number, number];
  attributeBase: number;
  abilityDots: number;
  abilityInitialCap: number;
  favoredCount: number;
  favoredMinimum: number;
  backgrounds: number;
  backgroundInitialCap: number;
  virtues: number;
  virtueInitialCap: number;
  charms: number;
  requiredAssociatedCharms: number;
  bonusPoints: number;
  startingEssence: number;
  citation: ExaltedRuleCitation;
  castes: readonly ExaltedCasteDefinition[];
}

const abilityCastes = (
  sourceId: ExaltedSourceId,
  printedPage: number,
  pdfPage: number,
  entries: readonly [string, string, readonly ExaltedAbilityId[]][],
): readonly ExaltedCasteDefinition[] =>
  entries.map(([id, name, associatedAbilityIds]) => ({
    id,
    name,
    associatedAbilityIds,
    citation: { sourceId, printedPage, pdfPage },
  }));

export const exaltedFamilyCreationRules: Record<
  ExaltedCharacterType,
  ExaltedFamilyCreationRules
> = {
  solar: {
    type: 'solar',
    attributeBudgets: [8, 6, 4],
    attributeBase: 1,
    abilityDots: 35,
    abilityInitialCap: 3,
    favoredCount: 5,
    favoredMinimum: 1,
    backgrounds: 7,
    backgroundInitialCap: 3,
    virtues: 5,
    virtueInitialCap: 3,
    charms: 10,
    requiredAssociatedCharms: 5,
    bonusPoints: 15,
    startingEssence: 2,
    citation: { sourceId: 'core', printedPage: 104, pdfPage: 107 },
    castes: abilityCastes('core', 105, 108, [
      ['dawn', 'Dawn', ['archery', 'brawl', 'martialArts', 'melee', 'thrown']],
      [
        'zenith',
        'Zenith',
        ['endurance', 'performance', 'presence', 'resistance', 'survival'],
      ],
      [
        'twilight',
        'Twilight',
        ['craft', 'investigation', 'lore', 'medicine', 'occult'],
      ],
      [
        'night',
        'Night',
        ['athletics', 'awareness', 'dodge', 'larceny', 'stealth'],
      ],
      [
        'eclipse',
        'Eclipse',
        ['bureaucracy', 'linguistics', 'ride', 'sail', 'socialize'],
      ],
    ]),
  },
  'dragon-blooded': {
    type: 'dragon-blooded',
    attributeBudgets: [7, 6, 4],
    attributeBase: 1,
    abilityDots: 25,
    abilityInitialCap: 3,
    favoredCount: 5,
    favoredMinimum: 1,
    backgrounds: 12,
    backgroundInitialCap: 3,
    virtues: 5,
    virtueInitialCap: 3,
    charms: 7,
    requiredAssociatedCharms: 4,
    bonusPoints: 15,
    startingEssence: 2,
    citation: {
      sourceId: 'dragon-blooded',
      printedPage: 97,
      pdfPage: 100,
    },
    castes: abilityCastes('dragon-blooded', 97, 100, [
      ['air', 'Air', ['linguistics', 'lore', 'occult', 'stealth', 'thrown']],
      [
        'earth',
        'Earth',
        ['awareness', 'craft', 'endurance', 'martialArts', 'resistance'],
      ],
      [
        'fire',
        'Fire',
        ['athletics', 'dodge', 'melee', 'presence', 'socialize'],
      ],
      [
        'water',
        'Water',
        ['brawl', 'bureaucracy', 'investigation', 'larceny', 'sail'],
      ],
      [
        'wood',
        'Wood',
        ['archery', 'medicine', 'performance', 'ride', 'survival'],
      ],
    ]),
  },
  lunar: {
    type: 'lunar',
    attributeBudgets: [9, 7, 5],
    attributeBase: 1,
    abilityDots: 25,
    abilityInitialCap: 3,
    favoredCount: 5,
    favoredMinimum: 1,
    backgrounds: 7,
    backgroundInitialCap: 3,
    virtues: 5,
    virtueInitialCap: 3,
    charms: 9,
    requiredAssociatedCharms: 4,
    bonusPoints: 15,
    startingEssence: 2,
    citation: { sourceId: 'lunars', printedPage: 92, pdfPage: 95 },
    castes: [
      ['full-moon', 'Full Moon', ['strength', 'dexterity', 'stamina']],
      [
        'changing-moon',
        'Changing Moon',
        ['charisma', 'manipulation', 'appearance'],
      ],
      ['no-moon', 'No Moon', ['perception', 'intelligence', 'wits']],
      ['casteless', 'Casteless', []],
    ].map(([id, name, associatedAttributeIds]) => ({
      id: id as string,
      name: name as string,
      associatedAttributeIds: associatedAttributeIds as string[],
      citation: { sourceId: 'lunars', printedPage: 92, pdfPage: 95 },
    })),
  },
  abyssal: {
    type: 'abyssal',
    attributeBudgets: [8, 6, 4],
    attributeBase: 1,
    abilityDots: 25,
    abilityInitialCap: 3,
    favoredCount: 5,
    favoredMinimum: 1,
    backgrounds: 13,
    backgroundInitialCap: 3,
    virtues: 5,
    virtueInitialCap: 3,
    charms: 10,
    requiredAssociatedCharms: 5,
    bonusPoints: 15,
    startingEssence: 2,
    citation: { sourceId: 'abyssals', printedPage: 124, pdfPage: 125 },
    castes: abilityCastes('abyssals', 124, 125, [
      ['dusk', 'Dusk', ['archery', 'brawl', 'martialArts', 'melee', 'thrown']],
      [
        'midnight',
        'Midnight',
        ['endurance', 'performance', 'presence', 'resistance', 'survival'],
      ],
      [
        'daybreak',
        'Daybreak',
        ['craft', 'investigation', 'lore', 'medicine', 'occult'],
      ],
      ['day', 'Day', ['athletics', 'awareness', 'dodge', 'larceny', 'stealth']],
      [
        'moonshadow',
        'Moonshadow',
        ['bureaucracy', 'linguistics', 'ride', 'sail', 'socialize'],
      ],
    ]),
  },
  sidereal: {
    type: 'sidereal',
    attributeBudgets: [8, 6, 4],
    attributeBase: 1,
    abilityDots: 35,
    abilityInitialCap: 3,
    favoredCount: 4,
    favoredMinimum: 1,
    backgrounds: 15,
    backgroundInitialCap: 3,
    virtues: 5,
    virtueInitialCap: 3,
    charms: 12,
    requiredAssociatedCharms: 5,
    bonusPoints: 18,
    startingEssence: 2,
    citation: { sourceId: 'sidereals', printedPage: 100, pdfPage: 103 },
    castes: abilityCastes('sidereals', 101, 104, [
      [
        'journeys',
        'Chosen of Journeys',
        ['endurance', 'ride', 'sail', 'survival', 'thrown'],
      ],
      [
        'serenity',
        'Chosen of Serenity',
        ['craft', 'dodge', 'linguistics', 'performance', 'socialize'],
      ],
      [
        'battles',
        'Chosen of Battles',
        ['archery', 'brawl', 'melee', 'presence', 'resistance'],
      ],
      [
        'secrets',
        'Chosen of Secrets',
        ['investigation', 'larceny', 'lore', 'occult', 'stealth'],
      ],
      [
        'endings',
        'Chosen of Endings',
        ['athletics', 'awareness', 'bureaucracy', 'martialArts', 'medicine'],
      ],
    ]),
  },
  alchemical: {
    type: 'alchemical',
    attributeBudgets: [9, 6, 4],
    attributeBase: 0,
    abilityDots: 23,
    abilityInitialCap: 3,
    favoredCount: 3,
    favoredMinimum: 0,
    backgrounds: 10,
    backgroundInitialCap: 3,
    virtues: 5,
    virtueInitialCap: 3,
    charms: 8,
    requiredAssociatedCharms: 4,
    bonusPoints: 15,
    startingEssence: 2,
    citation: {
      sourceId: 'autochthonians',
      printedPage: 63,
      pdfPage: 64,
    },
    castes: [
      ['orichalcum', 'Orichalcum', ['strength', 'charisma', 'intelligence']],
      ['moonsilver', 'Moonsilver', ['dexterity', 'appearance', 'wits']],
      ['jade', 'Jade', ['stamina', 'charisma', 'wits']],
      ['starmetal', 'Starmetal', ['dexterity', 'manipulation', 'intelligence']],
      ['soulsteel', 'Soulsteel', ['stamina', 'manipulation', 'perception']],
    ].map(([id, name, associatedAttributeIds]) => ({
      id: id as string,
      name: name as string,
      associatedAttributeIds: associatedAttributeIds as string[],
      citation: {
        sourceId: 'autochthonians' as const,
        printedPage: 63,
        pdfPage: 64,
      },
    })),
  },
  'fair-folk': {
    type: 'fair-folk',
    attributeBudgets: [10, 7, 4],
    attributeBase: 3,
    abilityDots: 25,
    abilityInitialCap: 3,
    favoredCount: 3,
    favoredMinimum: 0,
    backgrounds: 10,
    backgroundInitialCap: 3,
    virtues: 6,
    virtueInitialCap: 5,
    charms: 8,
    requiredAssociatedCharms: 5,
    bonusPoints: 15,
    startingEssence: 2,
    citation: { sourceId: 'fair-folk', printedPage: 99, pdfPage: 100 },
    castes: abilityCastes('fair-folk', 99, 100, [
      [
        'diplomat',
        'Diplomat',
        ['linguistics', 'occult', 'ride', 'socialize', 'thrown'],
      ],
      [
        'entertainer',
        'Entertainer',
        ['investigation', 'larceny', 'medicine', 'performance', 'stealth'],
      ],
      [
        'warrior',
        'Warrior',
        ['archery', 'athletics', 'brawl', 'melee', 'presence'],
      ],
      [
        'worker',
        'Worker',
        ['bureaucracy', 'craft', 'endurance', 'lore', 'martialArts'],
      ],
    ]),
  },
};

export function getExaltedCreationRules(
  type: ExaltedCharacterType,
  variant = 'standard',
): ExaltedFamilyCreationRules {
  const base = exaltedFamilyCreationRules[type];
  if (type === 'lunar' && variant === 'casteless') {
    return { ...base, attributeBudgets: [8, 6, 4], charms: 6 };
  }
  if (type === 'abyssal' && variant === 'fugitive') {
    return { ...base, backgrounds: 5 };
  }
  if (type === 'sidereal' && variant === 'ronin') {
    return {
      ...base,
      abilityDots: 25,
      backgrounds: 7,
      charms: 8,
      requiredAssociatedCharms: 0,
    };
  }
  if (type === 'fair-folk' && ['common', 'heroic-common'].includes(variant)) {
    return {
      ...base,
      attributeBase: 0,
      favoredCount: 1,
      backgrounds: 0,
      bonusPoints: variant === 'heroic-common' ? 33 : 15,
    };
  }
  return base;
}

export function getExaltedDerivedValues(character: Exalted1eCharacter) {
  const virtues = Object.values(character.virtues).sort((a, b) => b - a);
  const willpower = (virtues[0] ?? 0) + (virtues[1] ?? 0);
  const essence = character.essence.rating;
  const highestVirtue = virtues[0] ?? 0;
  const virtueTotal = virtues.reduce((sum, rating) => sum + rating, 0);
  switch (character.sheetType) {
    case 'lunar':
      return {
        willpower,
        personalEssence: essence + willpower * 2,
        peripheralEssence: essence * 4 + willpower * 2 + highestVirtue * 4,
      };
    case 'abyssal':
      return {
        willpower,
        personalEssence: essence * 3 + willpower,
        peripheralEssence: essence * 7 + willpower + virtueTotal,
      };
    case 'sidereal':
      return {
        willpower,
        personalEssence: essence * 2 + willpower,
        peripheralEssence: essence * 6 + willpower + virtueTotal,
      };
    case 'alchemical':
      return {
        willpower,
        personalEssence: essence * 3 + willpower,
        peripheralEssence: essence * 5 + willpower * 3 + highestVirtue * 2,
      };
    case 'fair-folk':
      return { willpower, personalEssence: essence * 10, peripheralEssence: 0 };
    default:
      return {
        willpower,
        personalEssence: essence * 3 + willpower,
        peripheralEssence: essence * 7 + willpower + virtueTotal,
      };
  }
}

export interface ExaltedCreationIssue {
  ruleId: string;
  message: string;
}

export function validateExaltedCreation(character: Exalted1eCharacter) {
  const rules = getExaltedCreationRules(
    character.sheetType,
    character.creation.rulesVariant,
  );
  const issues: ExaltedCreationIssue[] = [];
  if (!character.identity.familyIdentity.trim()) {
    issues.push({
      ruleId: 'family-identity',
      message: `Choose a ${character.sheetType === 'dragon-blooded' ? 'Aspect' : 'Caste'}.`,
    });
  }
  const selectedCaste = rules.castes.find(
    ({ id }) => id === character.identity.familyIdentity,
  );
  if (!selectedCaste) {
    issues.push({
      ruleId: 'family-identity-valid',
      message: 'The selected family identity is not in the verified catalog.',
    });
  }
  if (character.sheetType === 'alchemical' && selectedCaste) {
    const casteIds = new Set(selectedCaste.associatedAttributeIds ?? []);
    const favoredIds = new Set(character.creation.favoredAttributeIds);
    if (
      favoredIds.size !== 3 ||
      [...favoredIds].some((id) => casteIds.has(id))
    ) {
      issues.push({
        ruleId: 'favored-attributes',
        message:
          'Choose three Favored Attributes distinct from the three Caste Attributes.',
      });
    }
    const ratings = Object.values(character.attributes).flatMap((group) =>
      Object.entries(group),
    );
    const casteTotal = ratings.reduce(
      (sum, [id, rating]) => sum + (casteIds.has(id) ? rating : 0),
      0,
    );
    const favoredTotal = ratings.reduce(
      (sum, [id, rating]) => sum + (favoredIds.has(id) ? rating : 0),
      0,
    );
    const otherTotal = ratings.reduce(
      (sum, [id, rating]) =>
        sum + (!casteIds.has(id) && !favoredIds.has(id) ? rating : 0),
      0,
    );
    if (casteTotal !== 9 || favoredTotal !== 6 || otherTotal !== 4) {
      issues.push({
        ruleId: 'attribute-budget',
        message: `Allocate Alchemical Attributes as Caste 9, Favored 6, remaining 4 (currently ${casteTotal}/${favoredTotal}/${otherTotal}).`,
      });
    }
  } else {
    const categoryAdditions = Object.values(character.attributes)
      .map((group) =>
        Object.values(group).reduce(
          (sum, rating) => sum + Math.max(0, rating - rules.attributeBase),
          0,
        ),
      )
      .sort((a, b) => b - a);
    const expected = [...rules.attributeBudgets].sort((a, b) => b - a);
    if (categoryAdditions.some((value, index) => value !== expected[index])) {
      issues.push({
        ruleId: 'attribute-budget',
        message: `Allocate Attribute categories as ${rules.attributeBudgets.join('/')}; current additions are ${categoryAdditions.join('/')}.`,
      });
    }
  }
  const abilityTotal = exaltedAbilities.reduce(
    (sum, { id }) => sum + character.abilities[id],
    0,
  );
  if (abilityTotal !== rules.abilityDots) {
    issues.push({
      ruleId: 'ability-budget',
      message: `Allocate exactly ${rules.abilityDots} initial Ability dots (currently ${abilityTotal}).`,
    });
  }
  const overCapAbility = exaltedAbilities.find(
    ({ id }) => character.abilities[id] > rules.abilityInitialCap,
  );
  if (overCapAbility) {
    issues.push({
      ruleId: 'ability-initial-cap',
      message: `${overCapAbility.label} exceeds the verified initial cap of ${rules.abilityInitialCap}.`,
    });
  }
  if (
    character.sheetType !== 'alchemical' &&
    character.favoredAbilities.length !== rules.favoredCount
  ) {
    issues.push({
      ruleId: 'favored-count',
      message: `Choose exactly ${rules.favoredCount} Favored Abilities.`,
    });
  }
  if (
    character.sheetType === 'fair-folk' &&
    character.creation.rulesVariant === 'standard' &&
    (!character.identity.organization ||
      character.identity.organization === character.identity.familyIdentity ||
      !rules.castes.some(({ id }) => id === character.identity.organization))
  ) {
    issues.push({
      ruleId: 'second-caste',
      message: 'A noble raksha must choose a distinct second Caste.',
    });
  }
  const backgroundTotal = character.backgrounds.reduce(
    (sum, background) => sum + background.rating,
    0,
  );
  if (backgroundTotal !== rules.backgrounds) {
    issues.push({
      ruleId: 'background-budget',
      message: `Allocate exactly ${rules.backgrounds} Background dots (currently ${backgroundTotal}).`,
    });
  }
  const overCapBackground = character.backgrounds.find(
    ({ rating }) => rating > rules.backgroundInitialCap,
  );
  if (overCapBackground) {
    issues.push({
      ruleId: 'background-initial-cap',
      message: `A Background exceeds the verified initial cap of ${rules.backgroundInitialCap}.`,
    });
  }
  const virtueDots = Object.values(character.virtues).reduce(
    (sum, rating) => sum + Math.max(0, rating - 1),
    0,
  );
  if (virtueDots !== rules.virtues) {
    issues.push({
      ruleId: 'virtue-budget',
      message: `Allocate exactly ${rules.virtues} Virtue dots above the free first dots (currently ${virtueDots}).`,
    });
  }
  const overCapVirtue = Object.entries(character.virtues).find(
    ([, rating]) => rating > rules.virtueInitialCap,
  );
  if (overCapVirtue) {
    issues.push({
      ruleId: 'virtue-initial-cap',
      message: `${overCapVirtue[0]} exceeds the verified initial cap of ${rules.virtueInitialCap}.`,
    });
  }
  if (character.powers.charms.length !== rules.charms) {
    issues.push({
      ruleId: 'charm-budget',
      message: `Choose exactly ${rules.charms} starting Charms or equivalent powers (currently ${character.powers.charms.length}).`,
    });
  }
  const verifiedPowers = new Map(
    getExaltedFamilyPowers(character.sheetType).map((power) => [
      power.id,
      power,
    ]),
  );
  const selectedPowerIds = new Set(
    character.powers.charms.map(({ definitionId }) => definitionId),
  );
  for (const selected of character.powers.charms) {
    const definition = verifiedPowers.get(selected.definitionId);
    if (!definition) continue;
    if (
      definition.minimumEssence != null &&
      character.essence.rating < definition.minimumEssence
    ) {
      issues.push({
        ruleId: `power-essence:${definition.id}`,
        message: `${definition.name} requires Essence ${definition.minimumEssence}.`,
      });
    }
    const missingPrerequisite = definition.prerequisiteCharms.find(
      (prerequisiteId) => !selectedPowerIds.has(prerequisiteId),
    );
    if (missingPrerequisite) {
      const prerequisite = verifiedPowers.get(missingPrerequisite);
      issues.push({
        ruleId: `power-prerequisite:${definition.id}:${missingPrerequisite}`,
        message: `${definition.name} requires ${prerequisite?.name ?? missingPrerequisite}.`,
      });
    }
  }
  const approved = new Set(
    character.creation.approvals.map(({ ruleId }) => ruleId),
  );
  return issues.map((issue) => ({
    ...issue,
    approved: approved.has(issue.ruleId),
  }));
}

export type ExaltedAdvancementTarget =
  | 'attribute'
  | 'ability'
  | 'virtue'
  | 'willpower'
  | 'essence'
  | 'charm'
  | 'terrestrial-spell'
  | 'celestial-spell'
  | 'martial-arts-charm'
  | 'sidereal-martial-arts-charm'
  | 'astrological-college-new'
  | 'astrological-college-increase'
  | 'charm-slot-general'
  | 'charm-slot-dedicated';

export function quoteExaltedAdvancement(
  type: ExaltedCharacterType,
  target: ExaltedAdvancementTarget,
  currentRating: number,
  associated = false,
) {
  if (type === 'solar' || type === 'abyssal') {
    const costs: Partial<Record<ExaltedAdvancementTarget, number>> = {
      attribute: currentRating * 4,
      ability: currentRating * 2 - (associated ? 1 : 0),
      virtue: currentRating * 3,
      willpower: currentRating * 2,
      essence: currentRating * 8,
      charm: associated ? 8 : 10,
      'terrestrial-spell': associated ? 8 : 10,
      'celestial-spell': associated ? 8 : 10,
    };
    const cost = costs[target];
    return cost == null
      ? null
      : {
          cost,
          citation:
            type === 'abyssal'
              ? {
                  sourceId: 'abyssals' as const,
                  printedPage: 282,
                  pdfPage: 283,
                }
              : {
                  sourceId: 'core' as const,
                  printedPage: 270,
                  pdfPage: 273,
                },
        };
  }
  if (type === 'lunar') {
    const costs: Partial<Record<ExaltedAdvancementTarget, number>> = {
      attribute: currentRating * 4 - (associated ? 1 : 0),
      ability: currentRating * 2 - (associated ? 1 : 0),
      virtue: currentRating * 3,
      willpower: currentRating * 2,
      essence: currentRating * 9,
      charm: associated ? 12 : 15,
      'terrestrial-spell': associated ? 10 : 12,
      'celestial-spell': associated ? 12 : 15,
    };
    const cost = costs[target];
    return cost == null
      ? null
      : {
          cost,
          citation: {
            sourceId: 'lunars' as const,
            printedPage: 251,
            pdfPage: 254,
          },
        };
  }
  if (type === 'sidereal') {
    const costs: Partial<Record<ExaltedAdvancementTarget, number>> = {
      charm: associated ? 9 : 11,
      'martial-arts-charm': associated ? 8 : 10,
      'sidereal-martial-arts-charm': associated ? 10 : 12,
      'astrological-college-new': 5,
      'astrological-college-increase': currentRating * 3,
    };
    const cost = costs[target];
    return cost == null
      ? null
      : {
          cost,
          citation: {
            sourceId: 'sidereals' as const,
            printedPage: 265,
            pdfPage: 268,
          },
        };
  }
  if (type === 'alchemical') {
    const costs: Partial<Record<ExaltedAdvancementTarget, number>> = {
      attribute: currentRating * 4 - (associated ? 1 : 0),
      essence: currentRating * 9,
      charm: 6,
      'charm-slot-general': 12,
      'charm-slot-dedicated': 10,
    };
    const cost = costs[target];
    return cost == null
      ? null
      : {
          cost,
          citation: {
            sourceId: 'autochthonians' as const,
            printedPage: 64,
            pdfPage: 65,
          },
        };
  }
  if (type === 'fair-folk') {
    const costs: Partial<Record<ExaltedAdvancementTarget, number>> = {
      attribute: currentRating * 4,
      ability: currentRating * (associated ? 2 : 3),
      virtue: currentRating * 3,
      willpower: currentRating * 2,
      essence: currentRating * 8,
      charm: 6,
    };
    const cost = costs[target];
    return cost == null
      ? null
      : {
          cost,
          citation: {
            sourceId: 'fair-folk' as const,
            printedPage: 321,
            pdfPage: 322,
          },
        };
  }
  return null;
}

export function getAttributeCategoryTotals(character: Exalted1eCharacter) {
  return Object.fromEntries(
    exaltedAttributeGroups.map((group) => [
      group.id,
      Object.values(character.attributes[group.id]).reduce(
        (sum, rating) => sum + rating,
        0,
      ),
    ]),
  ) as Record<ExaltedAttributeGroupId, number>;
}
