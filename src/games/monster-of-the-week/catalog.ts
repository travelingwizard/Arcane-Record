export type MotwDefinitionKind =
  | 'playbook'
  | 'rating-package'
  | 'move'
  | 'gear'
  | 'history'
  | 'improvement'
  | 'team-concept'
  | 'threat-type';
export interface MotwDefinition {
  id: string;
  name: string;
  kind: MotwDefinitionKind;
  summary: string;
  sourceId: 'motw.core' | 'motw.tome';
  page: number;
  playbookId?: string;
  requirements?: string[];
  aliases?: string[];
  verified: boolean;
}
const slug = (x: string) =>
  x
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
const d = (
  sourceId: MotwDefinition['sourceId'],
  kind: MotwDefinitionKind,
  page: number,
  name: string,
  summary: string,
  playbookId?: string,
): MotwDefinition => ({
  id: `${sourceId}.${kind}.${slug(name)}`,
  name,
  kind,
  summary,
  sourceId,
  page,
  playbookId,
  verified: true,
});

const playbookRows = [
  [
    'Chosen',
    30,
    'A destined champion with strong combat tools and supernatural obligations.',
  ],
  [
    'Crooked',
    35,
    'A former criminal whose contacts and troubled past drive the hunt.',
  ],
  ['Divine', 41, 'A durable supernatural agent serving a higher mission.'],
  [
    'Expert',
    46,
    'A prepared occult specialist with deep knowledge and a haven.',
  ],
  [
    'Flake',
    51,
    'A sharp conspiracy investigator who connects hidden patterns.',
  ],
  ['Initiate', 55, 'A trained member of an old monster-hunting sect.'],
  ['Monstrous', 60, 'A supernatural creature using dangerous powers for good.'],
  [
    'Mundane',
    66,
    'An ordinary person whose humanity and relationships save the day.',
  ],
  [
    'Professional',
    70,
    'A capable field agent backed and constrained by an agency.',
  ],
  [
    'Spell-Slinger',
    75,
    'A trained magician specializing in flexible combat magic.',
  ],
  ['Spooky', 81, 'A psychic or magical hunter whose power has a dark side.'],
  [
    'Wronged',
    86,
    'A relentless survivor hunting the monsters that ruined their life.',
  ],
] as const;
const tomeRows = [
  ['Gumshoe', 32, 'A principled private investigator with a personal code.'],
  [
    'Hex',
    40,
    'A volatile practitioner who creates and masters dangerous rotes.',
  ],
  [
    'Pararomantic',
    50,
    'A hunter bound emotionally and mystically to a supernatural Guide.',
  ],
  [
    'Searcher',
    56,
    'A driven investigator transformed by a first uncanny encounter.',
  ],
] as const;
export const playbooks = [
  ...playbookRows.map(([n, p, s]) => d('motw.core', 'playbook', p, n, s)),
  ...tomeRows.map(([n, p, s]) => d('motw.tome', 'playbook', p, n, s)),
];

