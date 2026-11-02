import type { EarthdawnSpellReference } from './spell-types';
import type { EarthdawnKnackVariant } from './knack-types';
import { earthdawnBasicRules, earthdawnCreationRules } from './basic-rules';
import type { EarthdawnRuleMetadata } from './rule-types';
import { earthdawnPathProfiles } from './path-profiles';

export type EarthdawnCatalogKind =
  | 'race'
  | 'discipline'
  | 'talent'
  | 'skill'
  | 'knack'
  | 'spell'
  | 'equipment'
  | 'weapon'
  | 'thread-item'
  | 'path'
  | 'devotion'
  | 'ability'
  | 'basic-rule'
  | 'creation-rule';

export interface EarthdawnSource {
  id: string;
  title: string;
  shortTitle: string;
  required: boolean;
}
export interface EarthdawnDefinition {
  id: string;
  kind: EarthdawnCatalogKind;
  name: string;
  summary: string;
  mechanics: string;
  requirements: string[];
  aliases: string[];
  sourceId: string;
  sourceIds?: string[];
  source: string;
  page: number | null;
  pageEnd?: number | null;
  verification: 'verified' | 'reference-only' | 'unresolved';
  ruleMetadata?: EarthdawnRuleMetadata;
  costSilver?: number;
  price?: { amount: number; denomination: 'cp' | 'sp' | 'gp' };
  equipmentMetadata?: {
    category: string;
    availability: string;
    weight: number;
    size: number;
    weaponType?: 'melee' | 'missile' | 'throwing';
    shortRange?: string;
    longRange?: string;
  };
  skillCategory?: 'general' | 'knowledge' | 'artisan' | 'language';
  defaultAttribute?: EarthdawnAttributeId;
  talentMetadata?: {
    attributeText: string;
    effectText: string;
    actionText: string;
    strainText: string;
    citationText: string;
    sourceIds: string[];
    descriptionText?: string;
    requirementsText?: string;
  };
  knackMetadata?: {
    variants: readonly EarthdawnKnackVariant[];
  };
  threadItemMetadata?: {
    itemType: string;
    descriptionText: string;
    inferredKeyKnowledge: string;
    provenance: 'workbook' | 'catalog';
  };
  spellMetadata?: EarthdawnSpellReference;
}
export interface EarthdawnRace extends EarthdawnDefinition {
  attributes: Record<EarthdawnAttributeId, number>;
  movement: string;
  karmaModifier: number;
  abilities: string[];
}
export interface EarthdawnDiscipline extends EarthdawnDefinition {
  importantAttributes: EarthdawnAttributeId[];
  durability: number;
  noviceTalents: string[];
  optionalTalents: string[];
  spellcaster: boolean;
  circles: import('./discipline-progressions').DisciplineCircle[];
  talentOptions: Record<
    'novice' | 'journeyman' | 'warden' | 'master',
    string[]
  >;
  halfMagic?: string;
  karmaRitual?: string;
  restrictions?: string[];
  freeTalent?: string;
}
export type EarthdawnAttributeId =
  | 'dexterity'
  | 'strength'
  | 'toughness'
  | 'perception'
  | 'willpower'
  | 'charisma';

export const earthdawnSources: EarthdawnSource[] = [
  {
    id: 'ed4.players-guide',
    title: 'Earthdawn Fourth Edition Player’s Guide',
    shortTitle: 'Player’s Guide',
    required: true,
  },
  {
    id: 'ed4.gamemasters-guide',
    title: 'Earthdawn Fourth Edition Gamemaster’s Guide',
    shortTitle: 'GM Guide',
    required: false,
  },
  {
    id: 'ed4.companion',
    title: 'Earthdawn Fourth Edition Companion',
    shortTitle: 'Companion',
    required: false,
  },
  {
    id: 'ed4.travar',
    title: 'Travar: The Merchant City',
    shortTitle: 'Travar',
    required: false,
  },
  {
    id: 'ed4.questors',
    title: 'Questors',
    shortTitle: 'Questors',
    required: false,
  },
  {
    id: 'ed4.deeper-secrets',
    title: 'Deeper Secrets',
    shortTitle: 'Deeper Secrets',
    required: false,
  },
  { id: 'ed4.iopos', title: 'Iopos', shortTitle: 'Iopos', required: false },
  {
    id: 'ed4.vasgothia',
    title: 'Vasgothia',
    shortTitle: 'Vasgothia',
    required: false,
  },
  {
    id: 'ed4.mystic-paths',
    title: 'The Adept’s Journey: Mystic Paths',
    shortTitle: 'Mystic Paths',
    required: false,
  },
  {
    id: 'ed4.elven-nations',
    title: 'Elven Nations',
    shortTitle: 'Elven Nations',
    required: false,
  },
  {
    id: 'ed4.grand-bazaar',
    title: 'The Grand Bazaar',
    shortTitle: 'Grand Bazaar',
    required: false,
  },
  {
    id: 'ed4.user-currency-reference',
    title: 'User-supplied Barsaive Currency Reference',
    shortTitle: 'Currency Reference',
    required: false,
  },
  {
    id: 'ed4.user-matrix-reference',
    title: 'User-supplied Earthdawn Matrix Reference',
    shortTitle: 'Matrix Reference',
    required: false,
  },
];
const slug = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
const entry = (
  kind: EarthdawnCatalogKind,
  name: string,
  sourceId: string,
  page: number,
  summary: string,
  requirements: string[] = [],
): EarthdawnDefinition => ({
  id: `${sourceId}.${kind}.${slug(name)}`,
  kind,
  name,
  summary,
  mechanics: summary,
  requirements,
  aliases: [],
  sourceId,
  sourceIds: [sourceId],
  source: earthdawnSources.find(({ id }) => id === sourceId)!.title,
  page,
  pageEnd: page,
  verification: 'verified',
});

import {
  coreDisciplineProgressions,
  coreTalentOptions,
} from './discipline-progressions';
import { earthdawnSpellReference } from './spell-reference';
import { earthdawnSpellbookSupplement } from './spellbook-supplement';
import { earthdawnKnackReference } from './knack-reference';
import {
  questorDevotionProgressions,
  questorTierMinimumRank,
} from './questor-devotions';
import { companionThreadItemRows } from './companion-thread-items';
import { earthdawnTalentReferenceRows } from './talent-reference';
import { earthdawnTalentDescriptionRows } from './talent-descriptions';
import {
  earthdawnSkillReferenceRows,
  earthdawnTalentSupplementRows,
  earthdawnThreadItemReferenceRows,
} from './reference-workbooks';

const attrs: EarthdawnAttributeId[] = [
  'dexterity',
  'strength',
  'toughness',
  'perception',
  'willpower',
  'charisma',
];

const talentSourceIds: Record<number, string> = {
  1: 'ed4.deeper-secrets',
  2: 'ed4.players-guide',
  3: 'ed4.questors',
  4: 'ed4.gamemasters-guide',
  5: 'ed4.companion',
  6: 'ed4.mystic-paths',
  7: 'ed4.iopos',
  8: 'ed4.elven-nations',
  9: 'ed4.vasgothia',
  10: 'ed4.travar',
};

const expandSourceReferences = (value: string) => {
  const numbers = new Set<number>();
  for (const part of value.split(',').map((item) => item.trim())) {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      for (let index = Number(range[1]); index <= Number(range[2]); index += 1)
        numbers.add(index);
      continue;
    }
    if (/^\d+$/.test(part)) numbers.add(Number(part));
  }
  return [...numbers]
    .map((number) => talentSourceIds[number])
    .filter((id): id is string => Boolean(id));
};

const normalizedTalentAttribute = (
  value: string,
): EarthdawnAttributeId | undefined => {
  const normalized = value.toLocaleLowerCase();
  return attrs.find((attribute) => attribute === normalized);
};

const citationPage = (citation: string) =>
  Number(citation.match(/(?:p\.|page)\s*(\d+)/i)?.[1] ?? 1);

