export interface BitdDefinition {
  id: string;
  name: string;
  kind: string;
  summary: string;
  sourceId: string;
  page: number;
  requirements?: string[];
}
const d = (
  kind: string,
  page: number,
  name: string,
  summary: string,
  requirements?: string[],
): BitdDefinition => ({
  id: `bitd.core.${kind}.${name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`,
  name,
  kind,
  summary,
  sourceId: 'bitd.core',
  page,
  requirements,
});
export const playbooks = [
  [
    'Cutter',
    61,
    'A dangerous close-quarters fighter and intimidating presence.',
  ],
  ['Hound', 65, 'A deadly hunter, tracker, and sharpshooter.'],
  ['Leech', 69, 'A saboteur, alchemist, and technical expert.'],
  ['Lurk', 73, 'A stealthy infiltrator and burglar.'],
  ['Slide', 77, 'A subtle manipulator, con artist, and spy.'],
  ['Spider', 81, 'A calculating mastermind and coordinator.'],
  ['Whisper', 85, 'An arcane adept who interacts with the ghost field.'],
].map(([n, p, s]) => d('playbook', p as number, n as string, s as string));
export const actionNames = [
  'Hunt',
  'Study',
  'Survey',
  'Tinker',
  'Finesse',
  'Prowl',
  'Skirmish',
  'Wreck',
  'Attune',
  'Command',
  'Consort',
  'Sway',
];
export const actions = actionNames.map((x, i) =>
  d(
    'action',
    58,
    x,
    `A ${i < 4 ? 'Insight' : i < 8 ? 'Prowess' : 'Resolve'} action; fictional applicability remains a table decision.`,
  ),
);
export const playbookAbilities: Record<string, string[]> = {
  Cutter: [
    'Battleborn',
    'Bodyguard',
    'Ghost Fighter',
    'Leader',
    'Mule',
    'Not to Be Trifled With',
    'Savage',
    'Vigorous',
  ],
  Hound: [
    'Sharpshooter',
    'Focused',
    'Ghost Hunter',
    'Scout',
    'Survivor',
    'Tough as Nails',
    'Vengeful',
    'Veteran',
  ],
  Leech: [
    'Alchemist',
    'Artificer',
    'Analyst',
    'Fortitude',
    'Ghost Ward',
    'Physicker',
    'Saboteur',
    'Venomous',
  ],
  Lurk: [
    'Infiltrator',
    'Ambush',
    'Daredevil',
    'The Devil’s Footsteps',
    'Expertise',
    'Ghost Veil',
    'Reflexes',
    'Shadow',
  ],
  Slide: [
    "Rook's Gambit",
    'Cloak & Dagger',
    'A Little Something on the Side',
    'Ghost Voice',
    'Like Looking into a Mirror',
    'Mesmerism',
    'Subterfuge',
    'Trust in Me',
  ],
  Spider: [
    'Foresight',
    'Calculating',
    'Connected',
    'Functioning Vice',
    'Ghost Contract',
    'Jail Bird',
    'Mastermind',
    'Weaving the Web',
  ],
  Whisper: [
    'Compel',
    'Ghost Mind',
    'Iron Will',
    'Occultist',
    'Ritual',
    'Strange Methods',
    'Tempest',
    'Warded',
  ],
};
export const vices = [
  'Faith',
  'Gambling',
  'Luxury',
  'Obligation',
  'Pleasure',
  'Stupor',
  'Weird',
].map((x) =>
  d(
    'vice',
    54,
    x,
    'A source of relief and trouble, tied to a specific vice purveyor.',
  ),
);
export const backgrounds = [
  'Academic',
  'Labor',
  'Law',
  'Trade',
  'Military',
  'Noble',
  'Underworld',
].map((x) =>
  d(
    'background',
    53,
    x,
    'A formative history that informs contacts and fictional position.',
  ),
);
export const heritages = [
  'Akoros',
  'The Dagger Isles',
  'Iruvia',
  'Severos',
  'Skovlan',
  'Tycheros',
].map((x) =>
  d(
    'heritage',
    53,
    x,
    'A cultural origin recorded without prescribing the character’s identity.',
  ),
);
export const standardItems = [
  'A Blade or Two',
  'Throwing Knives',
  'A Pistol',
  'A Large Weapon',
  'An Unusual Weapon',
  'Armor',
  'Heavy Armor',
  'Burglary Gear',
  'Climbing Gear',
  'Arcane Implements',
  'Documents',
  'Subterfuge Supplies',
  'Demolition Tools',
  'Tinkering Tools',
  'Lantern',
  'Spiritbane Charm',
].map((x) =>
  d('item', 88, x, 'A standard loadout item selected during a score.'),
);
export const crewTypes = [
  ['Assassins', 100, 'Murderers for hire.'],
  ['Bravos', 104, 'Mercenaries, thugs, and killers.'],
  ['Cult', 108, 'Acolytes serving a deity or forgotten power.'],
  ['Hawkers', 112, 'Vice dealers and illicit merchants.'],
  ['Shadows', 116, 'Thieves, spies, and saboteurs.'],
  ['Smugglers', 120, 'Suppliers and transporters of illicit goods.'],
].map(([n, p, s]) => d('crew-type', p as number, n as string, s as string));
export const reputations = [
  'Ambitious',
  'Brutal',
  'Daring',
  'Honorable',
  'Professional',
  'Savvy',
  'Subtle',
  'Strange',
].map((x) =>
  d('reputation', 93, x, 'How the underworld most readily describes the crew.'),
);
export const crewAbilities: Record<string, string[]> = {
  Assassins: [
    'Deadly',
    'Crow’s Veil',
    'Emberdeath',
    'No Traces',
    'Patron',
    'Predators',
  ],
  Bravos: [
    'Dangerous',
    'Blood Brothers',
    'Door Kickers',
    'Fiends',
    'Forged in the Fire',
    'War Dogs',
  ],
  Cult: [
    'Chosen',
    'Anointed',
    'Bound in Darkness',
    'Conviction',
    'Glory Incarnate',
    'Zealotry',
  ],
  Hawkers: [
    'Silver Tongues',
    'Accord',
    'The Good Stuff',
    'Ghost Market',
    'High Society',
    'Hooked',
  ],
  Shadows: [
    'Everyone Steals',
    'Ghost Echoes',
    'Pack Rats',
    'Second Story',
    'Slippery',
    'Synchronized',
  ],
  Smugglers: [
    'Like Part of the Family',
    'All Hands',
    'Ghost Passage',
    'Just Passing Through',
    'Reavers',
    'Renegades',
  ],
};
export const upgrades = [
  'Training: Insight',
  'Training: Prowess',
  'Training: Resolve',
  'Training: Personal',
  'Quality: Documents',
  'Quality: Gear',
  'Quality: Implements',
  'Quality: Supplies',
  'Quality: Tools',
  'Quality: Weapons',
  'Vault',
  'Quarters',
  'Hidden Lair',
  'Secure Lair',
  'Workshop',
  'Mastery',
].map((x) =>
  d(
    'upgrade',
    95,
    x,
    'A permanent Crew upgrade; some require multiple upgrade boxes.',
  ),
);
export const cohortTypes = [
  'Adepts',
  'Rooks',
  'Rovers',
  'Skulks',
  'Thugs',
  'Vehicle',
].map((x) =>
  d(
    'cohort',
    96,
    x,
    'A gang or expert whose quality derives from Crew Tier and upgrades.',
  ),
);
export const claims = [
  'Turf',
  'Lair',
  'Informants',
  'Vice Den',
  'Fixer',
  'Fence',
  'Lookouts',
  'Cover Operation',
  'Training Rooms',
  'Ancient Altar',
  'Offertory',
  'Side Business',
  'Luxury Venue',
  'Tavern',
].map((x) =>
  d(
    'claim',
    46,
    x,
    'A Crew claim with its published benefit and faction consequences.',
  ),
);
export const downtimeActivities = [
  'Acquire Asset',
  'Long-Term Project',
  'Recover',
  'Reduce Heat',
  'Train',
  'Indulge Vice',
].map((x) =>
  d(
    'downtime',
    153,
    x,
    'A structured downtime activity with a user-selected target and recorded result.',
  ),
);
export const scorePlans = [
  'Assault',
  'Deception',
  'Stealth',
  'Occult',
  'Social',
  'Transport',
].map((x) =>
  d(
    'plan',
    127,
    x,
    'A score plan requiring its matching detail before engagement.',
  ),
);
export const gmTools = [
  {
    id: 'bitd.gm-reference.goals',
    name: 'GM Goals & Principles',
    kind: 'gm',
    summary:
      'Concise reminders to play to find out, portray Doskvol, and follow the fiction.',
    sourceId: 'bitd.gm-reference',
    page: 1,
  },
  {
    id: 'bitd.streets.prompt',
    name: 'Street & Building Prompt',
    kind: 'gm',
    summary:
      'Generate an editable mood, exterior, use, prop, and sensory prompt.',
    sourceId: 'bitd.streets',
    page: 1,
  },
  {
    id: 'bitd.rumors.prompt',
    name: 'Doskvol Rumor Prompt',
    kind: 'gm',
    summary:
      'Generate an editable rumor seed and optionally promote it to campaign history.',
    sourceId: 'bitd.rumors',
    page: 1,
  },
] satisfies BitdDefinition[];
