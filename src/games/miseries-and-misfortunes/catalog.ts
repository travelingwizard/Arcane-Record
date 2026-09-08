export interface MmDefinition {
  id: string;
  name: string;
  kind: string;
  summary: string;
  sourceId: string;
  page: number;
  requirements: string[];
}
const d = (
  sourceId: string,
  kind: string,
  page: number,
  name: string,
  summary: string,
  requirements: string[] = [],
): MmDefinition => ({
  id: `${sourceId}.${kind}.${name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`,
  name,
  kind,
  summary,
  sourceId,
  page,
  requirements,
});
export const abilities = [
  'Strength',
  'Intelligence',
  'Wisdom',
  'Dexterity',
  'Constitution',
  'Charisma',
].map((x) =>
  d(
    'mm.book1',
    'ability',
    12,
    x,
    'A governing ability rolled on 3d6 and used to modify related measures and skills.',
  ),
);
export const coreSkills = [
  'Break',
  'Improvise',
  'Listen',
  'Parley',
  'Sang Froid',
  'Search',
  'Sneak',
  'Traverse',
].map((x) =>
  d(
    'mm.book1',
    'core-skill',
    13,
    x,
    'A universal rated skill that begins at 1/6 before its governing modifier and lifepath effects.',
  ),
);
export const mentalities = ['Nationality', 'Religion', 'Politics'].map((x) =>
  d(
    'mm.book1',
    'mentality',
    30,
    x,
    'A rated commitment and body of experience that advances through specific conditions.',
  ),
);
export const lifepaths = [
  'Américain',
  'Clerk',
  'Factotum',
  'Filou',
  'Gamin',
  'Infantry Officer',
  'Judge',
  'Merchant-Venturer',
  'Musketeer',
  'Passeur',
  'Petty Noble',
  'Sailor',
  'Soldier',
].map((x) =>
  d(
    'mm.book2',
    'lifepath',
    18,
    x,
    'A profession or calling with six skills, saves, equipment, experience conditions, and level benefits.',
  ),
);
export const lifestyles = [
  'Natural',
  'Bread Alone',
  'Respectable',
  'Fashionable',
  'Lavish',
].map((x, i) =>
  d(
    'mm.book2',
    'lifestyle',
    7,
    x,
    `A seasonal standard of living adding ${[0, 1, 2, 3, 5][i]} obligation.`,
  ),
);
export const virtues = [
  'Charitable',
  'Courageous',
  'Faithful',
  'Honorable',
  'Loyal',
  'Prudent',
].map((x) =>
  d(
    'mm.book2',
    'virtue',
    49,
    x,
    'A defining virtue earned and embodied through play.',
  ),
);
export const flaws = [
  'Ambitious',
  'Cruel',
  'Greedy',
  'Lustful',
  'Proud',
  'Wrathful',
].map((x) =>
  d(
    'mm.book2',
    'flaw',
    50,
    x,
    'A defining flaw whose embodiment creates complications and rewards.',
  ),
);
export const equipment = [
  'Fine clothing',
  'Traveling clothes',
  'Rapier',
  'Dagger',
  'Pistol',
  'Musket',
  'Buff coat',
  'Breastplate',
  'Lantern',
  'Writing kit',
  'Riding horse',
  'Tools of trade',
].map((x) =>
  d(
    'mm.book2',
    'equipment',
    53,
    x,
    'A carried or owned item with cost, inventory type, and state.',
  ),
);
export const practices = [
  'Chymistry',
  'Goëtia',
  'Necromancy',
  'Theology',
  'Theurgy',
].map((x, i) =>
  d(
    'mm.book3',
    'practice',
    [19, 23, 29, 35, 39][i]!,
    x,
    'A sacred, magical, or scientific practice requiring the appropriate skill, knowledge, and gnosis.',
  ),
);
export const regional = [
  d(
    'mm.book5',
    'region',
    109,
    'Catalunya',
    'Enables verified Catalan lifepaths, mentalities, and magic.',
  ),
  d(
    'mm.book6',
    'region',
    176,
    'Paris 1648',
    'Enables Parisian mentalities, lifepaths, factions, and patronage.',
  ),
];