const ratingsByName: Record<string, number[][]> = {
  Chosen: [
    [2, -1, 1, 2, -1],
    [-1, 2, 1, 2, -1],
    [1, 2, 1, 1, -1],
    [-1, 1, 2, -1, 2],
    [1, 2, -1, -1, 2],
  ],
  Crooked: [
    [1, 1, 2, 0, -1],
    [-1, 1, 1, 2, 0],
    [-1, 2, 2, 0, -1],
    [2, 1, 1, 0, -1],
    [2, 0, 1, -1, 1],
  ],
  Divine: [
    [1, 1, -1, 2, 0],
    [-1, 2, -1, 2, 0],
    [-1, 0, 1, 2, 1],
    [1, 1, 0, 2, -1],
    [-1, 1, 0, 2, 1],
  ],
  Expert: [
    [-1, 1, 2, 1, 0],
    [0, 1, 2, -1, 1],
    [1, -1, 2, 1, 0],
    [-1, 1, 2, 0, 1],
    [-1, 0, 2, -1, 2],
  ],
  Flake: [
    [1, 1, 2, -1, 0],
    [0, 1, 2, -1, 1],
    [1, -1, 2, 1, 0],
    [1, -1, 2, 0, 1],
    [-1, -1, 2, 0, 2],
  ],
  Initiate: [
    [-1, 1, 0, 1, 2],
    [0, 1, 1, -1, 2],
    [-1, 0, -1, 2, 2],
    [1, -1, 1, 0, 2],
    [0, 0, 0, 1, 2],
  ],
  Monstrous: [
    [-1, -1, 0, 2, 3],
    [-1, 1, 1, 0, 3],
    [2, 0, -1, -1, 3],
    [-2, 2, 0, 0, 3],
    [0, -1, 2, -1, 3],
  ],
  Mundane: [
    [2, 1, 0, 1, -1],
    [2, -1, 1, 1, 0],
    [2, 0, -1, 1, 1],
    [2, 0, 1, 1, -1],
    [2, 1, 1, 0, -1],
  ],
  Professional: [
    [0, 2, -1, 2, -1],
    [-1, 2, 1, 1, 0],
    [1, 2, 1, -1, 0],
    [-1, 2, 1, 0, 1],
    [0, 2, 2, -1, -1],
  ],
  'Spell-Slinger': [
    [-1, 1, 1, 0, 2],
    [0, -1, 1, 1, 2],
    [-1, 0, 2, -1, 2],
    [1, 0, 1, -1, 2],
    [0, 0, 1, 0, 2],
  ],
  Spooky: [
    [1, 0, 1, -1, 2],
    [-1, 1, 0, 1, 2],
    [2, 0, -1, -1, 2],
    [0, -1, 1, 1, 2],
    [-1, -1, 2, 0, 2],
  ],
  Wronged: [
    [0, 1, -1, 2, 1],
    [0, 0, 1, 2, 0],
    [1, 0, 1, 2, -1],
    [-1, -1, 0, 2, 2],
    [1, -1, 0, 2, 1],
  ],
  Gumshoe: [
    [2, 0, 1, 0, 0],
    [2, 0, 1, 1, -1],
    [1, 0, 2, 1, -1],
    [1, -1, 2, 0, 1],
    [2, 1, 1, 0, -1],
  ],
  Hex: [
    [2, 0, 0, -1, 2],
    [1, -1, 1, 0, 2],
    [-1, 1, 0, 1, 2],
    [-1, 0, 1, 1, 2],
    [0, 0, 2, -1, 2],
  ],
  Pararomantic: [
    [2, 1, 0, -1, 1],
    [2, -1, 1, 1, 0],
    [2, 2, 0, 0, -1],
    [2, 1, 1, -1, 0],
    [2, 0, 2, -1, 0],
  ],
  Searcher: [
    [0, 1, 1, -1, 2],
    [1, -1, 1, 0, 2],
    [0, -1, 2, 0, 2],
    [0, 1, 2, -1, 1],
    [1, 0, 2, -1, 1],
  ],
};
export const ratingPackages: Record<string, number[][]> = Object.fromEntries(
  playbooks.map((p) => [p.id, ratingsByName[p.name] ?? []]),
);
export const ratingNames = [
  'Charm',
  'Cool',
  'Sharp',
  'Tough',
  'Weird',
] as const;

export const basicMoves = [
  [
    'Kick Some Ass',
    'Tough',
    'Exchange established harm; a strong hit adds a chosen advantage.',
  ],
  [
    'Act Under Pressure',
    'Cool',
    'Do something difficult under pressure; a mixed hit brings a worse outcome, hard choice, or price.',
  ],
  [
    'Help Out',
    'Cool',
    'Grant another Hunter a bonus while risking exposure on a mixed hit.',
  ],
  [
    'Investigate a Mystery',
    'Sharp',
    'Generate hold for specific questions about the mystery.',
  ],
  [
    'Manipulate Someone',
    'Charm',
    'Give someone a reason and determine what it takes for them to act.',
  ],
  [
    'Protect Someone',
    'Tough',
    'Prevent harm to someone else, usually accepting danger yourself.',
  ],
  [
    'Read a Bad Situation',
    'Sharp',
    'Generate hold for tactical questions and gain a bonus when acting on answers.',
  ],
  [
    'Use Magic',
    'Weird',
    'Create a listed magical effect; a mixed hit also introduces a chosen glitch.',
  ],
].map(([n, rating, s]) => ({
  ...d('motw.core', 'move', 101, n, s),
  requirements: [rating],
}));

