export const MAGE_SYSTEM_ID = 'mage-m20' as const;
export const MAGE_SCHEMA_VERSION = 4 as const;

export const identityFields = [
  { id: 'name', label: 'Name' },
  { id: 'player', label: 'Player' },
  { id: 'chronicle', label: 'Chronicle' },
  { id: 'nature', label: 'Nature' },
  { id: 'demeanor', label: 'Demeanor' },
  { id: 'essence', label: 'Essence' },
  { id: 'affiliation', label: 'Affiliation' },
  { id: 'sect', label: 'Sect' },
  { id: 'concept', label: 'Concept' },
] as const;

export type IdentityFieldId = (typeof identityFields)[number]['id'];

export const attributeGroups = [
  {
    id: 'physical',
    label: 'Physical',
    traits: [
      { id: 'strength', label: 'Strength' },
      { id: 'dexterity', label: 'Dexterity' },
      { id: 'stamina', label: 'Stamina' },
    ],
  },
  {
    id: 'social',
    label: 'Social',
    traits: [
      { id: 'charisma', label: 'Charisma' },
      { id: 'manipulation', label: 'Manipulation' },
      { id: 'appearance', label: 'Appearance' },
    ],
  },
  {
    id: 'mental',
    label: 'Mental',
    traits: [
      { id: 'perception', label: 'Perception' },
      { id: 'intelligence', label: 'Intelligence' },
      { id: 'wits', label: 'Wits' },
    ],
  },
] as const;

export type AttributeGroupId = (typeof attributeGroups)[number]['id'];
export type AttributeId =
  (typeof attributeGroups)[number]['traits'][number]['id'];

export const abilityGroups = [
  {
    id: 'talents',
    label: 'Talents',
    traits: [
      { id: 'alertness', label: 'Alertness' },
      { id: 'art', label: 'Art' },
      { id: 'athletics', label: 'Athletics' },
      { id: 'awareness', label: 'Awareness' },
      { id: 'brawl', label: 'Brawl' },
      { id: 'empathy', label: 'Empathy' },
      { id: 'expression', label: 'Expression' },
      { id: 'intimidation', label: 'Intimidation' },
      { id: 'leadership', label: 'Leadership' },
      { id: 'streetwise', label: 'Streetwise' },
      { id: 'subterfuge', label: 'Subterfuge' },
    ],
  },
  {
    id: 'skills',
    label: 'Skills',
    traits: [
      { id: 'crafts', label: 'Crafts' },
      { id: 'drive', label: 'Drive' },
      { id: 'etiquette', label: 'Etiquette' },
      { id: 'firearms', label: 'Firearms' },
      { id: 'martialArts', label: 'Martial Arts' },
      { id: 'meditation', label: 'Meditation' },
      { id: 'melee', label: 'Melee' },
      { id: 'research', label: 'Research' },
      { id: 'stealth', label: 'Stealth' },
      { id: 'survival', label: 'Survival' },
      { id: 'technology', label: 'Technology' },
    ],
  },
  {
    id: 'knowledges',
    label: 'Knowledges',
    traits: [
      { id: 'academics', label: 'Academics' },
      { id: 'computer', label: 'Computer' },
      { id: 'cosmology', label: 'Cosmology' },
      { id: 'enigmas', label: 'Enigmas' },
      { id: 'esoterica', label: 'Esoterica' },
      { id: 'investigation', label: 'Investigation' },
      { id: 'law', label: 'Law' },
      { id: 'medicine', label: 'Medicine' },
      { id: 'occult', label: 'Occult' },
      { id: 'politics', label: 'Politics' },
      { id: 'science', label: 'Science' },
    ],
  },
] as const;

export type AbilityGroupId = (typeof abilityGroups)[number]['id'];
export type AbilityId = (typeof abilityGroups)[number]['traits'][number]['id'];

export const enlightenmentTraits = [
  { id: 'arete', label: 'Arete', min: 1 },
  { id: 'willpower', label: 'Willpower', min: 1 },
  { id: 'quintessence', label: 'Quintessence', min: 0 },
  { id: 'paradox', label: 'Paradox', min: 0 },
] as const;

export type EnlightenmentId = (typeof enlightenmentTraits)[number]['id'];

export const healthLevels = [
  { id: 'bruised', label: 'Bruised', penalty: '0' },
  { id: 'hurt', label: 'Hurt', penalty: '−1' },
  { id: 'injured', label: 'Injured', penalty: '−1' },
  { id: 'wounded', label: 'Wounded', penalty: '−2' },
  { id: 'mauled', label: 'Mauled', penalty: '−2' },
  { id: 'crippled', label: 'Crippled', penalty: '−5' },
  { id: 'incapacitated', label: 'Incapacitated', penalty: '—' },
] as const;

export const spheres = [
  { id: 'correspondence', label: 'Correspondence' },
  { id: 'entropy', label: 'Entropy' },
  { id: 'forces', label: 'Forces' },
  { id: 'life', label: 'Life' },
  { id: 'matter', label: 'Matter' },
  { id: 'mind', label: 'Mind' },
  { id: 'prime', label: 'Prime' },
  { id: 'spirit', label: 'Spirit' },
  { id: 'time', label: 'Time' },
] as const;

export type SphereId = (typeof spheres)[number]['id'];

export type SphereSortMode =
  'name-asc' | 'name-desc' | 'rating-desc' | 'rating-asc';

export interface SphereDisplayEntry {
  id: SphereId;
  label: string;
  rating: number;
  isAffinity: boolean;
}

export function sortSpheres(
  ratings: Record<SphereId, number>,
  affinitySphere: SphereId | null,
  mode: SphereSortMode,
): SphereDisplayEntry[] {
  return spheres
    .map(({ id, label }) => ({
      id,
      label,
      rating: ratings[id],
      isAffinity: affinitySphere === id,
    }))
    .sort((left, right) => {
      if (mode === 'name-asc') {
        return left.label.localeCompare(right.label);
      }
      if (mode === 'name-desc') {
        return right.label.localeCompare(left.label);
      }

      const ratingDelta =
        mode === 'rating-desc'
          ? right.rating - left.rating
          : left.rating - right.rating;
      if (ratingDelta !== 0) {
        return ratingDelta;
      }
      if (left.isAffinity !== right.isAffinity) {
        return left.isAffinity ? -1 : 1;
      }
      return left.label.localeCompare(right.label);
    });
}
