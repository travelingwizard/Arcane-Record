import spellRows from './generated-spells.json';
import virtueFlawRows from './generated-virtues-flaws.json';

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
  mechanics?: Readonly<Record<string, unknown>>;
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

const artCodes: Readonly<Record<string, string>> = {
  Cr: 'creo',
  In: 'intellego',
  Mu: 'muto',
  Pe: 'perdo',
  Re: 'rego',
  An: 'animal',
  Aq: 'aquam',
  Au: 'auram',
  Co: 'corpus',
  He: 'herbam',
  Ig: 'ignem',
  Im: 'imaginem',
  Me: 'mentem',
  Te: 'terram',
  Vi: 'vim',
};

export function artIdForCode(code: string) {
  const name = artCodes[code];
  if (!name) throw new Error(`Unknown Hermetic Art code: ${code}`);
  return `ars.art.${name}`;
}

export type AbilityCategory =
  'general' | 'academic' | 'arcane' | 'martial' | 'supernatural';

const abilities: [string, string, AbilityCategory, number][] = [
  ['animal-handling', 'Animal Handling', 'general', 159],
  ['area-lore', 'Area Lore', 'general', 159],
  ['athletics', 'Athletics', 'general', 161],
  ['awareness', 'Awareness', 'general', 161],
  ['bargain', 'Bargain', 'general', 161],
  ['brawl', 'Brawl', 'general', 161],
  ['carouse', 'Carouse', 'general', 161],
  ['charm', 'Charm', 'general', 161],
  ['chirurgy', 'Chirurgy', 'general', 162],
  ['concentration', 'Concentration', 'general', 162],
  ['craft', 'Craft', 'general', 163],
  ['etiquette', 'Etiquette', 'general', 165],
  ['folk-ken', 'Folk Ken', 'general', 165],
  ['guile', 'Guile', 'general', 166],
  ['hunt', 'Hunt', 'general', 166],
  ['intrigue', 'Intrigue', 'general', 167],
  ['judaic-lore', 'Judaic Lore', 'general', 167],
  ['leadership', 'Leadership', 'general', 167],
  ['legerdemain', 'Legerdemain', 'general', 167],
  ['living-language', 'Living Language', 'general', 167],
  ['music', 'Music', 'general', 168],
  ['mystery-cult-lore', 'Mystery Cult Lore', 'general', 168],
  ['organization-lore', 'Organization Lore', 'general', 169],
  ['profession', 'Profession', 'general', 170],
  ['ride', 'Ride', 'general', 170],
  ['stealth', 'Stealth', 'general', 171],
  ['survival', 'Survival', 'general', 171],
  ['swim', 'Swim', 'general', 171],
  ['teaching', 'Teaching', 'general', 171],
  ['art-of-memory', 'Art of Memory', 'academic', 159],
  ['artes-liberales', 'Artes Liberales', 'academic', 160],
  ['civil-canon-law', 'Civil and Canon Law', 'academic', 162],
  ['common-law', 'Common Law', 'academic', 163],
  ['dead-language', 'Dead Language', 'academic', 164],
  // Retained as a stable convenience definition for existing records. Rules
  // treat this as Dead Language with the Latin specialization.
  ['latin', 'Latin', 'academic', 164],
  ['islamic-law', 'Islamic Law', 'academic', 167],
  ['medicine', 'Medicine', 'academic', 168],
  ['philosophiae', 'Philosophiae', 'academic', 169],
  ['rabbinic-law', 'Rabbinic Law', 'academic', 170],
  ['theology-christian', 'Theology: Christianity', 'academic', 172],
  ['theology-islam', 'Theology: Islam', 'academic', 172],
  ['theology-judaism', 'Theology: Judaism', 'academic', 172],
  ['code-of-hermes', 'Code of Hermes', 'arcane', 162],
  ['dominion-lore', 'Dominion Lore', 'arcane', 164],
  ['enigmatic-wisdom', 'Enigmatic Wisdom', 'arcane', 165],
  ['faerie-lore', 'Faerie Lore', 'arcane', 165],
  ['faerie-magic', 'Faerie Magic', 'arcane', 165],
  ['finesse', 'Finesse', 'arcane', 165],
  ['heartbeast', 'Heartbeast', 'arcane', 166],
  ['infernal-lore', 'Infernal Lore', 'arcane', 167],
  ['magic-lore', 'Magic Lore', 'arcane', 168],
  ['magic-theory', 'Magic Theory', 'arcane', 168],
  ['parma-magica', 'Parma Magica', 'arcane', 169],
  ['penetration', 'Penetration', 'arcane', 169],
  ['bows', 'Bows', 'martial', 161],
  ['great-weapon', 'Great Weapon', 'martial', 166],
  ['single-weapon', 'Single Weapon', 'martial', 171],
  ['thrown-weapon', 'Thrown Weapon', 'martial', 172],
  ['animal-ken', 'Animal Ken', 'supernatural', 159],
  ['corpse-magic', 'Corpse Magic', 'supernatural', 163],
  ['crafters-healing', "Crafter's Healing", 'supernatural', 163],
  ['curse-throwing', 'Curse-Throwing', 'supernatural', 164],
  ['dowsing', 'Dowsing', 'supernatural', 164],
  ['embitterment', 'Embitterment', 'supernatural', 164],
  ['enchanting-ability', 'Enchanting Ability', 'supernatural', 165],
  ['entrancement', 'Entrancement', 'supernatural', 165],
  ['font-of-knowledge', 'Font of Knowledge', 'supernatural', 165],
  ['hex', 'Hex', 'supernatural', 166],
  ['induction', 'Induction', 'supernatural', 167],
  ['magic-sensitivity', 'Magic Sensitivity', 'supernatural', 168],
  ['persona', 'Persona', 'supernatural', 169],
  ['premonitions', 'Premonitions', 'supernatural', 170],
  ['second-sight', 'Second Sight', 'supernatural', 170],
  [
    'sense-holiness-unholiness',
    'Sense Holiness and Unholiness',
    'supernatural',
    170,
  ],
  ['sense-passions', 'Sense Passions', 'supernatural', 170],
  ['shapeshifter', 'Shapeshifter', 'supernatural', 171],
  ['summon-animals', 'Summon Animals', 'supernatural', 171],
  ['whistle-up-the-wind', 'Whistle Up The Wind', 'supernatural', 172],
  ['wilderness-sense', 'Wilderness Sense', 'supernatural', 172],
];
export const abilityCatalog = abilities.map(([id, name, category, page]) => ({
  ...entry(
    `ars.ability.${id}`,
    name,
    page,
    `${category[0].toUpperCase()}${category.slice(1)} Ability; choose a specialty and record earned experience separately from effective bonuses.`,
  ),
  category,
  mechanics: { category },
}));

export const spellCatalog = spellRows as readonly (CatalogEntry & {
  technique: string;
  form: string;
  level: number | null;
  general: boolean;
  mechanics: {
    technique: string;
    form: string;
    level: number | null;
    general: boolean;
  };
})[];

export interface VirtueFlawCatalogEntry extends CatalogEntry {
  kind: 'virtue' | 'flaw';
  magnitude: 'free' | 'minor' | 'major' | 'variable';
  category:
    | 'general'
    | 'hermetic'
    | 'mythic-companion'
    | 'personality'
    | 'social-status'
    | 'story'
    | 'supernatural';
  points: number;
}

export const virtueFlawCatalog =
  virtueFlawRows as readonly VirtueFlawCatalogEntry[];
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
  ...virtueFlawCatalog,
];