const talentSupplements = new Map(
  earthdawnTalentSupplementRows.map((row) => [row[0].toLocaleLowerCase(), row]),
);
const talentDescriptions = new Map(
  earthdawnTalentDescriptionRows.map((row) => [
    row[0].toLocaleLowerCase(),
    row,
  ]),
);
const primaryTalents: EarthdawnDefinition[] = earthdawnTalentReferenceRows.map(
  ([
    name,
    attributeText,
    effectText,
    actionText,
    strainText,
    citationText,
    sourceReferences,
  ]) => {
    const sourceIds = expandSourceReferences(sourceReferences);
    const sourceId = sourceIds.includes('ed4.players-guide')
      ? 'ed4.players-guide'
      : (sourceIds[0] ?? 'ed4.players-guide');
    const supplement = talentSupplements.get(name.toLocaleLowerCase());
    const description = talentDescriptions.get(name.toLocaleLowerCase())?.[1];
    return {
      ...entry(
        'talent',
        name,
        sourceId,
        citationPage(citationText),
        description ?? effectText,
      ),
      defaultAttribute: normalizedTalentAttribute(attributeText),
      mechanics: JSON.stringify({
        attributeText,
        effectText,
        actionText,
        strainText,
      }),
      talentMetadata: {
        attributeText,
        effectText,
        actionText,
        strainText,
        citationText,
        sourceIds: [
          ...new Set([...sourceIds, ...(supplement ? [supplement[3]] : [])]),
        ],
        descriptionText: description ?? supplement?.[1],
        requirementsText: supplement?.[2],
      },
    };
  },
);
const existingTalentNames = new Set(
  primaryTalents.map(({ name }) => name.toLocaleLowerCase()),
);
export const earthdawnTalents: EarthdawnDefinition[] = [
  ...primaryTalents,
  ...earthdawnTalentSupplementRows
    .filter(([name]) => !existingTalentNames.has(name.toLocaleLowerCase()))
    .map(([name, description, requirementsText, sourceId, page]) => {
      const preferredDescription =
        talentDescriptions.get(name.toLocaleLowerCase())?.[1] ?? description;
      return {
        ...entry('talent', name, sourceId, page ?? 1, preferredDescription),
        page,
        mechanics: JSON.stringify({ description, requirementsText }),
        talentMetadata: {
          attributeText: 'Not in source',
          effectText: description,
          actionText: 'Not in source',
          strainText: 'Not in source',
          citationText: `${earthdawnSources.find(({ id }) => id === sourceId)?.title ?? sourceId}${page ? `, p. ${page}` : ''}`,
          sourceIds: [sourceId],
          descriptionText: preferredDescription,
          requirementsText,
        },
      };
    }),
];

const disciplineTalentVariant = (
  id: string,
  name: string,
  baseName: string,
  sourceId: string,
  sourceIds: string[],
  page: number | null,
  pageEnd: number | null,
): EarthdawnDefinition => {
  const base = earthdawnTalents.find((talent) => talent.name === baseName)!;
  const source = earthdawnSources.find(({ id }) => id === sourceId)!.title;
  return {
    ...base,
    id,
    name,
    aliases: [],
    sourceId,
    sourceIds,
    source,
    page,
    pageEnd,
    verification: 'verified',
    summary: `${name} is the Discipline-specific form of ${baseName}.`,
    talentMetadata: base.talentMetadata
      ? {
          ...base.talentMetadata,
          sourceIds,
          citationText: `${source}${page ? `, p. ${page}${pageEnd && pageEnd !== page ? `–${pageEnd}` : ''}` : ', page unavailable'}`,
        }
      : undefined,
  };
};

earthdawnTalents.push(
  disciplineTalentVariant(
    'ed4.discipline.gauntlet.talent.thread-weaving',
    'Thread Weaving (Gauntlet Weaving)',
    'Thread Weaving',
    'ed4.deeper-secrets',
    ['ed4.deeper-secrets', 'ed4.mystic-paths', 'ed4.vasgothia'],
    null,
    null,
  ),
  disciplineTalentVariant(
    'ed4.discipline.shaman.talent.thread-weaving',
    'Thread Weaving (Shamanism)',
    'Thread Weaving',
    'ed4.mystic-paths',
    ['ed4.deeper-secrets', 'ed4.mystic-paths', 'ed4.vasgothia'],
    167,
    178,
  ),
  disciplineTalentVariant(
    'ed4.discipline.shaman.talent.summon-beast-spirits',
    'Summon (Beast Spirits)',
    'Summon',
    'ed4.mystic-paths',
    ['ed4.deeper-secrets', 'ed4.mystic-paths', 'ed4.vasgothia'],
    167,
    178,
  ),
);

const raceData: Array<[string, number[], string, number, string[]]> = [
  ['Dwarf', [9, 10, 12, 11, 11, 10], '10', 4, ['Heat Sight', 'Strong Back']],
  ['Elf', [12, 10, 8, 11, 11, 11], '14', 4, ['Low-Light Vision']],
  ['Human', [10, 10, 10, 10, 10, 10], '12', 5, ['Versatility']],
  [
    'Obsidiman',
    [8, 18, 13, 9, 10, 9],
    '10',
    3,
    ['Increased Wound Threshold', 'Natural Armor'],
  ],
  ['Ork', [10, 13, 11, 10, 8, 9], '12', 5, ['Gahad', 'Low-Light Vision']],
  ['Troll', [10, 14, 12, 9, 11, 10], '14', 3, ['Heat Sight']],
  [
    'T’skrang',
    [11, 10, 11, 10, 10, 11],
    '12 land / 12 swimming',
    4,
    ['Tail Combat', 'Aquatic Movement'],
  ],
  [
    'Windling',
    [11, 4, 8, 11, 10, 12],
    '6 / 16 flying',
    6,
    ['Astral Sight', 'Flight', 'Increased Physical Defense'],
  ],
];
export const earthdawnRaces: EarthdawnRace[] = raceData.map(
  ([name, values, movement, karmaModifier, abilities], index) => ({
    ...entry(
      'race',
      name,
      'ed4.players-guide',
      43 + index * 2,
      `${name} starting attributes, movement, Karma modifier, and racial abilities.`,
    ),
    attributes: Object.fromEntries(
      attrs.map((id, i) => [id, values[i]]),
    ) as Record<EarthdawnAttributeId, number>,
    movement,
    karmaModifier,
    abilities,
  }),
);

const disciplineRows: Array<
  [string, number, EarthdawnAttributeId[], boolean, string[]]
