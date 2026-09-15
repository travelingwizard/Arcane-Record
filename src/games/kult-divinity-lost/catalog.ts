import type { KultCharacter } from './schema';

export type KultSuggestionCategory =
  | 'archetype'
  | 'occupation'
  | 'appearance'
  | 'dark-secret'
  | 'disadvantage'
  | 'advantage'
  | 'relation'
  | 'gear';

export interface KultSuggestion {
  id: string;
  name: string;
  category: KultSuggestionCategory;
  summary: string;
  archetypeIds: string[];
  sheetTypes: KultCharacter['sheetType'][];
  mature: boolean;
  contentNote: string | null;
  sourceId: 'kult.core' | 'kult.players-guide';
  page: number;
  verified: true;
}

const awareNames = [
  'Academic',
  'Agent',
  'Artist',
  'Avenger',
  'Broken',
  'Careerist',
  'Criminal',
  'Cursed',
  'Deceiver',
  'Descendant',
  'Detective',
  'Doll',
  'Drifter',
  'Fixer',
  'Occultist',
  'Prophet',
  'Ronin',
  'Scientist',
  'Seeker',
  'Veteran',
] as const;

const slug = (value: string) =>
  value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
const awareArchetypes: KultSuggestion[] = awareNames.map((name, index) => ({
  id: `kult.players-guide.archetype.${slug(name)}`,
  name,
  category: 'archetype',
  summary: `An Aware framework centered on the ${name.toLowerCase()}'s pressures, capabilities, and ties to the hidden world.`,
  archetypeIds: [],
  sheetTypes: ['general', 'aware'],
  mature: false,
  contentNote: null,
  sourceId: 'kult.players-guide',
  page: 14 + index * 2,
  verified: true,
}));

const enlightenedNames = [
  ['Abomination', 352],
  ['Death Magician', 354],
  ['Disciple', 356],
  ['Revenant', 358],
] as const;
const enlightenedArchetypes: KultSuggestion[] = enlightenedNames.map(
  ([name, page]) => ({
    id: `kult.core.archetype.${slug(name)}`,
    name,
    category: 'archetype',
    summary: `An Enlightened framework whose supernatural nature brings exceptional abilities and binding limitations.`,
    archetypeIds: [],
    sheetTypes: ['general', 'enlightened'],
    mature: true,
    contentNote:
      'Supernatural transformation, mortality, or disturbing themes.',
    sourceId: 'kult.core',
    page,
    verified: true,
  }),
);

const sleeper: KultSuggestion = {
  id: 'kult.players-guide.archetype.sleeper',
  name: 'Sleeper',
  category: 'archetype',
  summary:
    'A person still protected by the Illusion, with a buried truth that can gradually force awareness.',
  archetypeIds: [],
  sheetTypes: ['general', 'sleeper'],
  mature: false,
  contentNote: null,
  sourceId: 'kult.players-guide',
  page: 54,
  verified: true,
};

const compatibility: Record<string, string[]> = {
  'Lost Identity': ['agent'],
  Nightmares: ['agent', 'broken', 'cursed', 'veteran'],
  Obsession: ['agent', 'academic', 'detective', 'scientist', 'seeker'],
  Rival: ['agent', 'careerist', 'criminal', 'detective'],
  Stalker: ['agent', 'artist', 'doll'],
  Wanted: ['agent', 'criminal', 'drifter', 'ronin'],
  Moles: ['agent'],
  Burglar: ['agent', 'criminal'],
  Analyst: ['agent', 'academic', 'detective', 'scientist'],
  'Explosives Expert': ['agent', 'criminal', 'veteran'],
  Tracer: ['agent', 'detective'],
  'Quick Thinker': ['agent', 'fixer'],
  'Field Agent': ['agent'],
  'Endure Trauma': ['agent', 'broken', 'veteran'],
  'Academic Network': ['academic'],
  'Street Contacts': ['criminal', 'drifter', 'fixer', 'ronin'],
  Intuitive: ['artist', 'broken', 'occultist', 'prophet'],
  'Magical Intuition': ['broken', 'cursed', 'occultist', 'prophet'],
  'Sixth Sense': ['broken', 'cursed', 'occultist', 'seeker'],
  Wayfinder: ['broken', 'drifter', 'seeker'],
  'Influential Friends': ['careerist', 'fixer'],
  'Network of Contacts': ['careerist', 'fixer'],
  Notorious: ['careerist', 'criminal', 'artist'],
  Opportunist: ['careerist', 'deceiver'],
  Puppeteer: ['careerist', 'deceiver'],
};