export const playbookMoveNames: Record<string, string[]> = {
  Chosen: [
    "Destiny's Plaything",
    "I'm Here for a Reason",
    'The Big Entrance',
    'Devastating',
    'Dutiful',
    'Invincible',
    'Resilience',
  ],
  Crooked: [
    'Artifact',
    'Crew',
    'Deal with the Devil',
    'Friends on the Force',
    'Made',
    'Driver',
    'Home Ground',
    'Notorious',
  ],
  Divine: [
    'Boss from Beyond',
    'Angel Wings',
    'What I Need, When I Need It',
    'Smite',
    'Soothe',
    'Lay on Hands',
    'Cast Out Evil',
  ],
  Expert: [
    "I've Read About This Sort of Thing",
    'Often Right',
    'Preparedness',
    "It Wasn't as Bad as It Looked",
    'The Woman (or Man) with the Plan',
    'Dark Past',
  ],
  Flake: [
    'Connect the Dots',
    'Crazy Eyes',
    'See, It All Fits Together',
    'Suspicious Mind',
    'Often Overlooked',
    'Contrary',
    'Net Friends',
    'Sneaky',
  ],
  Initiate: [
    'Ancient Fighting Arts',
    'Mystic',
    'Fortunes',
    'Sacred Oath',
    'Mentor',
    'Apprentice',
    'Helping Hand',
    'That Old Black Magic',
  ],
  Monstrous: [
    'Immortal',
    'Unnatural Appeal',
    'Unholy Strength',
    'Incorporeal',
    'Preternatural Speed',
    'Claws of the Beast',
    'Mental Dominion',
    'Unquenchable Vitality',
    'Dark Negotiator',
    'Flight',
    'Shapeshifter',
    'Something Borrowed',
  ],
  Mundane: [
    'Always the Victim',
    'Panic Button',
    'The Power of Heart',
    'Trust Me',
    'What Could Go Wrong?',
    "Don't Worry, I'll Check It Out",
  ],
  Professional: [
    'Bottle It Up',
    'Unfazeable',
    'Battlefield Awareness',
    'Leave No One Behind',
    'Tactical Genius',
    'Medic',
    'Mobility',
    'Deal with the Agency',
  ],
  'Spell-Slinger': [
    'Tools and Techniques',
    'Advanced Arcane Training',
    'Arcane Reputation',
    "Could've Been Worse",
    'Enchanted Clothing',
    'Forensic Divination',
    'Go Big or Go Home',
    'Not My Fault',
    'Practitioner',
    'Shield Spell',
    'Third Eye',
  ],
  Spooky: [
    'Telepathy',
    'Hex',
    'The Sight',
    'Premonitions',
    'Hunches',
    'Tune In',
    'The Big Whammy',
    'Jinx',
  ],
  Wronged: [
    'I Know My Prey',
    'Berserk',
    'Never Again',
    'What Does Not Kill Me',
    'Fervor',
    'Safety First',
    'DIY Surgery',
    'Tools Matter',
  ],
  Gumshoe: [
    'Occult Confidential',
    'The Naked City',
    'The Postman Always Rings Twice',
    'The Long Goodbye',
    'Jessica Jones Entry',
    'Out of the Past',
    'Asphalt Jungle',
    'Hacker with a Dragon Tattoo',
    'Just One More Thing',
  ],
  Hex: [
    'Bad Luck Charm',
    'Burn Everything',
    'Cast the Bones',
    'Force of Will',
    'Luck of the Damned',
    'Sympathetic Token',
    'This Might Sting',
    'Wise Soul',
  ],
  Pararomantic: [
    'Supernatural Guide',
    'Bonding Time',
    'Dark Desires',
    'The Power of Love',
    'Do as the Supernatural Do',
    'I Am Theirs and They Are Mine',
    'Monster Empathy',
    'Spirit Touched',
  ],
  Searcher: [
    'First Encounter',
    'Cryptid Sighting',
    'Zone of Strangeness',
    'Psychic Event',
    'Higher Power',
    'Strange Dangers',
    'Abduction',
    'Cosmic Insight',
    'Prepared to Defend',
    'Fellow Believer',
    'Guardian',
    'Just Another Day',
    'Network',
    "Ockham's Broadsword",
    "The Things I've Seen",
  ],
};
export const playbookMoves = playbooks.flatMap((playbook) =>
  (playbookMoveNames[playbook.name] ?? []).map((name) =>
    d(
      playbook.sourceId,
      'move',
      playbook.page,
      `${playbook.name}: ${name}`,
      `A ${playbook.name} move. The full result choices remain visible in the owned source and are selected by the table.`,
      playbook.id,
    ),
  ),
);

