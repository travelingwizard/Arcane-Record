import type { ExaltedAbilityId } from './definitions';

export const exaltedCharacterTypes = [
  'solar',
  'dragon-blooded',
  'lunar',
  'abyssal',
  'sidereal',
  'alchemical',
  'fair-folk',
] as const;

export type ExaltedCharacterType = (typeof exaltedCharacterTypes)[number];

export type ExaltedSourceId =
  | 'core'
  | 'dragon-blooded'
  | 'lunars'
  | 'abyssals'
  | 'sidereals'
  | 'autochthonians'
  | 'fair-folk'
  | 'players-guide'
  | 'storytellers-companion'
  | 'book-of-three-circles'
  | 'book-of-bone-and-ebony'
  | 'blood-and-salt'
  | 'games-of-divinity';

export type ExaltedCapability =
  | 'anima'
  | 'combos'
  | 'limit'
  | 'sorcery'
  | 'necromancy'
  | 'shapeshifting'
  | 'resonance'
  | 'astrology'
  | 'installed-charms'
  | 'shaping';

export interface ExaltedCreationBudget {
  attributes: readonly [number, number, number];
  abilities: number;
  backgrounds: number;
  virtues: number;
  charms: number;
  bonusPoints: number;
}

export interface ExaltedCharacterProfile {
  id: ExaltedCharacterType;
  name: string;
  shortName: string;
  description: string;
  governingSourceId: ExaltedSourceId;
  identityLabel: string;
  organizationLabel?: string;
  capabilities: readonly ExaltedCapability[];
  creationBudget: ExaltedCreationBudget | null;
  abilityGroups?: readonly {
    id: string;
    label: string;
    abilityIds: readonly ExaltedAbilityId[];
  }[];
  verification: 'verified' | 'inventory-required';
}

export const exaltedCharacterProfiles = {
  solar: {
    id: 'solar',
    name: 'Solar Exalted',
    shortName: 'Solar',
    description: 'Caste-bound champions shaped by the Unconquered Sun.',
    governingSourceId: 'core',
    identityLabel: 'Caste',
    capabilities: ['anima', 'combos', 'limit', 'sorcery'],
    creationBudget: {
      attributes: [8, 6, 4],
      abilities: 35,
      backgrounds: 7,
      virtues: 5,
      charms: 10,
      bonusPoints: 15,
    },
    verification: 'verified',
  },
  'dragon-blooded': {
    id: 'dragon-blooded',
    name: 'Dragon-Blooded',
    shortName: 'Dragon-Blooded',
    description: 'Elemental Exalted defined by Aspect, family, and lineage.',
    governingSourceId: 'dragon-blooded',
    identityLabel: 'Aspect',
    organizationLabel: 'House',
    capabilities: ['anima', 'combos', 'sorcery'],
    creationBudget: {
      attributes: [7, 6, 4],
      abilities: 25,
      backgrounds: 12,
      virtues: 5,
      charms: 7,
      bonusPoints: 15,
    },
    verification: 'verified',
  },
  lunar: {
    id: 'lunar',
    name: 'Lunar Exalted',
    shortName: 'Lunar',
    description:
      'Chosen of Luna whose identity includes shapechanging and a Tell.',
    governingSourceId: 'lunars',
    identityLabel: 'Caste',
    capabilities: ['anima', 'combos', 'limit', 'sorcery', 'shapeshifting'],
    creationBudget: {
      attributes: [9, 7, 5],
      abilities: 25,
      backgrounds: 7,
      virtues: 5,
      charms: 9,
      bonusPoints: 15,
    },
    verification: 'verified',
  },
  abyssal: {
    id: 'abyssal',
    name: 'Abyssal Exalted',
    shortName: 'Abyssal',
    description: 'Deathknights whose powers, liege, and Resonance shape play.',
    governingSourceId: 'abyssals',
    identityLabel: 'Caste',
    organizationLabel: 'Deathlord',
    capabilities: ['anima', 'combos', 'resonance', 'necromancy'],
    creationBudget: {
      attributes: [8, 6, 4],
      abilities: 25,
      backgrounds: 13,
      virtues: 5,
      charms: 10,
      bonusPoints: 15,
    },
    verification: 'verified',
  },
  sidereal: {
    id: 'sidereal',
    name: 'Sidereal Exalted',
    shortName: 'Sidereal',
    description:
      'Chosen of the Maidens who work through astrology and destiny.',
    governingSourceId: 'sidereals',
    identityLabel: 'Caste',
    organizationLabel: 'Division',
    capabilities: ['anima', 'combos', 'sorcery', 'astrology'],
    creationBudget: {
      attributes: [8, 6, 4],
      abilities: 35,
      backgrounds: 15,
      virtues: 5,
      charms: 12,
      bonusPoints: 18,
    },
    verification: 'verified',
  },
  alchemical: {
    id: 'alchemical',
    name: 'Alchemical Exalted',
    shortName: 'Alchemical',
    description: 'Champions of Autochthonia who install and manage Charms.',
    governingSourceId: 'autochthonians',
    identityLabel: 'Caste',
    capabilities: ['anima', 'installed-charms'],
    creationBudget: {
      attributes: [9, 6, 4],
      abilities: 23,
      backgrounds: 10,
      virtues: 5,
      charms: 8,
      bonusPoints: 15,
    },
    verification: 'verified',
  },
  'fair-folk': {
    id: 'fair-folk',
    name: 'Fair Folk',
    shortName: 'Fair Folk',
    description:
      'Raksha characters defined by Graces, shaping, oaths, and feeding.',
    governingSourceId: 'fair-folk',
    identityLabel: 'Caste',
    capabilities: ['shaping'],
    creationBudget: {
      attributes: [10, 7, 4],
      abilities: 25,
      backgrounds: 10,
      virtues: 6,
      charms: 8,
      bonusPoints: 15,
    },
    verification: 'verified',
  },
} as const satisfies Record<ExaltedCharacterType, ExaltedCharacterProfile>;

export function getExaltedCharacterProfile(
  type: ExaltedCharacterType,
): ExaltedCharacterProfile {
  return exaltedCharacterProfiles[type];
}

export function isExaltedCharacterType(
  value: unknown,
): value is ExaltedCharacterType {
  return (
    typeof value === 'string' &&
    (exaltedCharacterTypes as readonly string[]).includes(value)
  );
}

export function createDefaultFamilyState(type: ExaltedCharacterType) {
  switch (type) {
    case 'solar':
      return { type: 'solar' as const };
    case 'dragon-blooded':
      return { type: 'dragon-blooded' as const, animaFlux: 0 };
    case 'lunar':
      return {
        type: 'lunar' as const,
        tell: '',
        tattooed: false,
        heartBloodForms: [] as { id: string; name: string; notes: string }[],
        activeFormId: null,
      };
    case 'abyssal':
      return { type: 'abyssal' as const, resonance: 0, liege: '', whispers: 0 };
    case 'sidereal':
      return {
        type: 'sidereal' as const,
        division: '',
        paradox: 0,
        colleges: {},
        destinies: [] as {
          id: string;
          name: string;
          active: boolean;
          notes: string;
        }[],
      };
    case 'alchemical':
      return {
        type: 'alchemical' as const,
        clarity: 0,
        installedCharmIds: [] as string[],
        charmSlots: 0,
      };
    case 'fair-folk':
      return {
        type: 'fair-folk' as const,
        graces: {},
        feedingNotes: '',
        activeAssumption: '',
        oaths: [] as {
          id: string;
          name: string;
          state: string;
          notes: string;
        }[],
      };
  }
}
