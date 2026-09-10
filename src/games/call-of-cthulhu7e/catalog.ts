export const handbookSource = {
  id: 'coc7e.investigators-handbook',
  title: "Call of Cthulhu 7th Edition Investigator's Handbook",
  required: true,
  classification: 'official-player' as const,
};

export type OccupationFormula =
  | 'edu4'
  | 'edu2-app2'
  | 'edu2-dex2'
  | 'edu2-pow2'
  | 'edu2-str2'
  | 'edu2-choice-app-dex-str-pow2';
export interface Coc7eOccupation {
  id: string;
  name: string;
  formula: OccupationFormula;
  creditRating: readonly [number, number];
  skills: readonly string[];
  summary: string;
  page: number;
  sourceId: string;
  verified: boolean;
}
const occupation = (
  slug: string,
  name: string,
  formula: OccupationFormula,
  creditRating: readonly [number, number],
  skills: readonly string[],
  page: number,
): Coc7eOccupation => ({
  id: `coc7e.handbook.occupation.${slug}`,
  name,
  formula,
  creditRating,
  skills,
  summary: `${name} connects an investigator's professional training, income, and core occupational skills.`,
  page,
  sourceId: handbookSource.id,
  verified: true,
});

export const coc7eOccupations = [
  occupation(
    'accountant',
    'Accountant',
    'edu4',
    [30, 70],
    ['accounting', 'law', 'library-use', 'listen', 'persuade', 'spot-hidden'],
    70,
  ),
  occupation(
    'actor',
    'Actor',
    'edu2-app2',
    [9, 70],
    ['art-craft-acting', 'disguise', 'fighting-brawl', 'history', 'psychology'],
    71,
  ),
  occupation(
    'antiquarian',
    'Antiquarian',
    'edu4',
    [30, 70],
    [
      'appraise',
      'art-craft',
      'history',
      'library-use',
      'other-language',
      'spot-hidden',
    ],
    72,
  ),
  occupation(
    'archaeologist',
    'Archaeologist',
    'edu4',
    [10, 40],
    [
      'appraise',
      'archaeology',
      'history',
      'library-use',
      'other-language',
      'spot-hidden',
    ],
    72,
  ),
  occupation(
    'artist',
    'Artist',
    'edu2-pow2',
    [9, 50],
    [
      'art-craft',
      'history',
      'natural-world',
      'other-language',
      'psychology',
      'spot-hidden',
    ],
    73,
  ),
  occupation(
    'athlete',
    'Athlete',
    'edu2-dex2',
    [9, 70],
    ['climb', 'fighting-brawl', 'jump', 'ride', 'swim', 'throw'],
    74,
  ),
  occupation(
    'author',
    'Author',
    'edu4',
    [9, 30],
    [
      'art-craft-writing',
      'history',
      'library-use',
      'natural-world',
      'other-language',
      'psychology',
    ],
    75,
  ),
  occupation(
    'clergy',
    'Clergy',
    'edu4',
    [9, 60],
    [
      'accounting',
      'history',
      'library-use',
      'listen',
      'other-language',
      'psychology',
    ],
    77,
  ),
  occupation(
    'criminal',
    'Criminal',
    'edu2-choice-app-dex-str-pow2',
    [5, 65],
    [
      'appraise',
      'disguise',
      'fast-talk',
      'fighting-brawl',
      'locksmith',
      'stealth',
    ],
    78,
  ),
  occupation(
    'dilettante',
    'Dilettante',
    'edu2-app2',
    [50, 99],
    ['art-craft', 'firearms', 'other-language', 'ride'],
    80,
  ),
  occupation(
    'doctor',
    'Doctor of Medicine',
    'edu4',
    [30, 80],
    [
      'first-aid',
      'medicine',
      'other-language',
      'psychology',
      'science-biology',
      'science-pharmacy',
    ],
    81,
  ),
  occupation(
    'engineer',
    'Engineer',
    'edu4',
    [30, 60],
    [
      'art-craft-technical-drawing',
      'electrical-repair',
      'library-use',
      'mechanical-repair',
      'operate-heavy-machinery',
      'science',
    ],
    82,
  ),
  occupation(
    'entertainer',
    'Entertainer',
    'edu2-app2',
    [9, 70],
    ['art-craft', 'disguise', 'fast-talk', 'listen', 'psychology'],
    83,
  ),
  occupation(
    'journalist',
    'Journalist',
    'edu4',
    [9, 30],
    [
      'art-craft-photography',
      'history',
      'library-use',
      'listen',
      'persuade',
      'psychology',
    ],
    84,
  ),
  occupation(
    'lawyer',
    'Lawyer',
    'edu4',
    [30, 80],
    ['accounting', 'law', 'library-use', 'persuade', 'psychology'],
    85,
  ),
  occupation(
    'librarian',
    'Librarian',
    'edu4',
    [9, 35],
    ['accounting', 'history', 'library-use', 'other-language'],
    86,
  ),
  occupation(
    'military-officer',
    'Military Officer',
    'edu2-choice-app-dex-str-pow2',
    [20, 70],
    ['accounting', 'firearms', 'navigate', 'psychology', 'survival'],
    87,
  ),
  occupation(
    'musician',
    'Musician',
    'edu2-dex2',
    [9, 30],
    ['art-craft-instrument', 'listen', 'psychology'],
    88,
  ),
  occupation(
    'nurse',
    'Nurse',
    'edu4',
    [9, 30],
    [
      'first-aid',
      'listen',
      'medicine',
      'psychology',
      'science-biology',
      'science-chemistry',
    ],
    89,
  ),
  occupation(
    'police-detective',
    'Police Detective',
    'edu2-dex2',
    [20, 50],
    [
      'art-craft-acting',
      'disguise',
      'firearms',
      'law',
      'listen',
      'psychology',
      'spot-hidden',
    ],
    90,
  ),
  occupation(
    'private-investigator',
    'Private Investigator',
    'edu2-dex2',
    [9, 30],
    [
      'art-craft-photography',
      'disguise',
      'law',
      'library-use',
      'psychology',
      'spot-hidden',
      'stealth',
    ],
    91,
  ),
  occupation(
    'professor',
    'Professor',
    'edu4',
    [20, 70],
    ['library-use', 'other-language', 'psychology'],
    92,
  ),
  occupation(
    'soldier',
    'Soldier',
    'edu2-choice-app-dex-str-pow2',
    [9, 30],
    [
      'climb',
      'dodge',
      'fighting',
      'firearms',
      'first-aid',
      'stealth',
      'survival',
    ],
    93,
  ),
  occupation(
    'tribe-member',
    'Tribe Member',
    'edu2-str2',
    [0, 15],
    [
      'climb',
      'fighting',
      'listen',
      'natural-world',
      'spot-hidden',
      'survival',
      'swim',
    ],
    94,
  ),
] as const;