> = [
  [
    'Air Sailor',
    88,
    ['dexterity', 'willpower', 'charisma'],
    false,
    ['Air Sailing', 'Avoid Blow', 'Climbing', 'Melee Weapons', 'Wind Catcher'],
  ],
  [
    'Archer',
    90,
    ['dexterity', 'perception'],
    false,
    ['Awareness', 'Missile Weapons', 'Mystic Aim', 'Navigation', 'True Shot'],
  ],
  [
    'Beastmaster',
    92,
    ['willpower', 'charisma'],
    false,
    [
      'Animal Bond',
      'Animal Training',
      'Claw Shape',
      'Creature Analysis',
      'Unarmed Combat',
    ],
  ],
  [
    'Cavalryman',
    94,
    ['dexterity', 'perception', 'charisma'],
    false,
    ['Animal Bond', 'Charge', 'Melee Weapons', 'Mount Attack', 'Trick Riding'],
  ],
  [
    'Elementalist',
    96,
    ['perception', 'willpower'],
    true,
    [
      'Elementalism',
      'Patterncraft',
      'Spellcasting',
      'Spell Matrix',
      'Thread Weaving',
    ],
  ],
  [
    'Illusionist',
    98,
    ['perception', 'willpower', 'charisma'],
    true,
    [
      'Illusionism',
      'Patterncraft',
      'Spellcasting',
      'Spell Matrix',
      'Thread Weaving',
    ],
  ],
  [
    'Nethermancer',
    100,
    ['perception', 'willpower', 'charisma'],
    true,
    [
      'Nethermancy',
      'Patterncraft',
      'Spellcasting',
      'Spell Matrix',
      'Thread Weaving',
    ],
  ],
  [
    'Scout',
    102,
    ['dexterity', 'perception'],
    false,
    ['Awareness', 'Climbing', 'Navigation', 'Tracking', 'Wilderness Survival'],
  ],
  [
    'Sky Raider',
    104,
    ['dexterity', 'strength', 'charisma'],
    false,
    [
      'Air Sailing',
      'Battle Shout',
      'Melee Weapons',
      'Unarmed Combat',
      'Wind Catcher',
    ],
  ],
  [
    'Swordmaster',
    106,
    ['dexterity', 'charisma'],
    false,
    ['Avoid Blow', 'First Impression', 'Maneuver', 'Melee Weapons', 'Taunt'],
  ],
  [
    'Thief',
    108,
    ['dexterity', 'perception', 'charisma'],
    false,
    [
      'Awareness',
      'Lock Picking',
      'Melee Weapons',
      'Picking Pockets',
      'Trap Initiative',
    ],
  ],
  [
    'Troubadour',
    110,
    ['perception', 'charisma'],
    false,
    [
      'Emotion Song',
      'First Impression',
      'Item History',
      'Knowledge Is Power',
      'Speak Language',
    ],
  ],
  [
    'Warrior',
    112,
    ['dexterity', 'strength', 'toughness'],
    false,
    [
      'Avoid Blow',
      'Melee Weapons',
      'Unarmed Combat',
      'Weapon Training',
      'Wood Skin',
    ],
  ],
  [
    'Weaponsmith',
    114,
    ['perception', 'willpower', 'charisma'],
    false,
    [
      'Forge Weapon',
      'Haggle',
      'Melee Weapons',
      'Steel Thought',
      'Weapon History',
    ],
  ],
  [
    'Wizard',
    116,
    ['perception', 'willpower', 'charisma'],
    true,
    [
      'Patterncraft',
      'Spellcasting',
      'Spell Matrix',
      'Thread Weaving',
      'Wizardry',
    ],
  ],
];
const coreFreeTalents: Record<string, string> = {
  'Air Sailor': 'Air Sailing; Rank equals Air Sailor Circle.',
  Troubadour: 'Entertainer; Rank equals Troubadour Circle.',
  Elementalist:
    'Two Standard Matrices; Ranks equal Circle. One becomes Enhanced at Circle 5.',
  Illusionist:
    'Two Standard Matrices; Ranks equal Circle. One becomes Enhanced at Circle 5.',
  Nethermancer:
    'Two Standard Matrices; Ranks equal Circle. One becomes Enhanced at Circle 5.',
  Wizard:
    'Two Standard Matrices; Ranks equal Circle. One becomes Enhanced at Circle 5.',
};
const coreDurability: Record<string, number> = {
  'Air Sailor': 5,
  Archer: 5,
  Beastmaster: 7,
  Cavalryman: 7,
  Elementalist: 3,
  Illusionist: 3,
  Nethermancer: 3,
  Scout: 5,
  'Sky Raider': 7,
  Swordmaster: 7,
  Thief: 5,
  Troubadour: 5,
  Warrior: 9,
  Weaponsmith: 7,
  Wizard: 3,
};
const coreDisciplines: EarthdawnDiscipline[] = disciplineRows.map(
  ([name, page, importantAttributes, spellcaster, noviceTalents]) => ({
    ...entry(
      'discipline',
      name,
      'ed4.players-guide',
      page,
      `${name} is an official adept Discipline with its own philosophy, talent progression, and Circle abilities.`,
    ),
    importantAttributes,
    durability: coreDurability[name] ?? 5,
    noviceTalents,
    optionalTalents: [],
    spellcaster,
    freeTalent: coreFreeTalents[name],
    circles: coreDisciplineProgressions[name] ?? [],
    talentOptions: coreTalentOptions[name] ?? {
      novice: [],
      journeyman: [],
      warden: [],
      master: [],
    },
  }),
);

const airSailor = coreDisciplines.find(({ name }) => name === 'Air Sailor')!;
const boatmanSubstitutions = new Map([
  ['Air Sailing', 'Pilot Boat or Sailing'],
  ['Thread Weaving (Air Weaving)', 'Thread Weaving (River Weaving)'],
  ['Wind Catcher', 'Swimming'],
  ['Air Dance', 'Disarm'],
  ['Windborne Speed', 'Riverborne Speed'],
  ['Distract', 'Unarmed Combat'],
  ['Navigation', 'Read River'],
  ['Air Speaking', 'Swift Kick'],
]);
const substituteBoatman = (value: string) =>
  boatmanSubstitutions.get(value) ?? value;
const boatman: EarthdawnDiscipline = {
  ...airSailor,
  id: 'ed4.discipline.boatman',
  name: 'Boatman',
  sourceId: 'ed4.mystic-paths',
  source: 'The Adept’s Journey: Mystic Paths',
  page: 157,
  pageEnd: 165,
  summary:
    'A river-focused Air Sailor Discipline variant using rivercraft, trade-route, crew, and vessel knowledge.',
  aliases: ['Air Sailor variant', 'Sailor'],
  importantAttributes: ['charisma', 'dexterity', 'willpower'],
  noviceTalents: airSailor.noviceTalents.map(substituteBoatman),
  circles: airSailor.circles.map((circle) => ({
    ...circle,
    requiredTalents: circle.requiredTalents.map(substituteBoatman),
    ability:
      circle.circle === 1
        ? 'Karma once per round on any action while aboard a riverboat.'
        : circle.circle === 13
          ? 'Riverborne Speed.'
          : circle.ability,
    source: 'The Adept’s Journey: Mystic Paths',
    page: circle.circle === 13 ? 165 : 157,
  })),
  talentOptions: {
    novice: airSailor.talentOptions.novice.map(substituteBoatman),
    journeyman: airSailor.talentOptions.journeyman.map(substituteBoatman),
    warden: [...airSailor.talentOptions.warden],
    master: [...airSailor.talentOptions.master],
  },
  freeTalent: 'Choose Pilot Boat or Sailing; Rank equals Boatman Circle.',
};

const sailor: EarthdawnDiscipline = {
  ...airSailor,
  id: 'ed4.discipline.sailor',
  name: 'Sailor',
  summary:
    'A water-going Air Sailor variant whose free Sailing talent replaces Air Sailing.',
  aliases: ['Air Sailor variant', 'Water Sailor'],
  freeTalent: 'Sailing; Rank equals Sailor Circle.',
  noviceTalents: airSailor.noviceTalents.map((name) =>
    name === 'Air Sailing' ? 'Sailing' : name,
  ),
};

const disciplineSupplementSources = [
  'ed4.deeper-secrets',
  'ed4.mystic-paths',
  'ed4.vasgothia',
];

const gauntlet: EarthdawnDiscipline = {
  id: 'ed4.discipline.gauntlet',
  kind: 'discipline',
  name: 'Gauntlet',
  summary:
    'Magistrates of the natural order and living weapons who turn their bodies into fists of the elements.',
  mechanics:
    'Durability 7. Elemental Stance, Pattern Infusion, and Pattern Manifestation support unarmed combat, armor, and elemental attacks. Half-Magic covers elemental lore, unarmed traditions, endurance, and resisting fatigue or distraction.',
  requirements: [
    'Body Control requires bare hands free of weapons and shields.',
    'Terrene sense can become distracting in some environments.',
  ],
  aliases: [],
  sourceId: 'ed4.deeper-secrets',
  sourceIds: disciplineSupplementSources,
  source: 'Deeper Secrets; The Adept’s Journey: Mystic Paths; Vasgothia',
  page: null,
  pageEnd: null,
  verification: 'verified',
  importantAttributes: ['perception', 'strength', 'willpower'],
  durability: 7,
  noviceTalents:
    coreDisciplineProgressions.Gauntlet?.[0]?.requiredTalents ?? [],
  optionalTalents: coreTalentOptions.Gauntlet?.novice ?? [],
  spellcaster: false,
  circles: coreDisciplineProgressions.Gauntlet ?? [],
  talentOptions: coreTalentOptions.Gauntlet!,
  halfMagic:
    'Knowledge of the elements, unarmed fighting techniques, prominent combatants and styles; tests to resist fatigue, distractions, and other endurance or willpower challenges.',
  karmaRitual:
    'Maintain contact with earth or stone for thirty minutes, then strike and destroy a leaping shard in one fluid motion.',
  restrictions: [
    'Body Control requires both bare hands to remain free.',
    'Terrene sense can cause distraction.',
  ],
  freeTalent: undefined,
};

