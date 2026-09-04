import type { CatalogCitation } from '../shared/catalog-sources';

export interface CityThemeDefinition extends CatalogCitation {
  id: string;
  name: string;
  kind: 'mythos' | 'logos' | 'mist' | 'crew' | 'extra';
  summary: string;
  aliases: string[];
  requirements: string[];
}

const core = [
  [
    'Adaptation',
    'mythos',
    82,
    'Versatile legendary powers let you approach different challenges in different ways.',
  ],
  [
    'Bastion',
    'mythos',
    86,
    'Your legend protects you or others against particular forms of harm.',
  ],
  [
    'Divination',
    'mythos',
    90,
    'Discover information through supernatural perception or an otherworldly source.',
  ],
  [
    'Expression',
    'mythos',
    94,
    'Project your legend directly into the world through force, influence, or another overt effect.',
  ],
  [
    'Mobility',
    'mythos',
    98,
    'Move beyond ordinary limits, crossing obstacles or transporting others.',
  ],
  [
    'Relic',
    'mythos',
    102,
    'A legendary object provides powers and creates a relationship with its bearer.',
  ],
  [
    'Subversion',
    'mythos',
    106,
    'Use secrecy, deception, or subtle supernatural interference to get things done.',
  ],
  [
    'Defining Event',
    'logos',
    110,
    'A pivotal past experience still shapes your identity and what you can do.',
  ],
  [
    'Defining Relationship',
    'logos',
    114,
    'An important connection anchors your life, with both support and complications.',
  ],
  [
    'Mission',
    'logos',
    118,
    'A goal or obligation drives your actions and the resources you bring to them.',
  ],
  [
    'Personality',
    'logos',
    122,
    'Your temperament and personal style provide useful strengths and recognizable limitations.',
  ],
  [
    'Possessions',
    'logos',
    126,
    'Define the mundane property and resources that matter most to your life.',
  ],
  [
    'Routine',
    'logos',
    130,
    'Daily work or recurring activities build familiar skills, contacts, and habits.',
  ],
  [
    'Training',
    'logos',
    134,
    'Study and practice provide a focused set of learned capabilities.',
  ],
  [
    'Crew',
    'crew',
    146,
    'Describe how the group supports one another, its shared resources, and its collective weaknesses.',
  ],
  [
    'Ally',
    'extra',
    284,
    'Record a supporting individual or group as an extra theme, not a replacement for personal identity.',
  ],
  [
    'Base of Operations',
    'extra',
    288,
    'Track the useful facilities and vulnerabilities of a place that supports your activities.',
  ],
  [
    'Ride',
    'extra',
    292,
    'Give a vehicle or mount its own capabilities and limitations as an extra theme.',
  ],
] as const;
const supplement = [
  [
    'Conjuration',
    'mythos',
    12,
    'Create self-operating manifestations of your legend; these are not independent Rifts.',
  ],
  [
    'Destiny',
    'mythos',
    16,
    'A foretold fate, duty, or curse gives your story direction and supernatural leverage.',
  ],
  [
    'Enclave',
    'mythos',
    20,
    'A place where legend breaks through the City provides access to a mythical domain.',
  ],
  [
    'Familiar',
    'mythos',
    24,
    'An animal Rift connects you to legendary powers through companionship.',
  ],
  [
    'Struggle',
    'logos',
    28,
    'Choose a hardship your character experiences as central to their life and how they cope with it.',
  ],
  [
    'Turf',
    'logos',
    32,
    'Control of a domain brings local influence, resources, and responsibilities.',
  ],
  [
    'Shrouding',
    'mist',
    238,
    'Use the basic Gatekeeper art to conceal breaches and strengthen the Mist around a target.',
  ],
  [
    'Advanced Art',
    'mist',
    242,
    'Focus on a specialized Mist discipline beyond basic Shrouding.',
  ],
  [
    'Unit',
    'mist',
    246,
    'Represent the Gatekeepers under your command and their collective capabilities.',
  ],
] as const;

export const cityThemeCatalog: readonly CityThemeDefinition[] = [
  ...core.map((row) => ({ row, sourceId: 'com.players-guide' })),
  ...supplement.map((row) => ({ row, sourceId: 'com.shadows-showdowns' })),
].map(({ row: [name, kind, page, summary], sourceId }) => ({
  id: `com.theme.${name.toLowerCase().replaceAll(' ', '-')}`,
  name,
  kind,
  page,
  summary,
  sourceId,
  aliases: [],
  requirements:
    kind === 'mist'
      ? ['Gatekeeper theme; review the specific art and theme requirements.']
      : kind === 'extra'
        ? ['Extra theme; not an ordinary starting personal theme.']
        : [],
  verification: 'citation-only',
}));
