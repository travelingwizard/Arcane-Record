import spellRows from './generated-spells.json';

export type CatalogStatus =
  'verified' | 'reference-only' | 'unresolved' | 'excluded';
export interface CatalogEntry {
  id: string;
  name: string;
  aliases: readonly string[];
  summary: string;
  sourceId: 'ars.definitive';
  printedPage: number | null;
  pdfPage: number | null;
  verification: CatalogStatus;
}
const entry = (
  id: string,
  name: string,
  printedPage: number | null,
  summary: string,
): CatalogEntry => ({
  id,
  name,
  aliases: [],
  summary,
  sourceId: 'ars.definitive',
  printedPage,
  pdfPage: printedPage === null ? null : printedPage + 8,
  verification: 'verified',
});

export const houses = [
  [
    'bjornaer',
    'Bjornaer',
    'Heartbeast plus an initial Heartbeast Ability score.',
  ],
  ['bonisagus', 'Bonisagus', 'Choose the research or political House benefit.'],
  ['criamon', 'Criamon', 'The Enigma and an initial Enigmatic Wisdom score.'],
  [
    'ex-miscellanea',
    'Ex Miscellanea',
    'A structured package of an additional Hermetic Virtue, non-Hermetic Virtue, and required Hermetic Flaw.',
  ],
  ['flambeau', 'Flambeau', 'Puissant Perdo or Puissant Ignem.'],
  ['guernicus', 'Guernicus', 'Hermetic Prestige.'],
  [
    'jerbiton',
    'Jerbiton',
    'A suitable Minor scholarship, artistic, or mundane Virtue.',
  ],
  [
    'mercere',
    'Mercere',
    'Gifted members choose Puissant Creo or Muto; unGifted Redcaps are Companions.',
  ],
  [
    'merinita',
    'Merinita',
    'Faerie Magic and its initial Ability score, with the associated initiation condition.',
  ],
  ['tremere', 'Tremere', 'Minor Magical Focus in certamen.'],
  ['tytalus', 'Tytalus', 'Self-Confident.'],
  ['verditius', 'Verditius', 'Verditius Magic.'],
] as const;
export const houseCatalog = houses.map(([id, name, summary]) =>
  entry(`ars.house.${id}`, name, 46, summary),
);

export const techniques = ['Creo', 'Intellego', 'Muto', 'Perdo', 'Rego'].map(
  (name) =>
    entry(
      `ars.art.${name.toLowerCase()}`,
      name,
      202,
      'Hermetic Technique; earned score uses the Art experience scale.',
    ),
);
export const forms = [
  'Animal',
  'Aquam',
  'Auram',
  'Corpus',
  'Herbam',
  'Ignem',
  'Imaginem',
  'Mentem',
  'Terram',
  'Vim',
].map((name) =>
  entry(
    `ars.art.${name.toLowerCase()}`,
    name,
    202,
    'Hermetic Form; earned score uses the Art experience scale.',
  ),
);
export const artCatalog = [...techniques, ...forms];

const abilities: [string, string, number][] = [
  ['area-lore', 'Area Lore', 159],
  ['artes-liberales', 'Artes Liberales', 160],
  ['athletics', 'Athletics', 161],
  ['awareness', 'Awareness', 161],
  ['bargain', 'Bargain', 161],
  ['brawl', 'Brawl', 161],
  ['carouse', 'Carouse', 161],
  ['charm', 'Charm', 161],
  ['chirurgy', 'Chirurgy', 162],
  ['civil-canon-law', 'Civil and Canon Law', 162],
  ['concentration', 'Concentration', 162],
  ['craft', 'Craft', 163],
  ['dead-language', 'Dead Language', 164],
  ['dominion-lore', 'Dominion Lore', 164],
  ['etiquette', 'Etiquette', 165],
  ['faerie-lore', 'Faerie Lore', 165],
  ['finesse', 'Finesse', 165],
  ['folk-ken', 'Folk Ken', 165],
  ['guile', 'Guile', 166],
  ['hunt', 'Hunt', 166],
  ['infernal-lore', 'Infernal Lore', 167],
  ['intrigue', 'Intrigue', 167],
  ['leadership', 'Leadership', 167],
  ['living-language', 'Living Language', 167],
  ['magic-lore', 'Magic Lore', 168],
  ['magic-theory', 'Magic Theory', 168],
  ['latin', 'Latin', 164],
  ['medicine', 'Medicine', 168],
  ['music', 'Music', 168],
  ['organization-lore', 'Organization Lore', 169],
  ['parma-magica', 'Parma Magica', 169],
  ['penetration', 'Penetration', 169],
  ['philosophiae', 'Philosophiae', 169],
  ['profession', 'Profession', 170],
  ['single-weapon', 'Single Weapon', 171],
  ['stealth', 'Stealth', 171],
  ['survival', 'Survival', 171],
  ['swim', 'Swim', 171],
  ['teaching', 'Teaching', 171],
  ['theology', 'Theology', 172],
  ['thrown-weapon', 'Thrown Weapon', 172],
];
export const abilityCatalog = abilities.map(([id, name, page]) =>
  entry(
    `ars.ability.${id}`,
    name,
    page,
    'Core Ability; choose a specialty and record earned experience separately from effective bonuses.',
  ),
);

export const spellCatalog = spellRows as readonly (CatalogEntry & {
  technique: string;
  form: string;
  level: number | null;
  general: boolean;
})[];
export const masteryOptions = [
  'Acute Sense',
  'Adaptive Casting',
  'Boosted Casting',
  'Careful Sorcery',
  'Fast Casting',
  'Imperturbable Casting',
  'Magic Resistance',
  'Multiple Casting',
  'Obfuscated Casting',
  'Penetration',
  'Precise Casting',
  'Quick Casting',
  'Quiet Casting',
  'Still Casting',
].map((name) =>
  entry(
    `ars.mastery.${name.toLowerCase().replaceAll(' ', '-')}`,
    name,
    207,
    'Spell Mastery special ability; verify eligibility on the cited mastery rules before applying.',
  ),
);

export const covenantPackages = [
  { id: 'weak', name: 'Weak', buildPoints: 200 },
  { id: 'medium', name: 'Medium', buildPoints: 800 },
  { id: 'powerful', name: 'Powerful', buildPoints: 2000 },
] as const;

export const seasonalSources = [
  ['exposure', 376],
  ['adventure', 376],
  ['practice', 377],
  ['training', 378],
  ['teaching', 378],
  ['summa', 379],
  ['tractatus', 379],
  ['vis-study', 381],
  ['laboratory', 249],
].map(([name, page]) =>
  entry(
    `ars.season.${name}`,
    String(name).replace('-', ' '),
    Number(page),
    'Seasonal activity; apply Source Quality, Advancement Total, and awarded experience in order.',
  ),
);

export const catalog = [
  ...houseCatalog,
  ...artCatalog,
  ...abilityCatalog,
  ...masteryOptions,
  ...seasonalSources,
  ...spellCatalog,
];