const shaman: EarthdawnDiscipline = {
  id: 'ed4.discipline.shaman',
  kind: 'discipline',
  name: 'Shaman',
  summary:
    'A magician Discipline centered on life, spirits, nature, spiritual guidance, herbalism, healing, and cooperative bonds with beast spirits.',
  mechanics:
    'Durability 3. Uses Shaman spells, Patterncraft, Spellcasting, and Thread Weaving (Shamanism). Starts with two free Standard Matrices and upgrades one to an Enhanced Matrix at Fifth Circle. Pack, Spirit, Binding, and Fate rules remain subject to their complete spell and knack text.',
  requirements: [
    'Maintain respectful relationships with natural and beast spirits.',
    'Coercing, abusing, or harming allied spirits can cause a Discipline crisis.',
    'Invae and other invertebrate spirits are anathema to Shaman practice.',
  ],
  aliases: ['Spirit Weaving'],
  sourceId: 'ed4.mystic-paths',
  sourceIds: disciplineSupplementSources,
  source: 'The Adept’s Journey: Mystic Paths',
  page: 167,
  pageEnd: 178,
  verification: 'verified',
  importantAttributes: ['willpower', 'charisma', 'perception'],
  durability: 3,
  noviceTalents: coreDisciplineProgressions.Shaman?.[0]?.requiredTalents ?? [],
  optionalTalents: coreTalentOptions.Shaman?.novice ?? [],
  spellcaster: true,
  circles: coreDisciplineProgressions.Shaman ?? [],
  talentOptions: coreTalentOptions.Shaman!,
  halfMagic:
    'Recognize animals, tracks, abnormal behavior, and beast spirits; practice herbalism, bone-setting, wound care, and treatment of disease.',
  karmaRitual:
    'Walk a circle, draw a square within it, sit at the center, summon a beast spirit, and groom or scratch it for thirty minutes.',
  restrictions: [
    'Spirit pacts require respect and atonement when broken.',
    'Named-spirit and Improved Spell rules require their associated knacks.',
  ],
};

export const earthdawnDisciplines: EarthdawnDiscipline[] = [
  ...coreDisciplines,
  boatman,
  sailor,
  gauntlet,
  shaman,
];

export const earthdawnPassions = [
  ['Astendar', 18, false, 'Love, art, beauty, and creative expression.'],
  ['Chorrolis', 28, false, 'Trade, wealth, and fair exchange.'],
  ['Dis', 38, true, 'Bureaucracy, slavery, and oppressive order.'],
  ['Floranuus', 48, false, 'Energy, motion, victory, and perseverance.'],
  ['Garlen', 58, false, 'Home, healing, protection, and community.'],
  ['Jaspree', 68, false, 'Nature, growth, and the wilderness.'],
  ['Lochost', 78, false, 'Freedom, rebellion, and liberation.'],
  ['Mynbruje', 88, false, 'Justice, truth, compassion, and empathy.'],
  ['Raggok', 98, true, 'Vengeance, pain, jealousy, and corruption.'],
  ['Thystonius', 108, false, 'Conflict, courage, and physical challenge.'],
  ['Upandal', 118, false, 'Building, planning, and cooperation.'],
  [
    'Vestrial',
    124,
    true,
    'Deception and manipulation in his corrupted aspect.',
  ],
] as const;

const devotionNames = [
  ...new Set(questorDevotionProgressions.flatMap(({ names }) => names)),
];
export const earthdawnQuestorDefinitions: EarthdawnDefinition[] =
  devotionNames.map((name) => {
    const eligibility = questorDevotionProgressions
      .filter(({ names }) => names.includes(name))
      .map(({ passion, tier, page }) => ({
        passion,
        tier,
        minimumQuestorRank: questorTierMinimumRank[tier],
        page,
      }));
    const passionList = eligibility.map(({ passion }) => passion).join(', ');
    const first = eligibility[0]!;
    return {
      ...entry(
        'devotion',
        name,
        'ed4.questors',
        first.page,
        `${name} is a verified Questor devotion available to ${passionList}.`,
        eligibility.map(({ passion, tier }) => `${passion} ${tier} devotion`),
      ),
      mechanics: JSON.stringify({ eligibility }),
    };
  });

const allEarthdawnSpellReferences = [
  ...earthdawnSpellReference,
  ...earthdawnSpellbookSupplement,
] as const;

export const earthdawnSpells: EarthdawnDefinition[] =
  allEarthdawnSpellReferences.map((rawSpell) => {
    const spell: EarthdawnSpellReference = rawSpell;
    const preferredVariant =
      (spell.legacyPlayerGuideId
        ? spell.variants.find(
            (variant) => variant.sourceId === 'ed4.players-guide',
          )
        : undefined) ?? spell.variants[0]!;
    const sourceId = spell.legacyPlayerGuideId
      ? 'ed4.players-guide'
      : preferredVariant.sourceId;
    const source = earthdawnSources.find(({ id }) => id === sourceId)!;
    return {
      id: `${sourceId}.spell.${slug(spell.name)}`,
      kind: 'spell',
      name: spell.name,
      summary: spell.description,
      mechanics: JSON.stringify({
        discipline: preferredVariant.discipline,
        circle: preferredVariant.circleMin,
        variants: spell.variants,
        threadsText: spell.threadsText,
        threadsValue: spell.threadsValue,
        difficultyText: spell.difficultyText,
        weavingDifficulty: spell.weavingDifficulty,
        reattuningDifficulty: spell.reattuningDifficulty,
        castingDifficulty: spell.castingDifficulty,
        castingText: spell.castingText,
        rangeText: spell.rangeText,
        durationText: spell.durationText,
        area: spell.area,
        keywords: spell.keywords,
        detailedEffects: spell.detailedEffects,
        successLevels: spell.successLevels,
        extraThreads: spell.extraThreads,
        effectText: spell.effectText,
      }),
      requirements: spell.variants.map(
        (variant) =>
          `${variant.discipline} ${
            variant.circleMin === variant.circleMax
              ? `Circle ${variant.circleMin}`
              : `Circles ${variant.circleMin}–${variant.circleMax}`
          }`,
      ),
      aliases: [...spell.aliases],
      sourceId,
      source: source.title,
      page: preferredVariant.pageStart,
      verification: 'verified',
      spellMetadata: spell,
    } satisfies EarthdawnDefinition;
  });

const named = (
  kind: EarthdawnCatalogKind,
  names: string[],
  sourceId: string,
  page: number,
) =>
  names.map((name) =>
    entry(
      kind,
      name,
      sourceId,
      page,
      `${name} is official ${earthdawnSources.find(({ id }) => id === sourceId)!.shortTitle} character content. Consult the cited page for its complete rules.`,
    ),
  );

const skillAttribute = (name: string): EarthdawnAttributeId => {
  const attributes: Partial<Record<string, EarthdawnAttributeId>> = {
    Acting: 'charisma',
    Alchemy: 'perception',
    'Acrobatic Defense': 'dexterity',
    'Air Sailing': 'willpower',
    'Animal Bond': 'charisma',
    'Animal Handling': 'willpower',
    'Animal Training': 'charisma',
    'Anticipate Blow': 'perception',
    'Arcane Mutterings': 'charisma',
    'Avoid Blow': 'dexterity',
    Awareness: 'perception',
    'Battle Bellow': 'charisma',
    'Battle Shout': 'charisma',
    'Blade Juggle': 'dexterity',
    Bribery: 'charisma',
    Charge: 'strength',
    Climbing: 'dexterity',
    'Conceal Object': 'dexterity',
    Conversation: 'charisma',
    'Craft Armor': 'perception',
    'Craft Weapon': 'perception',
    'Danger Sense': 'perception',
    Diplomacy: 'charisma',
    Disarm: 'dexterity',
    'Disarm Trap': 'dexterity',
    Disguise: 'perception',
    Distract: 'charisma',
    'Down Strike': 'strength',
    'Emotion Song': 'charisma',
    'Engaging Banter': 'charisma',
    Etiquette: 'charisma',
    'Evidence Analysis': 'perception',
    'Fast Hand': 'dexterity',
    'First Impression': 'charisma',
    Flirting: 'charisma',
    'Graceful Exit': 'charisma',
    'Great Leap': 'dexterity',
    Haggle: 'charisma',
    'Heartening Laugh': 'charisma',
    Hypnotize: 'charisma',
    'Impressive Display': 'charisma',
    Leadership: 'charisma',
    'Lock Picking': 'dexterity',
    Maneuver: 'dexterity',
    Mapmaking: 'perception',
    'Melee Weapons': 'dexterity',
    'Mimic Voice': 'charisma',
    'Missile Weapons': 'dexterity',
    'Mount Attack': 'dexterity',
    Navigation: 'perception',
    'Picking Pockets': 'dexterity',
    'Read and Write Language': 'perception',
    Research: 'perception',
    'Resist Taunt': 'willpower',
    Riposte: 'dexterity',
    'Second Attack': 'dexterity',
    'Second Shot': 'dexterity',
    'Second Weapon': 'dexterity',
    Seduction: 'charisma',
    'Shield Bash': 'strength',
    'Slough Blame': 'charisma',
    'Speak Language': 'perception',
    'Stealthy Stride': 'dexterity',
    Streetwise: 'charisma',
    'Sure Mount': 'strength',
    'Surprise Strike': 'strength',
    Swimming: 'strength',
    'Swift Kick': 'dexterity',
    Tactics: 'perception',
    Taunt: 'charisma',
    'Throwing Weapons': 'dexterity',
    Tracking: 'perception',
    'Trick Riding': 'dexterity',
    'Unarmed Combat': 'dexterity',
    'Wheeling Attack': 'dexterity',
    'Wheeling Defense': 'dexterity',
    'Wilderness Survival': 'perception',
    'Wound Balance': 'strength',
  };
  return attributes[name] ?? 'perception';
};