export interface Coc7eSkillDefinition {
  id: string;
  name: string;
  base: number;
  family: string | null;
  page: number;
}
const skill = (
  slug: string,
  name: string,
  base: number,
  page: number,
  family: string | null = null,
): Coc7eSkillDefinition => ({
  id: `coc7e.handbook.skill.${slug}`,
  name,
  base,
  family,
  page,
});
export const coc7eSkills = [
  skill('accounting', 'Accounting', 5, 97),
  skill('anthropology', 'Anthropology', 1, 98),
  skill('appraise', 'Appraise', 5, 98),
  skill('archaeology', 'Archaeology', 1, 99),
  skill('art-craft', 'Art/Craft', 5, 100, 'art-craft'),
  skill('charm', 'Charm', 15, 103),
  skill('climb', 'Climb', 20, 103),
  skill('credit-rating', 'Credit Rating', 0, 104),
  skill('cthulhu-mythos', 'Cthulhu Mythos', 0, 105),
  skill('disguise', 'Disguise', 5, 106),
  skill('dodge', 'Dodge', 0, 106),
  skill('drive-auto', 'Drive Auto', 20, 107),
  skill('electrical-repair', 'Electrical Repair', 10, 108),
  skill('fast-talk', 'Fast Talk', 5, 108),
  skill('fighting', 'Fighting', 25, 109, 'fighting'),
  skill('firearms', 'Firearms', 20, 111, 'firearms'),
  skill('first-aid', 'First Aid', 30, 113),
  skill('history', 'History', 5, 114),
  skill('intimidate', 'Intimidate', 15, 114),
  skill('jump', 'Jump', 20, 115),
  skill('language-other', 'Language (Other)', 1, 116, 'language'),
  skill('language-own', 'Language (Own)', 0, 116, 'language'),
  skill('law', 'Law', 5, 117),
  skill('library-use', 'Library Use', 20, 117),
  skill('listen', 'Listen', 20, 118),
  skill('locksmith', 'Locksmith', 1, 118),
  skill('mechanical-repair', 'Mechanical Repair', 10, 119),
  skill('medicine', 'Medicine', 1, 119),
  skill('natural-world', 'Natural World', 10, 120),
  skill('navigate', 'Navigate', 10, 120),
  skill('occult', 'Occult', 5, 121),
  skill('operate-heavy-machinery', 'Operate Heavy Machinery', 1, 121),
  skill('persuade', 'Persuade', 10, 122),
  skill('pilot', 'Pilot', 1, 122),
  skill('psychoanalysis', 'Psychoanalysis', 1, 123),
  skill('psychology', 'Psychology', 10, 123),
  skill('ride', 'Ride', 5, 124),
  skill('science', 'Science', 1, 124, 'science'),
  skill('sleight-of-hand', 'Sleight of Hand', 10, 126),
  skill('spot-hidden', 'Spot Hidden', 25, 126),
  skill('stealth', 'Stealth', 20, 127),
  skill('survival', 'Survival', 10, 127, 'survival'),
  skill('swim', 'Swim', 20, 128),
  skill('throw', 'Throw', 20, 128),
  skill('track', 'Track', 10, 129),
] as const;

export const coc7eExperiencePackages = [
  {
    id: 'war',
    name: 'War Experience',
    page: 62,
    minimumAge: 18,
    skillPoints: 70,
  },
  {
    id: 'police',
    name: 'Police Experience',
    page: 63,
    minimumAge: 25,
    skillPoints: 60,
  },
  {
    id: 'organized-crime',
    name: 'Organized Crime Experience',
    page: 64,
    minimumAge: 20,
    skillPoints: 60,
  },
  {
    id: 'medical',
    name: 'Medical Experience',
    page: 64,
    minimumAge: 30,
    skillPoints: 60,
  },
  {
    id: 'mythos',
    name: 'Mythos Experience',
    page: 65,
    minimumAge: 0,
    skillPoints: 0,
  },
] as const;

export const coc7eOrganizations = [
  { id: 'wentworth', name: 'The Wentworth Club', page: 216 },
  {
    id: 'society-exploration',
    name: 'Society for the Exploration of the Unexplained',
    page: 218,
  },
  { id: 'slayers', name: 'The Slayers Club', page: 220 },
] as const;

export const coc7eCatalogManifest = {
  sourceId: handbookSource.id,
  occupations: coc7eOccupations.length,
  skills: coc7eSkills.length,
  experiencePackages: coc7eExperiencePackages.length,
  organizations: coc7eOrganizations.length,
  exclusions: [
    'Keeper-only Mythos catalogs',
    'example investigators',
    'artwork and maps',
  ],
};