const shared = (
  category: KultSuggestionCategory,
  page: number,
  names: Array<string | [string, boolean, string]>,
): KultSuggestion[] =>
  names.map((entry) => {
    const [name, mature, note] =
      typeof entry === 'string' ? [entry, false, ''] : entry;
    return {
      id: `kult.players-guide.${category}.${slug(name)}`,
      name,
      category,
      summary: `A source-listed ${category.replace('-', ' ')} prompt to adapt to the character's history and present circumstances.`,
      archetypeIds: (compatibility[name] ?? []).map(
        (archetype) => `kult.players-guide.archetype.${archetype}`,
      ),
      sheetTypes: ['general', 'sleeper', 'aware', 'enlightened'],
      mature,
      contentNote: note || null,
      sourceId: 'kult.players-guide',
      page,
      verified: true,
    };
  });

export const kultSuggestions: KultSuggestion[] = [
  sleeper,
  ...awareArchetypes,
  ...enlightenedArchetypes,
  ...shared('dark-secret', 57, [
    'Chosen',
    'Curse',
    'Family Secret',
    'Forbidden Knowledge',
    'Guardian',
    'Guilty of Crime',
    'Occult Experience',
    'Pact with Dark Powers',
    'Returned from the Other Side',
    'Strange Disappearance',
    ['Victim of Crime', true, 'Victimization and possible violence.'],
    ['Victim of Medical Experiments', true, 'Medical abuse and bodily harm.'],
  ]),
  ...shared('disadvantage', 60, [
    'Addiction',
    'Bad Reputation',
    'Cursed',
    'Dark Secret',
    'Depression',
    'Greedy',
    'Haunted',
    'Liar',
    'Lost Identity',
    'Marked',
    'Mental Compulsion',
    'Nemesis',
    'Nightmares',
    'Obsession',
    'Persecutors',
    'Rationalist',
    'Rival',
    'Stalker',
    'Wanted',
    ['Schizophrenia', true, 'Mental illness and distressing perceptions.'],
  ]),
  ...shared('advantage', 76, [
    'Academic Network',
    'Analyst',
    'At Any Cost',
    'Awe-inspiring',
    'Burglar',
    'Contagious Insanity',
    'Daredevil',
    'Endure Trauma',
    'Enhanced Awareness',
    'Explosives Expert',
    'Field Agent',
    'Influential Friends',
    'Intuitive',
    'Magical Intuition',
    'Moles',
    'Network of Contacts',
    'Notorious',
    'Opportunist',
    'Puppeteer',
    'Quick Thinker',
    'Sixth Sense',
    'Street Contacts',
    'Tracer',
    'Wayfinder',
  ]),
  ...shared('relation', 15, [
    'Old friend',
    'Colleague',
    'Confidant',
    'Informant',
    'Lover',
    'Rival connection',
    'Shared ordeal',
  ]),
  ...shared('occupation', 14, [
    'Academic',
    'Agent',
    'Artist',
    'Consultant',
    'Criminal',
    'Detective',
    'Doctor',
    'Journalist',
    'Occultist',
    'Researcher',
    'Scientist',
    'Veteran',
  ]),
  ...shared('appearance', 15, [
    'Distinctive clothes',
    'Memorable face',
    'Expressive eyes',
    'Recognizable posture',
    'Visible scar or mark',
  ]),
  ...shared('gear', 16, [
    'Professional tools',
    'Personal protection',
    'Research materials',
    'Communication equipment',
    'Keepsake tied to a Dark Secret',
  ]),
];

export const kultArchetypes = kultSuggestions.filter(
  ({ category }) => category === 'archetype',
);

export const kultAdvancementOptions: Record<
  KultCharacter['sheetType'],
  Array<{ id: string; label: string; page: number }>
> = {
  general: [],
  sleeper: [
    {
      id: 'remember-dark-secret',
      label: 'Remember another detail about the Dark Secret',
      page: 55,
    },
    { id: 'awaken-aware', label: 'Awaken into an Aware Archetype', page: 55 },
  ],
  aware: [
    {
      id: 'active-plus-one',
      label: 'Increase an active Attribute within the listed limit',
      page: 122,
    },
    {
      id: 'passive-plus-one',
      label: 'Increase a passive Attribute within the listed limit',
      page: 122,
    },
    {
      id: 'archetype-advantage',
      label: 'Choose another Advantage from the Archetype',
      page: 122,
    },
    {
      id: 'aware-any-advantage',
      label: 'Choose an eligible Advantage after five advances',
      page: 122,
    },
    {
      id: 'change-aware-archetype',
      label: 'Change to another Aware Archetype after five advances',
      page: 122,
    },
    {
      id: 'become-enlightened',
      label: 'Advance to an Enlightened Archetype after ten advances',
      page: 122,
    },
  ],
  enlightened: [
    {
      id: 'attribute-plus-one',
      label: 'Increase an eligible Attribute',
      page: 353,
    },
    {
      id: 'new-ability',
      label: 'Choose an eligible Enlightened Ability',
      page: 353,
    },
    {
      id: 'change-enlightened-archetype',
      label: 'Change to another Enlightened Archetype',
      page: 353,
    },
    {
      id: 'begin-awakening',
      label: 'Start or continue the journey toward Awakening',
      page: 353,
    },
  ],
};