const skillDefinitions = (
  category: NonNullable<EarthdawnDefinition['skillCategory']>,
  names: string[],
  page: number,
) =>
  [...new Set(names)].map((name) => ({
    ...entry(
      'skill',
      name,
      'ed4.players-guide',
      page,
      `${name} is a Player’s Guide ${category} skill or published example.`,
    ),
    id: `ed4.players-guide.skill.${category}.${slug(name)}`,
    skillCategory: category,
    defaultAttribute:
      category === 'artisan'
        ? name === 'Craft Armor' ||
          name === 'Craft Weapon' ||
          name === 'Mapmaking'
          ? 'perception'
          : 'charisma'
        : category === 'knowledge' || category === 'language'
          ? 'perception'
          : skillAttribute(name),
  }));
const referenced = (
  kind: EarthdawnCatalogKind,
  names: string[],
  sourceId: string,
  page: number,
) =>
  named(kind, names, sourceId, page).map((definition) => ({
    ...definition,
    verification: 'reference-only' as const,
    summary: `${definition.name} is indexed as player-facing reference material, but its complete selectable mechanics have not been certified.`,
  }));
const priced = (
  kind: 'equipment' | 'weapon',
  rows: Array<[string, number, number]>,
  page: number,
) =>
  rows.map(([name, costSilver, weight]) => ({
    ...entry(
      kind,
      name,
      'ed4.players-guide',
      page,
      `${name} is verified Player’s Guide equipment. Price is recorded in silver-piece equivalents.`,
    ),
    costSilver,
    price:
      costSilver > 0 && costSilver < 1
        ? { amount: Math.round(costSilver * 100), denomination: 'cp' as const }
        : { amount: Math.round(costSilver), denomination: 'sp' as const },
    equipmentMetadata: {
      category: 'equipment',
      availability: '',
      weight,
      size: 0,
    },
    mechanics: JSON.stringify({ weight }),
  }));
const missileWeaponNames = new Set([
  'Blowgun',
  'Elven Warbow',
  'Light Crossbow',
  'Longbow',
  'Medium Crossbow',
  'Shortbow',
  'Sling',
  'Troll Sling',
  'Windling Bow',
]);
const throwingWeaponNames = new Set([
  'Bola',
  'Dart',
  'Flight Dagger',
  'Hawk Hatchet',
  'Throwing Axe',
  'Throwing Dagger',
]);
const weaponEntries = (
  rows: Array<[string, number, number, number, string, number, number, string]>,
) =>
  rows.map(
    ([
      name,
      damageStep,
      strengthMinimum,
      size,
      range,
      cost,
      weight,
      availability,
    ]) => {
      const weaponType = missileWeaponNames.has(name)
        ? ('missile' as const)
        : throwingWeaponNames.has(name)
          ? ('throwing' as const)
          : ('melee' as const);
      const [shortRange = '', longRange = ''] = range.split(/\s*\/\s*/);
      return {
        ...entry(
          'weapon',
          name,
          'ed4.players-guide',
          range ? 434 : 433,
          `${name} is a verified Player’s Guide weapon (${availability} availability).`,
        ),
        costSilver: cost,
        price:
          cost > 0 && cost < 1
            ? { amount: Math.round(cost * 100), denomination: 'cp' as const }
            : { amount: Math.round(cost), denomination: 'sp' as const },
        equipmentMetadata: {
          category: 'weapon',
          availability,
          weight,
          size,
          weaponType,
          shortRange,
          longRange,
        },
        mechanics: JSON.stringify({
          damageStep,
          strengthMinimum,
          size,
          range,
          weight,
          availability,
          weaponType,
        }),
      };
    },
  );
const armorEntries = (
  rows: Array<[string, number, number, number, number, number, string]>,
) =>
  rows.map(
    ([
      name,
      physicalArmor,
      mysticArmor,
      initiativePenalty,
      cost,
      weight,
      availability,
    ]) => ({
      ...entry(
        'equipment',
        name,
        'ed4.players-guide',
        435,
        `${name} is verified Player’s Guide armor or a shield (${availability} availability).`,
      ),
      costSilver: cost,
      price: { amount: Math.round(cost), denomination: 'sp' as const },
      equipmentMetadata: {
        category: 'armor',
        availability,
        weight,
        size: 0,
      },
      mechanics: JSON.stringify({
        weight,
        physicalArmor,
        mysticArmor,
        initiativePenalty,
        availability,
      }),
    }),
  );
const shieldEntries = (
  rows: Array<[string, number, number, number, number, number, number, string]>,
) =>
  rows.map(
    ([
      name,
      physicalDefense,
      mysticDefense,
      initiativePenalty,
      shatterThreshold,
      cost,
      weight,
      availability,
    ]) => ({
      ...entry(
        'equipment',
        name,
        'ed4.players-guide',
        435,
        `${name} is a verified Player’s Guide shield (${availability} availability).`,
      ),
      costSilver: cost,
      price: { amount: Math.round(cost), denomination: 'sp' as const },
      equipmentMetadata: {
        category: 'shield',
        availability,
        weight,
        size: 0,
      },
      mechanics: JSON.stringify({
        weight,
        physicalDefense,
        mysticDefense,
        initiativePenalty,
        shatterThreshold,
        availability,
      }),
    }),
  );
const generatedEarthdawnKnacks: EarthdawnDefinition[] =
  earthdawnKnackReference.map((reference) => {
    const primary =
      reference.variants.find(({ sourceId }) => sourceId === 'ed4.companion') ??
      reference.variants[0]!;
    const source = earthdawnSources.find(({ id }) => id === primary.sourceId)!;
    return {
      id: `${reference.legacyCompanionId ? 'ed4.companion' : primary.sourceId}.knack.${slug(reference.name)}`,
      kind: 'knack',
      name: reference.name,
      summary: primary.description,
      mechanics: primary.mechanicsText,
      requirements: [
        ...new Set(reference.variants.map(({ association }) => association)),
      ],
      aliases: [],
      sourceId: primary.sourceId,
      source: source.title,
      page: primary.page,
      verification: 'verified',
      knackMetadata: { variants: reference.variants },
    };
  });