export const alternativeWeirdMoves = [
  'Empath',
  'Illuminated',
  'No Limits',
  'Past Lives',
  'Sensitive',
  'Telekinesis',
  'Trust Your Gut',
  'Weird Science',
].map((n) =>
  d(
    'motw.tome',
    'move',
    16,
    n,
    'An optional replacement for Use Magic that defines a different expression of Weird.',
  ),
);

export const teamConcepts = [
  [
    'Slayer and Entourage',
    'A central destined hunter supported by friends and specialists.',
  ],
  [
    'Unexplained Cases Team',
    'An agency team assigned to incidents ordinary agents cannot explain.',
  ],
  [
    'The Order',
    'Members of an old organization dedicated to hunting monsters.',
  ],
  [
    'Road-Tripping Hunter Family',
    'A mobile family whose shared trade is hunting monsters.',
  ],
  ['Custom Team', 'Record the group’s own reason for hunting together.'],
].map(([n, s]) => d('motw.core', 'team-concept', 23, n, s));

export const commonImprovements = [
  'Raise a rating within its listed maximum',
  'Take another move from your playbook',
  'Take a move from another playbook',
  'Gain an ally or team',
  'Gain or improve a haven',
  'Mark two basic moves as advanced',
  'Change to a new playbook',
  'Create a second Hunter',
  'Retire the Hunter to safety',
  'Erase one used Luck mark',
].map((n, i) =>
  d(
    'motw.core',
    'improvement',
    i < 5 ? 118 : 120,
    n,
    'A reviewed advancement choice; apply only when it is listed for the Hunter’s playbook.',
  ),
);

export const threatTypes = {
  monster: [
    'Beast',
    'Breeder',
    'Collector',
    'Destroyer',
    'Devourer',
    'Executioner',
    'Parasite',
    'Queen',
    'Sorcerer',
    'Tempter',
    'Torturer',
    'Trickster',
  ],
  minion: [
    'Assassin',
    'Brute',
    'Cultist',
    'Guardian',
    'Right Hand',
    'Plague',
    'Renfield',
    'Scout',
    'Thief',
    'Traitor',
  ],
  bystander: [
    'Busybody',
    'Detective',
    'Gossip',
    'Helper',
    'Innocent',
    'Official',
    'Skeptic',
    'Victim',
    'Witness',
  ],
  location: [
    'Crossroads',
    'Deathtrap',
    'Den',
    'Hub',
    'Lab',
    'Maze',
    'Prison',
    'Wilds',
  ],
  phenomenon: [
    'Alien',
    'Artifact',
    'Biohazard',
    'Bubble',
    'Conspiracy',
    'Corruption',
    'Experiment',
    'Mutagen',
    'Panic',
    'Portal',
    'Teratogen',
    'Zone',
  ],
} as const;

export const allDefinitions = [
  ...playbooks,
  ...basicMoves,
  ...playbookMoves,
  ...alternativeWeirdMoves,
  ...teamConcepts,
  ...commonImprovements,
];
