export interface SandvDefinition {
  id: string;
  name: string;
  kind: string;
  summary: string;
  sourceId: 'sandv.core';
  page: number;
  verified: boolean;
}
const d = (
  kind: string,
  page: number,
  name: string,
  summary: string,
): SandvDefinition => ({
  id: `sandv.core.${kind}.${name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`,
  name,
  kind,
  summary,
  sourceId: 'sandv.core',
  page,
  verified: true,
});
export const playbooks = [
  [
    'Mechanic',
    66,
    'A ship-focused engineer, inventor, and technical problem solver.',
  ],
  [
    'Muscle',
    74,
    'A dangerous combat specialist who solves problems through force.',
  ],
  ['Mystic', 80, 'A practitioner attuned to the Way and its strange powers.'],
  ['Pilot', 86, 'A daring vehicle operator and speed-focused risk taker.'],
  ['Scoundrel', 92, 'A lucky, adaptable outlaw who thrives under pressure.'],
  ['Speaker', 98, 'A negotiator, fixer, and influential social operator.'],
  ['Stitch', 104, 'A doctor and scientist who keeps the crew alive.'],
].map(([name, page, summary]) =>
  d('playbook', page as number, name as string, summary as string),
);
export const actionNames = [
  'Doctor',
  'Hack',
  'Helm',
  'Rig',
  'Scramble',
  'Scrap',
  'Skulk',
  'Study',
  'Attune',
  'Command',
  'Consort',
  'Sway',
] as const;
export const actions = actionNames.map((name, i) =>
  d(
    'action',
    202,
    name,
    `A ${i < 4 ? 'Insight' : i < 8 ? 'Prowess' : 'Resolve'} action used when the fiction supports it.`,
  ),
);
export const heritages = ['Imperial', 'Colonist', 'Wanderer', 'Xeno'].map((x) =>
  d(
    'heritage',
    58,
    x,
    'A broad cultural origin that informs identity and fictional position.',
  ),
);
export const backgrounds = [
  'Academic',
  'Labor',
  'Cult',
  'Guilder',
  'Military',
  'Noble',
  'Syndicate',
].map((x) => d('background', 59, x, 'A formative vocation or social history.'));
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
    190,
    x,
    'A source of stress relief that can also create complications.',
  ),
);
export const playbookAbilities: Record<string, string[]> = {
  Mechanic: [
    'Tinker',
    'Construct Whisperer',
    'Jury-Rig',
    'Hacker',
    'Fixer',
    'Analyst',
    'Backup',
  ],
  Muscle: [
    'Unstoppable',
    'Battleborn',
    'Bodyguard',
    'Wrecking Crew',
    'Predator',
    'Ready for Anything',
    'Scary',
  ],
  Mystic: [
    'The Way',
    'Kinetics',
    'Psy-Dancing',
    'Center',
    'Sundering',
    'Visions',
    'Warded',
  ],
  Pilot: [
    'Ace Pilot',
    'Leaf on the Wind',
    'Side Job',
    'Hedonist',
    'Exceed Specs',
    'Keen Eye',
    'Punch It!',
  ],
  Scoundrel: [
    'Serendipitous',
    'Never Tell Me the Odds',
    'I Know a Guy',
    'Tenacious',
    'Devil’s Own Luck',
    'When the Chips Are Down',
    'Daredevil',
  ],
  Speaker: [
    'Air of Respectability',
    'Favors Owed',
    'Player',
    'Heart to Heart',
    'Old Friends',
    'Disarming',
    'Infiltrator',
  ],
  Stitch: [
    'I’m a Doctor, Not a…',
    'Physicker',
    'Welcome Anywhere',
    'Patch',
    'Moral Compass',
    'Under Pressure',
    'Book Learning',
  ],
};
export const ships = [
  ['Stardancer', 118, 'A nimble freighter for smugglers and blockade runners.'],
  ['Cerberus', 132, 'A patrol craft for bounty hunters and extraction crews.'],
  ['Firedrake', 138, 'A rebel corvette built to strike the Hegemony.'],
].map(([name, page, summary]) =>
  d('ship', page as number, name as string, summary as string),
);
export const standardItems = [
  'Armor',
  'Blaster Pistol',
  'Communicator',
  'Detonator',
  'Hacking Tools',
  'Heavy Blaster',
  'Illicit Drugs',
  'Medkit',
  'Melee Weapon',
  'Repair Tools',
  'Spacesuit',
  'Spy Gear',
  'Fine Clothes',
  'Mystic Supplies',
].map((x) =>
  d('item', 110, x, 'A standard character loadout item selected for a job.'),
);
export const shipSystems = ['Comms', 'Engines', 'Hull', 'Weapons'].map((x) =>
  d(
    'ship-system',
    117,
    x,
    'A rated ship quality used for actions, damage, and upgrades.',
  ),
);
export const shipUpgrades = [
  'Afterburners',
  'Alien Pet',
  'Armory',
  'Fake Transponder',
  'Galley',
  'Land Rover',
  'Medical Bay',
  'Particle Cannons',
  'Repair Bay',
  'Shields',
  'Stasis Pods',
  'Targeting Computer',
  'Workshop',
].map((x) =>
  d(
    'ship-upgrade',
    115,
    x,
    'A ship module with a persistent fictional and mechanical benefit.',
  ),
);
export const factions = [
  '51st Legion',
  'Ashen Knives',
  'Borniko Syndicate',
  'Church of Stellar Flame',
  'Cobalt Syndicate',
  'Conclave 01',
  'Counters Guild',
  'Draxler’s Raiders',
  'Echo Wave Riders',
  'Guild of Engineers',
  'Hegemonic News Network',
  'House Malklaith',
  'Janus Syndicate',
  'Lost Legion',
  'Maelstrom',
  'Nightspeakers',
  'Sah’iir',
  'Scarlet Wolves',
  'Starsmiths Guild',
  'Vignerons',
  'Yaru Wreckers',
].map((x) =>
  d(
    'faction',
    317,
    x,
    'A Procyon faction tracked by Tier, status, and current goals.',
  ),
);