const matrixSharingKnackRows = [
  [
    'Squeeze Phantom Astral Spear',
    1,
    5,
    5,
    1,
    392,
    ['Phantom Astral Spear', 'Astral Spear'],
  ],
  [
    'Squeeze Phantom Crow Tear',
    1,
    5,
    5,
    1,
    393,
    ['Phantom Crow Tear', 'Invoke Crow Tear'],
  ],
  [
    'Squeeze Phantom Espagra Frenzy',
    8,
    10,
    10,
    1,
    393,
    ['Phantom Espagra Frenzy', 'Invoke Espagra Frenzy'],
  ],
  [
    'Squeeze Phantom Fireball',
    5,
    7,
    7,
    1,
    394,
    ['Phantom Fireball', 'Fireball'],
  ],
  ['Squeeze Phantom Flame', 2, 5, 5, 1, 394, ['Phantom Flame', 'Flash Flame']],
  [
    'Squeeze Phantom Lightning',
    4,
    6,
    6,
    1,
    394,
    ['Phantom Lightning', 'Lightning Bolt'],
  ],
  [
    'Squeeze Phantom Liquid Arrow',
    2,
    5,
    5,
    1,
    394,
    ['Phantom Liquid Arrow', 'Liquid Arrow'],
  ],
  [
    'Squeeze Phantom Star Shower',
    7,
    9,
    9,
    1,
    395,
    ['Phantom Star Shower', 'Star Shower'],
  ],
  ['Squeeze Switch', 5, 7, 7, 2, 399, ['Switch', 'True Switch']],
  ['Squeeze True Switch', 6, 9, 9, 2, 400, ['True Switch', 'Form Exchange']],
] as const;
const matrixSharingKnacks: EarthdawnDefinition[] = matrixSharingKnackRows.map(
  ([
    name,
    knackCircle,
    minimumRank,
    disciplineCircle,
    damage,
    page,
    requiredSpells,
  ]) => {
    const sourceId = 'ed4.deeper-secrets';
    const description = `${name} passively allows its paired spells to be squeezed into one eligible spell matrix.`;
    return {
      id: `ed4.user-matrix-reference.knack.${slug(name)}`,
      kind: 'knack',
      name,
      summary: description,
      mechanics:
        `${damage} Blood Magic Damage is suffered when placing the paired spells. ` +
        'Cannot be used with Shared Matrices, divided matrices, or external spell matrix objects. Removing either spell removes the entire squeezed group.',
      requirements: [
        `Patterncraft Rank ${minimumRank}`,
        `Illusionist Circle ${disciplineCircle}`,
        ...requiredSpells.map((spell) => `Know ${spell}`),
      ],
      aliases: [],
      sourceId,
      source: earthdawnSources.find(({ id }) => id === sourceId)!.title,
      page,
      verification: 'verified',
      knackMetadata: {
        variants: [
          {
            key: `ed4.user-matrix-reference:${slug(name)}:patterncraft`,
            association: 'Patterncraft',
            description,
            mechanicsText:
              `${damage} Blood Magic Damage is suffered during placement. ` +
              'Not compatible with Shared, divided, or external matrices. Removing one spell removes all spells in the squeezed group.',
            minimumRank,
            actionText: 'Passive (spell matrix attunement)',
            strainText: `${damage} Blood Magic Damage when placing paired spells`,
            strainValue: damage,
            sourceId,
            page,
            knackCircle,
            discipline: 'Illusionist',
            disciplineCircle,
            requiredSpells,
            requiredTalentRanks: [{ name: 'Patterncraft', rank: minimumRank }],
            bloodMagicDamage: damage,
            matrixRestriction: 'squeeze',
          },
        ],
      },
    };
  },
);
const encodedCommunique: EarthdawnDefinition = (() => {
  const name = 'Encoded Communique';
  const description =
    'When casting Send Message with one thread, the message is automatically encrypted as Encrypt against anyone except the intended recipient. Encrypt and Send Message may share a spell matrix.';
  const variant = (sourceId: string, page: number, key: string) => ({
    key,
    association: 'Patterncraft',
    description,
    mechanicsText:
      'Passive improved spell knack. Costs 1 Strain when used. Requires Patterncraft Rank 5, Messenger Rank 3, Encrypt, Send Message, and Illusionist Circle 7.',
    minimumRank: 5,
    actionText: 'Passive (when casting Send Message)',
    strainText: '1',
    strainValue: 1,
    sourceId,
    page,
    knackCircle: 1,
    discipline: 'Illusionist',
    disciplineCircle: 7,
    requiredSpells: ['Encrypt', 'Send Message'],
    requiredTalentRanks: [
      { name: 'Patterncraft', rank: 5 },
      { name: 'Messenger', rank: 3 },
    ],
  });
  const primary = variant(
    'ed4.deeper-secrets',
    399,
    'ed4.user-matrix-reference:encoded-communique:patterncraft',
  );
  return {
    id: 'ed4.user-matrix-reference.knack.encoded-communique',
    kind: 'knack',
    name,
    summary: description,
    mechanics: primary.mechanicsText,
    requirements: [
      'Patterncraft Rank 5',
      'Messenger Rank 3',
      'Know Encrypt and Send Message',
      'Illusionist Circle 7',
    ],
    aliases: ['Encoded Communiqué'],
    sourceId: primary.sourceId,
    source: earthdawnSources.find(({ id }) => id === primary.sourceId)!.title,
    page: primary.page,
    verification: 'verified',
    knackMetadata: {
      variants: [
        primary,
        variant(
          'ed4.mystic-paths',
          248,
          'ed4.mystic-paths:encoded-communique:patterncraft',
        ),
      ],
    },
  };
})();
export const earthdawnKnacks: EarthdawnDefinition[] = [
  ...generatedEarthdawnKnacks,
  encodedCommunique,
  ...matrixSharingKnacks,
];
const companionThreadItems: EarthdawnDefinition[] = companionThreadItemRows.map(
  ([name, page]) => ({
    ...entry(
      'thread-item',
      name,
      'ed4.companion',
      page,
      `${name} is a verified Companion thread item. Record key knowledges, deeds, and unlocked rank effects on the character’s editable thread record.`,
    ),
    mechanics: JSON.stringify({ rankType: 'normal' }),
    threadItemMetadata: {
      itemType: 'Thread Item',
      descriptionText: `${name} is a verified Companion thread item.`,
      inferredKeyKnowledge: '',
      provenance: 'catalog',
    },
  }),
);
const companionThreadNames = new Set(
  companionThreadItems.map(({ name }) => name.toLocaleLowerCase()),
);
const companionThreadIds = new Set(companionThreadItems.map(({ id }) => id));
export const earthdawnThreadItems: EarthdawnDefinition[] = [
  ...companionThreadItems.map((definition) => {
    const workbook = earthdawnThreadItemReferenceRows.find(
      ([name, , , , sourceId]) =>
        name.toLocaleLowerCase() === definition.name.toLocaleLowerCase() ||
        `${sourceId}.thread-item.${slug(name)}` === definition.id,
    );
    return workbook
      ? {
          ...definition,
          summary: workbook[2] || definition.summary,
          mechanics: JSON.stringify({
            rankType: 'normal',
            itemType: workbook[1],
          }),
          threadItemMetadata: {
            itemType: workbook[1],
            descriptionText: workbook[2],
            inferredKeyKnowledge: workbook[3],
            provenance: 'workbook' as const,
          },
        }
      : definition;
  }),
  ...earthdawnThreadItemReferenceRows
    .filter(
      ([name, , , , sourceId]) =>
        !companionThreadNames.has(name.toLocaleLowerCase()) &&
        !companionThreadIds.has(`${sourceId}.thread-item.${slug(name)}`),
    )
    .map(
      ([
        name,
        itemType,
        description,
        inferredKeyKnowledge,
        sourceId,
        page,
      ]) => ({
        ...entry('thread-item', name, sourceId, page ?? 1, description),
        page,
        mechanics: JSON.stringify({ rankType: 'normal', itemType }),
        threadItemMetadata: {
          itemType,
          descriptionText: description,
          inferredKeyKnowledge,
          provenance: 'workbook' as const,
        },
      }),
    ),
];

