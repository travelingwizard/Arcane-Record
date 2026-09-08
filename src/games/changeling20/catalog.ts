export type C20CatalogKind =
  'kith' | 'house' | 'legacy' | 'background' | 'art' | 'realm' | 'threshold';

export interface C20CatalogEntry {
  id: string;
  kind: C20CatalogKind;
  name: string;
  summary: string;
  sourceId: string;
  page: number;
  aliases: string[];
  compatibility: 'c20' | 'legacy-reconciled' | 'reference-only';
  verification: 'rules-reviewed' | 'citation-only';
}

const core = (
  kind: C20CatalogKind,
  page: number,
  names: readonly string[],
  summary: (name: string) => string,
): C20CatalogEntry[] =>
  names.map((name) => ({
    id: `c20.${kind}.${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}`,
    kind,
    name,
    summary: summary(name),
    sourceId: 'c20.core',
    page,
    aliases: [],
    compatibility: 'c20',
    verification: 'rules-reviewed',
  }));

export const c20Kiths = core(
  'kith',
  87,
  [
    'Boggan',
    'Clurichaun',
    'Eshu',
    'Nocker',
    'Piskie',
    'Pooka',
    'Redcap',
    'Satyr',
    'Selkie',
    'Arcadian Sidhe',
    'Autumn Sidhe',
    'Sluagh',
    'Troll',
  ],
  (name) =>
    `${name} is one of the thirteen core Kithain peoples; its Birthrights, Frailty, affinity, and outlook shape play.`,
);

export const c20Houses = core(
  'house',
  119,
  [
    'Aesin',
    'Ailil',
    'Balor',
    'Beaumayn',
    'Danaan',
    'Daireann',
    'Dougal',
    'Eiluned',
    'Fiona',
    'Gwydion',
    'Leanhaun',
    'Liam',
    'Scathach',
    'Varich',
  ],
  (name) =>
    `House ${name} grants a formal political identity, inherited Boon, and Flaw; Title is still required for nobility.`,
);

export const c20Legacies = [
  ...core(
    'legacy',
    156,
    [
      'Bumpkin',
      'Courtier',
      'Crafter',
      'Dandy',
      'Hermit',
      'Orchid',
      'Paladin',
      'Panderer',
      'Regent',
      'Sage',
      'Saint',
      'Squire',
      'Troubadour',
      'Wayfarer',
    ],
    (name) => `${name} is a Seelie personality guide with a Quest and Ban.`,
  ),
  ...core(
    'legacy',
    156,
    [
      'Beast',
      'Fatalist',
      'Fool',
      'Grotesque',
      'Knave',
      'Outlaw',
      'Pandora',
      'Peacock',
      'Rake',
      'Riddler',
      'Ringleader',
      'Rogue',
      'Savage',
      'Wretch',
    ],
    (name) => `${name} is an Unseelie personality guide with a Quest and Ban.`,
  ),
];

export const c20Backgrounds = core(
  'background',
  168,
  [
    'Chimera',
    'Contacts',
    'Dreamers',
    'Holdings',
    'Mentor',
    'Remembrance',
    'Resources',
    'Retinue',
    'Title',
    'Treasure',
  ],
  (name) =>
    `${name} records a lasting advantage, relationship, possession, or place. It is bought during creation but gained through story after play begins.`,
);

export const c20Arts = core(
  'art',
  197,
  [
    'Autumn',
    'Chicanery',
    'Chronos',
    'Contract',
    "Dragon's Ire",
    'Legerdemain',
    'Metamorphosis',
    'Naming',
    'Oneiromancy',
    'Primal',
    'Pyretics',
    'Skycraft',
    'Soothsay',
    'Sovereign',
    'Spring',
    'Summer',
    'Wayfare',
    'Winter',
  ],
  (name) =>
    `${name} is an Art: a family of cantrips defining what the changeling's magic can accomplish.`,
);

export const c20Realms = core(
  'realm',
  232,
  ['Actor', 'Fae', 'Nature', 'Prop', 'Scene', 'Time'],
  (name) =>
    `${name} determines which subjects or circumstances a cantrip can affect.`,
);

export const c20Thresholds = core(
  'threshold',
  147,
  [
    'Inspire Creativity',
    'Create Hope',
    'Create Love',
    'Create Calm',
    'Foster Trust',
    'Help Those in Need',
    'Foster Dreams',
    'Exhaust Creativity',
    'Destroy Hope',
    'Destroy Love',
    'Create Anger',
    'Break Trust',
    'Exploit Dependence',
    'Destroy Illusions',
  ],
  (name) =>
    `${name} describes the character's preferred path to an epiphany; its fictional use is resolved at the table.`,
);

export const changeling20Catalog = [
  ...c20Kiths,
  ...c20Houses,
  ...c20Legacies,
  ...c20Backgrounds,
  ...c20Arts,
  ...c20Realms,
  ...c20Thresholds,
] as const;

export function catalogEntry(id: string | null) {
  return changeling20Catalog.find((entry) => entry.id === id) ?? null;
}