const workbookSkills: EarthdawnDefinition[] = earthdawnSkillReferenceRows.map(
  ([name, category, description, sourceId, page]) => ({
    ...entry('skill', name, sourceId, page ?? 1, description),
    id: `${sourceId}.skill.${category}.${slug(name)}`,
    page,
    skillCategory: category,
    defaultAttribute: skillAttribute(name),
  }),
);
const currencyReferenceEntries: EarthdawnDefinition[] = [
  ['Earth Coin', 'A plain brown True earth coin worth 100 silver pieces.', 100],
  [
    'Water Coin',
    'A damp, blue-green True water coin worth 100 silver pieces.',
    100,
  ],
  ['Air Coin', 'A crystal-like True air coin worth 1,000 silver pieces.', 1000],
  ['Fire Coin', 'A sparking True fire coin worth 1,000 silver pieces.', 1000],
  [
    'Orichalcum Coin',
    'A rare gold-orange coin worth 10,000 silver pieces.',
    10000,
  ],
  ['Copper Trilem', 'An Iopan hoop of three copper crescents.', 0],
  ['Silver Trilem', 'An Iopan hoop worth three silver pieces.', 3],
  ['Gold Trilem', 'An Iopan hoop worth three gold pieces.', 30],
  ['Hacksilver', 'Broken Theran silver traded by weight; value varies.', 0],
  [
    'Gemstone or Valuable',
    'A portable valuable whose redemption value varies.',
    0,
  ],
].map(([name, summary, silverValue]) => ({
  ...entry(
    'equipment',
    String(name),
    'ed4.user-currency-reference',
    1,
    String(summary),
  ),
  page: null,
  verification: 'reference-only' as const,
  costSilver: Number(silverValue),
  price:
    name === 'Copper Trilem'
      ? { amount: 3, denomination: 'cp' as const }
      : name === 'Gold Trilem'
        ? { amount: 3, denomination: 'gp' as const }
        : {
            amount: Math.round(Number(silverValue)),
            denomination: 'sp' as const,
          },
  equipmentMetadata: {
    category: 'currency-reference',
    availability: 'Varies',
    weight: 0.1,
    size: 0,
  },
  mechanics: JSON.stringify({
    category: 'currency-reference',
    provenance: 'User-supplied reference; authoritative page citation pending',
  }),
}));
const earthdawnCatalogRows: EarthdawnDefinition[] = [
  ...earthdawnBasicRules,
  ...earthdawnCreationRules,
  ...earthdawnRaces,
  ...earthdawnDisciplines,
  ...earthdawnQuestorDefinitions,
  ...earthdawnSpells,
  ...earthdawnKnacks,
  ...earthdawnThreadItems,
  ...earthdawnTalents,
  ...currencyReferenceEntries,
  ...skillDefinitions(
    'general',
    [
      'Acting',
      'Alchemy',
      'Acrobatic Defense',
      'Air Sailing',
      'Animal Bond',
      'Animal Handling',
      'Animal Training',
      'Anticipate Blow',
      'Arcane Mutterings',
      'Avoid Blow',
      'Awareness',
      'Battle Shout',
      'Bribery',
      'Charge',
      'Climbing',
      'Conversation',
      'Danger Sense',
      'Diplomacy',
      'Disarm Trap',
      'Distract',
      'Emotion Song',
      'Engaging Banter',
      'Etiquette',
      'First Impression',
      'Flirting',
      'Graceful Exit',
      'Great Leap',
      'Haggle',
      'Heartening Laugh',
      'Lock Picking',
      'Maneuver',
      'Melee Weapons',
      'Mimic Voice',
      'Missile Weapons',
      'Navigation',
      'Picking Pockets',
      'Research',
      'Seduction',
      'Shield Bash',
      'Stealthy Stride',
      'Streetwise',
      'Sure Mount',
      'Surprise Strike',
      'Swift Kick',
      'Taunt',
      'Throwing Weapons',
      'Tracking',
      'Trick Riding',
      'Unarmed Combat',
      'Wilderness Survival',
      'Wound Balance',
      'Battle Bellow',
      'Blade Juggle',
      'Conceal Object',
      'Disarm',
      'Down Strike',
      'Evidence Analysis',
      'Fast Hand',
      'Hypnotize',
      'Impressive Display',
      'Leadership',
      'Mount Attack',
      'Resist Taunt',
      'Riposte',
      'Second Attack',
      'Second Shot',
      'Second Weapon',
      'Slough Blame',
      'Tactics',
      'Wheeling Attack',
      'Wheeling Defense',
      'Craft Armor',
      'Craft Weapon',
      'Disguise',
      'Forgery',
      'Mapmaking',
      'Physician',
      'Pilot Boat',
      'Sailing',
      'Swimming',
    ],
    185,
  ),
  ...skillDefinitions(
    'artisan',
    [
      'Acting',
      'Baking',
      'Basket Weaving',
      'Body Painting',
      'Carving',
      'Cooking',
      'Craft Armor',
      'Craft Weapon',
      'Dancing',
      'Embroidery',
      'Juggling',
      'Mapmaking',
      'Musician',
      'Poetry',
      'Rune Carving',
      'Sculpting',
      'Singing',
      'Storytelling',
      'Tattooing',
      'Wardrobe and Style',
    ],
    193,
  ),
  ...skillDefinitions(
    'knowledge',
    [
      'Barsaive Politics',
      'Barsaivian Cuisine',
      'Botany',
      'Current Throal Politics',
      'Theran Cuisine',
      'Throal Cuisine',
      'Throal History',
      'Throal Military',
      'Throal Politics',
      'T’skrang Lore',
    ],
    188,
  ),
  ...skillDefinitions(
    'language',
    [
      ...[
        'Dwarf (Throalic)',
        'Sperethiel',
        'Human',
        'Obsidiman',
        'Or’zet',
        'Troll',
        'T’skrang',
        'Windling',
      ].flatMap((language) => [`Speak ${language}`, `Read/Write ${language}`]),
    ],
    191,
  ),
  ...workbookSkills,
  ...priced(
    'equipment',
    [
      ['Adventurer’s Kit', 15, 14],
      ['Adventurer’s Kit with Tent', 40, 34],
      ['Backpack', 5, 3],
      ['Climbing Kit', 36, 19],
      ['Healing Potion', 300, 2],
      ['Leather Armor', 10, 15],
      ['Chain Mail', 180, 40],
      ['Padded Cloth', 2, 5],
      ['Padded Leather', 20, 20],
      ['Ring Mail', 110, 30],
    ],
    433,
  ),
  ...weaponEntries([
    ['Battle Axe', 7, 13, 5, '', 35, 6, 'Average'],
    ['Broadsword', 5, 12, 3, '', 25, 4, 'Average'],
    ['Club', 3, 7, 2, '', 2, 3, 'Average'],
    ['Dagger', 2, 4, 1, '2–10 / 11–20', 0.08, 1, 'Average'],
    ['Dwarf Sword', 4, 12, 2, '', 6, 2, 'Average'],
    ['Flail', 5, 10, 3, '', 35, 5, 'Average'],
    ['Hand Axe', 4, 8, 2, '', 15, 3, 'Average'],
    ['Knife', 1, 3, 1, '2–8 / 9–16', 0.03, 0.625, 'Everyday'],
    ['Lance', 6, 14, 6, '', 150, 10, 'Unusual'],
    ['Long Spear', 5, 13, 5, '', 15, 7, 'Average'],
    ['Mace', 4, 13, 3, '', 20, 5, 'Average'],
    ['Pole Axe', 8, 16, 6, '', 150, 10, 'Unusual'],
    ['Quarterstaff', 4, 6, 5, '', 5, 4, 'Average'],
    ['Sap', 1, 3, 1, '', 3, 2, 'Average'],
    ['Short Sword', 4, 8, 2, '', 16, 3, 'Average'],
    ['Spear', 4, 9, 3, '2–10 / 11–20', 9, 3, 'Average'],
    ['Spiked Mace', 6, 13, 4, '', 40, 7, 'Average'],
    ['Trispear', 5, 11, 4, '', 25, 4, 'Average'],
    ['Troll Axe', 8, 17, 6, '', 45, 8, 'Unusual'],
    ['Troll Sword', 6, 13, 4, '', 50, 6, 'Average'],
    ['Two-Handed Sword', 8, 15, 6, '', 125, 7, 'Unusual'],
    ['Warhammer', 7, 15, 5, '', 95, 8, 'Unusual'],
    ['Whip', 3, 7, 3, '3 yards', 10, 2, 'Average'],
    ['Windling Spear', 2, 4, 1, '2–8 / 9–16', 25, 0.5, 'Unusual'],
    ['Windling Sword', 3, 6, 1, '', 45, 1, 'Unusual'],
    ['Blowgun', 1, 3, 1, '2–8 / 9–16', 2, 0.625, 'Unusual'],
    ['Elven Warbow', 5, 12, 5, '2–48 / 49–96', 200, 4, 'Rare'],
    ['Light Crossbow', 4, 9, 3, '2–32 / 33–64', 50, 5, 'Average'],
    ['Longbow', 4, 11, 5, '2–40 / 41–80', 60, 4, 'Average'],
    ['Medium Crossbow', 5, 12, 4, '2–40 / 41–80', 100, 7, 'Unusual'],
    ['Shortbow', 3, 8, 3, '2–30 / 31–60', 15, 3, 'Average'],
    ['Sling', 2, 5, 2, '2–20 / 21–40', 3, 1, 'Average'],
    ['Troll Sling', 4, 10, 4, '2–30 / 31–60', 15, 4, 'Average'],
    ['Windling Bow', 3, 5, 2, '2–24 / 25–48', 25, 0.875, 'Average'],
    ['Bola', 3, 6, 2, '2–12 / 13–24', 10, 2, 'Average'],
    ['Dart', 1, 4, 1, '2–18 / 19–36', 0.03, 0.5, 'Average'],
    ['Flight Dagger', 2, 4, 1, '2–20 / 21–40', 25, 0.75, 'Unusual'],
    ['Hawk Hatchet', 4, 8, 3, '2–24 / 25–48', 75, 2, 'Unusual'],
    ['Throwing Axe', 3, 7, 3, '2–12 / 13–24', 25, 2, 'Average'],
    ['Throwing Dagger', 2, 4, 1, '2–16 / 17–32', 2, 0.75, 'Average'],
  ]),
  ...armorEntries([
    ['Blood Pebble', 5, 3, 1, 300, 0, 'Rare'],
    ['Crystal Plate', 7, 7, 5, 12000, 90, 'Rare'],
    ['Crystal Ringlet', 4, 4, 2, 500, 45, 'Rare'],
    ['Espagra Cloak', 3, 1, 0, 200, 10, 'Rare'],
    ['Fernweave', 2, 3, 0, 125, 15, 'Unusual'],
    ['Hardened Leather', 5, 0, 1, 40, 20, 'Average'],
    ['Hide Armor', 5, 1, 1, 50, 25, 'Average'],
    ['Living Crystal', 6, 3, 2, 1100, 0, 'Rare'],
    ['Obsidiman Skin', 3, 1, 0, 100, 20, 'Rare'],
    ['Plate Armor', 9, 0, 4, 3000, 60, 'Unusual'],
    ['Wyvern Skin', 8, 1, 3, 2000, 50, 'Rare'],
  ]),
  ...shieldEntries([
    ['Body Shield', 3, 0, 2, 21, 50, 15, 'Unusual'],
    ['Buckler', 1, 0, 0, 17, 5, 3, 'Average'],
    ['Crystal Buckler', 1, 1, 0, 17, 50, 5, 'Rare'],
    ['Crystal Raider Shield', 2, 2, 2, 18, 150, 15, 'Rare'],
    ['Ferndask Shield', 1, 2, 2, 16, 22, 5, 'Unusual'],
    ['Footman’s Shield', 2, 0, 1, 19, 15, 10, 'Average'],
    ['Rider’s Shield', 2, 0, 1, 19, 20, 8, 'Average'],
  ]),
  ...priced(
    'equipment',
    [
      ['Bedroll of Comfort', 340, 2],
      ['Boots, Dry', 250, 2],
      ['Boots, Huntsman', 700, 2],
      ['Cleaning Broom', 25, 2],
      ['Dwarf Winternight Cloak', 275, 2],
      ['Everclean Cloak', 275, 1],
      ['Warm Cloak', 300, 2],
      ['Divining Rod', 75, 1],
      ['Elfweave Robe', 80, 2],
      ['Fire Starter', 100, 2],
      ['Firefly Chalk', 12, 0],
      ['Heat Stone', 100, 3],
      ['Hot Pot', 100, 8],
      ['Small Light Quartz', 75, 2],
      ['Medium Light Quartz', 125, 6],
      ['Large Light Quartz', 200, 20],
      ['Light Quartz Weapon', 100, 1],
      ['Message Stone', 300, 2],
      ['Warded Message Stone', 600, 2],
      ['One-Size Hat', 35, 1],
      ['Orichalcum Container', 5000, 1],
      ['Small Pot of Grumbah', 75, 2],
      ['Large Pot of Grumbah', 200, 5],
      ['Pure Water Pot', 150, 2],
      ['Quiet Fingers Gloves', 140, 1],
      ['Quiet Pouch', 65, 2],
      ['Season Lamp', 350, 0],
      ['Traveler’s Mug', 350, 1],
      ['Upandal’s Blessings', 275, 3],
      ['Wind Instrument', 250, 2],
    ],
    436,
  ),
  ...priced(
    'equipment',
    [
      ['Absorb Blow Charm', 100, 1],
      ['Astral-Sensitive Eye', 325, 1],
      ['Bone Charm', 175, 1],
      ['Darksight Eye', 200, 1],
      ['Death Cheat Charm', 450, 1],
      ['Desperate Blow Charm', 275, 1],
      ['Desperate Spell Charm', 300, 1],
      ['Garlen Stone', 250, 1],
      ['Horn Needle', 450, 1],
      ['Horror Fend', 500, 1],
      ['Initiative Booster', 600, 1],
      ['Strength Booster', 300, 1],
      ['Targeting Eye', 450, 1],
      ['Wound Balance Charm', 200, 1],
      ['Booster Potion', 50, 2],
      ['Cure Disease Potion', 500, 2],
      ['Halt Illness Potion', 100, 1],
      ['Kelia’s Antidote', 125, 2],
      ['Kelix’s Poultice', 50, 1],
      ['Last Chance Salve', 600, 1],
      ['Salve of Closure', 200, 1],
    ],
    437,
  ),
  ...priced(
    'equipment',
    [
      ['Alchemist’s Kit', 500, 15],
      ['Carving Tools', 15, 3],
      ['Embroidery and Sewing Tools', 25, 1],
      ['Forge Tools', 100, 20],
      ['Painting Tools', 45, 2],
      ['Sculpting Tools', 30, 3],
      ['Bedroll', 5, 4],
      ['Belt Pouch', 0.08, 1],
      ['Blanket', 0.15, 2],
      ['Heavy Chain, 10 feet', 50, 9],
      ['Light Chain, 10 feet', 10, 6],
      ['Craftsman Tools', 25, 5],
      ['Disguise Kit', 50, 6],
      ['Fishing Kit', 20, 14],
      ['Fishing Net', 15, 10],
      ['Flint and Steel', 1, 0.5],
      ['Grappling Hook', 10, 5],
      ['Basic Healing Kit', 75, 5],
      ['Healing Kit Refill', 50, 0],
      ['Iron Pot', 20, 8],
      ['Hooded Lantern', 9, 3],
      ['Bullseye Lantern', 27, 3],
      ['Light Quartz Lantern', 85, 5],
      ['Map or Scroll Case', 0.08, 1],
    ],
    438,
  ),
  ...priced(
    'equipment',
    [
      ['Drum', 7, 5],
      ['Flute', 2, 2],
      ['Horn', 70, 7],
      ['Lute', 25, 6],
      ['Whistle', 0.02, 1],
      ['Navigation Charts', 15, 2],
      ['Oil Flask', 6, 1],
      ['Basic Physician’s Kit', 50, 3],
      ['Physician’s Kit Refill', 25, 1],
      ['Paper or Parchment', 1, 0],
      ['Quill Pen', 1, 0],
      ['Rope, per yard', 3, 1],
      ['Sack', 2, 2],
      ['Tent', 30, 20],
      ['Thieves’ Picks and Tools', 100, 1],
      ['Torch', 0.05, 1],
      ['Whetstone', 0.02, 1],
      ['Water or Wine Skin', 2, 4],
      ['Writing Ink', 10, 0.5],
      ['Writing Kit', 23, 2],
    ],
    439,
  ),
  ...named(
    'thread-item',
    ['Thread Item', 'Group True Pattern', 'Pattern Item'],
    'ed4.gamemasters-guide',
    197,
  ),
  ...referenced(
    'equipment',
    ['Blood Ink', 'Blood Charm', 'The Edge of Travar'],
    'ed4.travar',
    273,
  ),
  ...referenced('path', ['Marauder', 'Avowed'], 'ed4.vasgothia', 183),
  ...earthdawnPathProfiles.map((path) => ({
    id: `ed4.path.${path.id}`,
    kind: 'path' as const,
    name: path.name,
    summary: path.summary,
    mechanics: [
      `Initiation: ${path.initiationCost} LP; ${path.bloodMagicDamage} Blood Magic Damage.`,
      `Minimum Circle ${path.minimumCircle}; maximum Rank ${path.maximumRank}; ${path.talentCostTier} tier.`,
      path.ordeal,
      path.rankBonuses
        .map(({ rank, label }) => `Rank ${rank}: ${label}`)
        .join('; '),
      path.halfMagic,
      path.karmaRitual,
      path.advancement,
      ...path.restrictions,
    ]
      .filter(Boolean)
      .join(' '),
    requirements: path.requirements.map((requirement) =>
      requirement.kind === 'manual'
        ? requirement.description
        : requirement.kind === 'knowledge-skill'
          ? `Knowledge Skill Rank ${requirement.rank}`
          : `${requirement.name} Rank ${requirement.rank}`,
    ),
    aliases: [],
    sourceId: path.sourceId,
    source: path.citation,
    page: path.page,
    verification: path.verified
      ? ('verified' as const)
      : ('reference-only' as const),
  })),
];
const mergedCatalog = new Map<string, EarthdawnDefinition>();
for (const definition of earthdawnCatalogRows) {
  const key =
    definition.kind === 'skill'
      ? `skill:${definition.skillCategory}:${definition.name.toLocaleLowerCase()}`
      : definition.id;
  const existing = mergedCatalog.get(key);
  if (!existing) {
    mergedCatalog.set(key, definition);
    continue;
  }
  if (definition.kind === 'skill') {
    mergedCatalog.set(key, {
      ...definition,
      id: existing.id,
      aliases: [...new Set([...existing.aliases, ...definition.aliases])],
    });
  }
}
export const earthdawnCatalog: EarthdawnDefinition[] = [
  ...mergedCatalog.values(),
];
export const earthdawnDefinitionById = new Map(
  earthdawnCatalog.map((value) => [value.id, value]),
);
