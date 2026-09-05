export const LEGEND_SOURCE = 'Legend in the Mist Core Book Vol. I · The Hero';

export type LegendMight = 'origin' | 'adventure' | 'greatness';

export interface LegendCitation {
  source: typeof LEGEND_SOURCE;
  page: number;
  verified: true;
}

export interface LegendQuestion {
  id: string;
  prompt: string;
  required?: boolean;
}

export interface LegendThemebookDefinition extends LegendCitation {
  id: string;
  name: string;
  might: LegendMight | 'variable';
  summary: string;
  powerQuestions: readonly LegendQuestion[];
  weaknessQuestions: readonly LegendQuestion[];
}

export interface LegendThemeKitDefinition extends LegendCitation {
  id: string;
  name: string;
  themebookId: string;
  might: LegendMight;
  summary: string;
  aliases: readonly string[];
}

export interface LegendTropeDefinition extends LegendCitation {
  id: string;
  name: string;
  category: string;
  summary: string;
  fixedKitIds: readonly string[];
  optionalKitIds: readonly string[];
  backpackSuggestions: readonly string[];
}

export interface LegendSpecialImprovementDefinition extends LegendCitation {
  id: string;
  name: string;
  themebookId: string;
  summary: string;
}

export interface LegendMagicWayDefinition extends LegendCitation {
  id: string;
  name: string;
  summary: string;
  trackLabel: string;
  itemLabel: string;
  optionalVariants: readonly string[];
}

export interface LegendStoreItemDefinition extends LegendCitation {
  id: string;
  name: string;
  category: string;
  summary: string;
  defaultUsage: 'standard' | 'single-use' | 'consumable';
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/\[deity\]/g, 'deity')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const citation = (page: number): LegendCitation => ({
  source: LEGEND_SOURCE,
  page,
  verified: true,
});

const powerPrompts = (name: string, subject: string): LegendQuestion[] => [
  {
    id: 'a',
    prompt: `What ${subject} defines this ${name} theme?`,
    required: true,
  },
  { id: 'b', prompt: `What related ability or quality serves you most?` },
  { id: 'c', prompt: `What useful technique can you call upon?` },
  { id: 'd', prompt: `What item, ally, or resource supports this theme?` },
  { id: 'e', prompt: `Where or when is this theme especially useful?` },
  { id: 'f', prompt: `What practiced approach helps you avoid trouble?` },
  { id: 'g', prompt: `Who recognizes or benefits from this part of you?` },
  { id: 'h', prompt: `What insight does this theme give you?` },
  { id: 'i', prompt: `What distinctive style or habit belongs to it?` },
  { id: 'j', prompt: `What surprising benefit can it provide?` },
];

const weaknessPrompts = (name: string): LegendQuestion[] => [
  { id: 'a', prompt: `What is the central limitation of this ${name} theme?` },
  { id: 'b', prompt: `Who or what commonly works against it?` },
  { id: 'c', prompt: `When does this theme become unreliable or harmful?` },
  { id: 'd', prompt: `What difficult behavior or obligation comes with it?` },
];

const themebookRows = [
  [
    'circumstance',
    'Circumstance',
    'origin',
    88,
    'your place, standing, or situation',
    'Your current place in life shapes what you can do and what stands in your way.',
  ],
  [
    'devotion',
    'Devotion',
    'origin',
    90,
    'person, group, or ideal you serve',
    'A loyalty gives you purpose, aid, obligations, and vulnerabilities.',
  ],
  [
    'past',
    'Past',
    'origin',
    92,
    'formative event or former life',
    'A defining experience still grants lessons, connections, and unfinished trouble.',
  ],
  [
    'people',
    'People',
    'origin',
    94,
    'heritage, culture, or ancestry',
    'Your people provide shared traits, customs, knowledge, and social ties.',
  ],
  [
    'personality',
    'Personality',
    'origin',
    96,
    'temperament or personal style',
    'Your habitual way of meeting the world can inspire, protect, or complicate.',
  ],
  [
    'skill-or-trade',
    'Skill or Trade',
    'origin',
    98,
    'everyday skill, craft, or profession',
    'Practice and tools let you handle the ordinary demands of your vocation.',
  ],
  [
    'trait',
    'Trait',
    'origin',
    100,
    'innate physical, mental, or heartfelt quality',
    'One natural quality or unusual gift consistently sets you apart.',
  ],
  [
    'duty',
    'Duty',
    'adventure',
    102,
    'oath, undertaking, or responsibility',
    'A serious charge grants backing and purpose while demanding sacrifice.',
  ],
  [
    'influence',
    'Influence',
    'adventure',
    104,
    'position, following, or social reach',
    'Standing and connections let you direct people and gain resources.',
  ],
  [
    'knowledge',
    'Knowledge',
    'adventure',
    106,
    'rare body of lore',
    'Specialized understanding reveals answers unavailable to ordinary folk.',
  ],
  [
    'prodigious-ability',
    'Prodigious Ability',
    'adventure',
    108,
    'remarkable practiced capability',
    'Exceptional talent makes difficult feats reliable and impressive.',
  ],
  [
    'relic',
    'Relic',
    'adventure',
    110,
    'enchanted or mysterious item',
    'A singular item provides supernatural power and carries its own burdens.',
  ],
  [
    'uncanny-being',
    'Uncanny Being',
    'adventure',
    112,
    'supernatural nature or form',
    'Your nonhuman nature grants capabilities and limitations beyond mortals.',
  ],
  [
    'destiny',
    'Destiny',
    'greatness',
    114,
    'fate or prophecy that claims you',
    'Fate bends events toward a world-shaping destination.',
  ],
  [
    'dominion',
    'Dominion',
    'greatness',
    116,
    'realm, people, or institution you rule',
    'Authority over a great domain brings immense reach and responsibility.',
  ],
  [
    'mastery',
    'Mastery',
    'greatness',
    118,
    'art or field you have perfected',
    'You stand among the greatest exemplars of a world-changing discipline.',
  ],
  [
    'monstrosity',
    'Monstrosity',
    'greatness',
    120,
    'legendary and overwhelming nature',
    'You are a being of mythic scale whose power and troubles reshape realms.',
  ],
  [
    'companion',
    'Companion',
    'variable',
    122,
    'ally who remains at your side',
    'A loyal follower, partner, or creature acts as a recurring part of your story.',
  ],
  [
    'magic',
    'Magic',
    'variable',
    124,
    'supernatural art or gift',
    'Your command of the supernatural ranges from household wonders to world-shaping power.',
  ],
  [
    'possessions',
    'Possessions',
    'variable',
    126,
    'important equipment or assets',
    'Belongings and resources are central enough to become part of who you are.',
  ],
] as const;

export const legendThemebooks: readonly LegendThemebookDefinition[] =
  themebookRows.map(([id, name, might, page, subject, summary]) => ({
    id: `litm.themebook.${id}`,
    name,
    might,
    summary,
    powerQuestions: powerPrompts(name, subject),
    weaknessQuestions: weaknessPrompts(name),
    ...citation(page),
  }));

type KitRow = readonly [string, number, LegendMight, readonly string[]];

const kitRows: readonly KitRow[] = [
  [
    'circumstance',
    88,
    'origin',
    [
      'Alderperson',
      'Fugitive',
      'Hardworking Drudge',
      'Landed Noble',
      'Outcast',
      'Tavern Brawler',
    ],
  ],
  [
    'devotion',
    90,
    'origin',
    [
      'Ailing Wise Elder',
      'Become a Knight',
      'Childhood Sweetheart',
      'Heal the Sick',
      'Our Village',
      'Ritualistic Circle',
    ],
  ],
  [
    'past',
    92,
    'origin',
    [
      'Cursed',
      'Forged in War',
      'Highborn Education',
      'Last of My Kind',
      'Mystic Pilgrimage',
      'Well-Traveled',
    ],
  ],
  [
    'people',
    94,
    'origin',
    [
      'Battlerider',
      'Beaver Kin',
      'Caravan Folk',
      'Highlander',
      'Sylvan Elf',
      'Witchblood',
    ],
  ],
  [
    'personality',
    96,
    'origin',
    [
      'Curious',
      'Gruff',
      'Heart of Gold',
      'Jovial Disposition',
      'Practiced Liar',
      'Rumormonger',
    ],
  ],
  [
    'skill-or-trade',
    98,
    'origin',
    [
      'Artisan',
      'Blacksmith',
      'Hinterland Tracker',
      'Homesteader',
      'Skirmisher',
      'Sleight of Hand',
    ],
  ],
  [
    'trait',
    100,
    'origin',
    [
      'Acrobatic Agility',
      'Prophetic Visions',
      'Strong as an Ox',
      'Tenacious',
      'Uncommon Beauty',
      'Underwater Deftness',
    ],
  ],
  [
    'duty',
    102,
    'adventure',
    [
      'A Light Against the Dark',
      'Contract Work',
      'Oath of Allegiance',
      'Postal Courier',
      'Protect the Land',
      'Yearns for Revenge',
    ],
  ],
  [
    'influence',
    104,
    'adventure',
    [
      'Adored',
      'Conspirator',
      'Dockmaster',
      'Folk Hero',
      'Respected Leader',
      "[Deity]'s Favored Cleric",
    ],
  ],
  [
    'knowledge',
    106,
    'adventure',
    [
      'Denizens of the Unseen',
      'Expert Appraiser',
      'Knows Every Province',
      'Monster Lore',
      'Stargazer',
      'Tales of the Ancients',
    ],
  ],
  [
    'prodigious-ability',
    108,
    'adventure',
    [
      'Enthralling Entertainer',
      'Excellent Cook',
      'Formidable Weaponmaster',
      'Gifted Physician',
      'Professional Burglar',
      'Seasoned Trader',
    ],
  ],
  [
    'relic',
    110,
    'adventure',
    [
      'Bag of Enchanted Dust',
      'Cauldron of Conjuration',
      "Giant's Gauntlet",
      'Heirloom Longsword',
      'Magic Seeds',
      'Staff of Spellbinding',
    ],
  ],
  [
    'uncanny-being',
    112,
    'adventure',
    [
      'Disembodied Spirit',
      'Hellspawn',
      'Little Hob',
      'One of the Fair Folk',
      'Revenant',
      'Troll',
    ],
  ],
  [
    'destiny',
    114,
    'greatness',
    [
      'Ascend the Throne',
      'End the World',
      'Find the Celestial Storyteller',
      'Foretold Demise',
      'Slay the Mighty One',
      'Turn the Tides of Darkness',
    ],
  ],
  [
    'dominion',
    116,
    'greatness',
    [
      'Archmage of the Order',
      'Insidious Cult Overlord',
      'Merchant Guildmaster',
      'Monarch',
      'Otherworldly Realm',
      'Terror of the Land',
    ],
  ],
  [
    'mastery',
    118,
    'greatness',
    [
      'Ambassador of Change',
      'Forger of Celestial Jewels',
      'Inspired Architect',
      'Lord of the Hunt',
      'Mastermind General',
      'Perfected Soul',
    ],
  ],
  [
    'monstrosity',
    120,
    'greatness',
    [
      'Archfiend of Bedlam',
      'Dragon',
      'Powerful Vampire',
      'Elemental Titan',
      'Giant Spider Queen',
      'God-Spirit',
    ],
  ],
  [
    'companion',
    122,
    'origin',
    [
      'Band of Swords',
      'Friend I Just Met',
      'Guardian Spirit',
      'Imposing Wolfhound',
      'Inspiring Master',
      'Irksome Pixie',
    ],
  ],
  [
    'magic',
    124,
    'origin',
    [
      'Blessing of the Goddess',
      'Hex & Curse',
      'Grand Necromancy',
      'One with the Dark',
      'Rudimentary Magic',
      'Warding Invocations',
    ],
  ],
  [
    'possessions',
    126,
    'origin',
    [
      'Handcrafted Pan Flute',
      'Hidden Daggers',
      'Horse & Panoply',
      'Impregnable Stronghold',
      'Pilfered Possessions',
      'Untold Riches',
    ],
  ],
];

const wayKitRows: readonly KitRow[] = [
  [
    'alchemy-herbalism',
    204,
    'origin',
    ['Expert Poisoner', 'Greenkeeper', 'Village Apothecary'],
  ],
  [
    'fey-patronage',
    207,
    'adventure',
    [
      'Boisterous Bard',
      'Champion of the Fair Folk',
      'Foxy Trickster',
      'Herald of Summer',
      'Magic of the Household Hob',
    ],
  ],
  [
    'landshaping',
    209,
    'adventure',
    [
      'Hoary Avenger',
      'Primal Earthshaper',
      'Town Geomancer',
      'Woodland Whisperer',
    ],
  ],
  [
    'runic-invocation',
    212,
    'adventure',
    ['Blazing Invoker', 'Rune Sage', 'Runescribing', 'Tattooed Sigils'],
  ],
  [
    'shapeshifting',
    215,
    'adventure',
    ['Beast-Dreamer', 'Doppelganger', 'Elemental Body', 'Werewolf Form'],
  ],
  [
    'sorcery',
    218,
    'adventure',
    [
      'Eldritch Archmage',
      'Spellsword',
      'Untrained Potential',
      'Wandering Wizard',
    ],
  ],
  [
    'spirit-binding',
    221,
    'adventure',
    ['Ancestor Worship', 'Demon Binding', 'Caller of Nature Spirits'],
  ],
  [
    'witchcraft',
    225,
    'adventure',
    [
      'Coven Witch',
      'Cult Initiate',
      'Familiar Master',
      'Hedge Witch',
      'Tribe Soothsayer',
    ],
  ],
];

export const legendThemeKits: readonly LegendThemeKitDefinition[] = [
  ...kitRows.flatMap(([themebook, page, might, names]) =>
    names.map((name) => ({
      id: `litm.kit.${slug(name)}`,
      name,
      themebookId: `litm.themebook.${themebook}`,
      might,
      summary: `A ready-made ${name.toLowerCase()} theme concept with room to personalize its strengths, limitation, and Quest.`,
      aliases: [],
      ...citation(page),
    })),
  ),
  ...wayKitRows.flatMap(([way, page, might, names]) =>
    names.map((name) => ({
      id: `litm.kit.${slug(name)}`,
      name,
      themebookId: `litm.magic-way.${way}`,
      might,
      summary: `A ready-made ${name.toLowerCase()} concept using the optional ${way.replaceAll('-', ' ')} rules.`,
      aliases: [],
      ...citation(page),
    })),
  ),
];

const kitId = (name: string) => `litm.kit.${slug(name)}`;

const trope = (
  name: string,
  category: string,
  page: number,
  fixed: string[],
  optional: string[],
  backpack: string[],
): LegendTropeDefinition => ({
  id: `litm.trope.${slug(name)}`,
  name,
  category,
  summary: `A ${category.toLowerCase()} starting concept built from three defining themes and one flexible choice.`,
  fixedKitIds: fixed.map(kitId),
  optionalKitIds: optional.map(kitId),
  backpackSuggestions: backpack,
  ...citation(page),
});

export const legendTropes: readonly LegendTropeDefinition[] = [
  trope(
    '(More Than A) Drunkard',
    'Village Folk',
    78,
    ['Tavern Brawler', 'Last of My Kind', 'Jovial Disposition'],
    ["Giant's Gauntlet", 'End the World', 'Werewolf Form'],
    ['half-empty bottle', 'unusual jewel', 'sad story'],
  ),
  trope(
    'Sweaty Smith',
    'Village Folk',
    78,
    ['Blacksmith', 'Strong as an Ox', 'Heart of Gold'],
    ['Childhood Sweetheart', 'Hardworking Drudge', 'Heirloom Longsword'],
    ['thick leather apron', 'extra horseshoes', 'small bag of coins'],
  ),
  trope(
    'Village Gossip',
    'Village Folk',
    78,
    ['Rumormonger', 'Homesteader', 'Our Village'],
    ['Irksome Pixie', 'Hedge Witch', 'Excellent Cook'],
    ['tucked-away cookie', 'household shrine', 'dirt on someone'],
  ),
  trope(
    'Grizzled Hunter',
    'Wanderers',
    79,
    ['Hinterland Tracker', 'Gruff', 'Imposing Wolfhound'],
    ['Monster Lore', 'Strong as an Ox', 'Formidable Weaponmaster'],
    ['steel trap', 'hunting bow', 'cookware'],
  ),
  trope(
    'Traveling Minstrel',
    'Wanderers',
    79,
    ['Jovial Disposition', 'Enthralling Entertainer', 'Well-Traveled'],
    [
      'Handcrafted Pan Flute',
      'Knows Every Province',
      "[Deity]'s Favored Cleric",
    ],
    ['boiled leather tunic', 'mace', 'rehearsed joke'],
  ),
  trope(
    'Wildling Outrider',
    'Wanderers',
    79,
    ['Tenacious', 'Battlerider', 'Skirmisher'],
    ['Our Village', 'Band of Swords', 'Troll'],
    ['artisanal necklace', 'spiked roundshield', 'alluring musk ointment'],
  ),
  trope(
    'Avenging Cutthroat',
    'Outlaws',
    80,
    ['Yearns for Revenge', 'Acrobatic Agility', 'Hidden Daggers'],
    ['Fugitive', 'Professional Burglar', 'Slay the Mighty One'],
    ['hooded cloak', 'rope and hook', 'sleeping drug'],
  ),
  trope(
    'Roguish Scoundrel',
    'Outlaws',
    80,
    ['Practiced Liar', 'Sleight of Hand', 'Tavern Brawler'],
    ['Uncommon Beauty', 'Expert Appraiser', 'Dockmaster'],
    ['paring knife', 'loaded dice', 'pre-arranged distraction'],
  ),
  trope(
    'Vulgar Bandit',
    'Outlaws',
    80,
    ['Fugitive', 'Pilfered Possessions', 'Skirmisher'],
    ['Heart of Gold', 'Band of Swords', 'Witchblood'],
    ['intimidating mask', 'sturdy spear', 'canvas sack'],
  ),
  trope(
    'Aspiring Squire',
    'Persons-at-Arms',
    81,
    ['Become a Knight', 'Skirmisher', 'Inspiring Master'],
    ['Horse & Panoply', 'Tenacious', 'Heart of Gold'],
    ['safe-ward medallion', 'embroidered handkerchief', 'hemp rope'],
  ),
  trope(
    'Dashing Swashbuckler',
    'Persons-at-Arms',
    81,
    ['Jovial Disposition', 'Acrobatic Agility', 'Formidable Weaponmaster'],
    ['Fugitive', 'Friend I Just Met', 'Sleight of Hand'],
    ['risque corset', 'long whip', 'solid alibi'],
  ),
  trope(
    'Sellsword',
    'Persons-at-Arms',
    81,
    ['Formidable Weaponmaster', 'Forged in War', 'Contract Work'],
    ['Respected Leader', 'Spellsword', 'Monster Lore'],
    ['draping cloak', 'top-quality boots', 'smoking pipe'],
  ),
  trope(
    'Consecrated Cavalier',
    'Faithful Ones',
    82,
    ['Oath of Allegiance', 'Horse & Panoply', 'Formidable Weaponmaster'],
    ['Blessing of the Goddess', 'Landed Noble', 'Heirloom Longsword'],
    ['rations', 'tinderbox', 'map of the region'],
  ),
  trope(
    'Demon Abjurer',
    'Faithful Ones',
    82,
    ['Warding Invocations', 'Denizens of the Unseen', 'Mystic Pilgrimage'],
    ['Outcast', 'Gruff', 'Caravan Folk'],
    ['bag of salt', 'sap club', 'wind chimes'],
  ),
  trope(
    'Devoted Healer',
    'Faithful Ones',
    82,
    ['Heal the Sick', 'Village Apothecary', 'Forged in War'],
    ['Gifted Physician', 'Guardian Spirit', 'Folk Hero'],
    ['quarterstaff', 'oilskin cape', 'extra ingredients'],
  ),
  trope(
    'Conjurer of Flames',
    'Magicians',
    83,
    ['Blazing Invoker', 'Ritualistic Circle', 'Cursed'],
    ['Fugitive', 'Prophetic Visions', 'Hellspawn'],
    ['explosive powder', 'etched breastplate', 'heavy cowl'],
  ),
  trope(
    'Wide-Eyed Apprentice',
    'Magicians',
    83,
    ['Rudimentary Magic', 'Curious', 'Hardworking Drudge'],
    ['Witchblood', 'Ailing Wise Elder', 'Cauldron of Conjuration'],
    ['broom', 'herbal cleansing soak', 'unknown spell scroll'],
  ),
  trope(
    'Wandering Thaumaturge',
    'Magicians',
    83,
    ['Wandering Wizard', 'Well-Traveled', 'Tales of the Ancients'],
    ['Staff of Spellbinding', 'A Light Against the Dark', 'Gruff'],
    ['timely vanishing spell', 'recovery potion', 'donkey'],
  ),
  trope(
    'Bogland Recluse',
    'Witches',
    84,
    ['Gruff', 'Hinterland Tracker', 'Greenkeeper'],
    ['Protect the Land', 'Troll', 'Beaver Kin'],
    ['rejuvenating concoction', 'jingling tripwire', 'bark armor'],
  ),
  trope(
    'Pastoral Priest/ess',
    'Witches',
    84,
    ['Alderperson', 'Blessing of the Goddess', 'Ritualistic Circle'],
    ['Mystic Pilgrimage', 'One of the Fair Folk', 'Stargazer'],
    ['blessed sickle', 'bountiful bushel', 'warning premonition'],
  ),
  trope(
    'Powermonger Witch',
    'Witches',
    84,
    ['Conspirator', 'Hex & Curse', 'Cauldron of Conjuration'],
    ['Insidious Cult Overlord', 'Giant Spider Queen', 'Hidden Daggers'],
    ['poisoned dirk', 'flashbomb', 'walking cane'],
  ),
  trope(
    'Grouchy Household Hob',
    'Strange Creatures',
    85,
    ['Little Hob', 'Gruff', 'Homesteader'],
    ['Bag of Enchanted Dust', 'Denizens of the Unseen', 'Seasoned Trader'],
    ['thread and needle', 'bowl of porridge', 'intruder-stopping glyph'],
  ),
  trope(
    'River Beauty',
    'Strange Creatures',
    85,
    ['One of the Fair Folk', 'Underwater Deftness', 'Yearns for Revenge'],
    ['Heirloom Longsword', 'Adored', 'Enthralling Entertainer'],
    ['carved skull helmet', 'rusted pike', 'juicy fish'],
  ),
  trope(
    'Skinchanger',
    'Strange Creatures',
    85,
    ['Doppelganger', 'Outcast', 'Practiced Liar'],
    ['Artisan', 'Last of My Kind', 'Pilfered Possessions'],
    ['concealed dagger', 'appropriate clothing', 'memorized personal detail'],
  ),
  trope(
    'Haughty Courtier',
    'Nobility',
    86,
    ['Conspirator', 'Landed Noble', 'Rumormonger'],
    ['Highborn Education', 'Oath of Allegiance', 'Ambassador of Change'],
    ['saber', 'vial of poison', 'playing cards'],
  ),
  trope(
    'Heavy-Hearted Monarch',
    'Nobility',
    86,
    ['Monarch', 'Impregnable Stronghold', 'Band of Swords'],
    ['Forged in War', 'Prophetic Visions', 'Disembodied Spirit'],
    ['gilded goblet', 'reinforcement troops', 'private mountain lodge'],
  ),
  trope(
    'Hope of the Realm',
    'Nobility',
    86,
    ['Heart of Gold', 'Folk Hero', 'Ascend the Throne'],
    ['Uncommon Beauty', 'Formidable Weaponmaster', 'Highborn Education'],
    ['leatherbound book', 'commoner clothing', 'small bag of gold'],
  ),
  trope(
    'A God of the Forest',
    'Monsters & Gods',
    87,
    ['God-Spirit', 'Primal Earthshaper', 'Otherworldly Realm'],
    ['Magic Seeds', 'Irksome Pixie', 'Lord of the Hunt'],
    ['army of living trees', 'voices upon the wind', 'mind-freeing draught'],
  ),
  trope(
    'Dread Vampire',
    'Monsters & Gods',
    87,
    ['Powerful Vampire', 'Adored', 'Outcast'],
    ['Impregnable Stronghold', 'Highborn Education', 'One with the Dark'],
    ['royal blood', 'barbed chain', 'loyal thrall'],
  ),
  trope(
    'Resplendent Dragon',
    'Monsters & Gods',
    87,
    ['Dragon', 'Curious', 'Lord of the Hunt'],
    ['Untold Riches', 'Foretold Demise', 'Terror of the Land'],
    ['grazing herd', 'dragon barding', 'word of commanding'],
  ),
];

const improvementNames: Record<string, readonly string[]> = {
  circumstance: [
    'Comfort Zone',
    'Expected Role',
    'Familiar Matters',
    'Strength From Adversity',
    'Trudging Along',
  ],
  devotion: [
    'Bodyguard',
    'Catch Me When I Fall',
    'Deeply Committed',
    'Goes Both Ways',
    'Unwavering',
  ],
  past: [
    'Face From The Past',
    'Lessons Learned',
    'Not Letting Go',
    'Put It Behind Me',
    'Vivid Memory',
  ],
  people: [
    'Shared Language',
    'Stand Out',
    'True To My Tribe',
    'Trust in Legacy',
    'Wisdom Handed Down',
  ],
  personality: [
    'Adaptable Persona',
    'Big Personality',
    'Infectious Personality',
    'Lasting Impression',
    'Unshakeable',
  ],
  'skill-or-trade': [
    'Deft Remedy',
    'Learn from My Mistakes',
    'Practice Makes Perfect',
    'Rehearsed Technique',
    'Resourceful',
  ],
  trait: [
    'Innate Sense',
    'Made for This',
    'Moment to Shine',
    'Pull Through',
    'Wild Blood',
  ],
  duty: [
    'Dutiful Anticipation',
    'Grim Determination',
    'Painful Lessons',
    'Driven by Shame',
    'Unstoppable',
  ],
  influence: [
    'Follow Me!',
    'Friends Everywhere',
    'Long Reach',
    'Overextend',
    'Read Between the Lines',
  ],
  knowledge: [
    'A Known Expert',
    'Always Thinking',
    'Applied Expertise',
    'Inventive Stroke',
    'Flashes of Insight',
  ],
  'prodigious-ability': [
    'Improved Counter',
    'Create An Opening',
    'Discerning Eye',
    'Masterpiece',
    'Practiced Maneuver',
  ],
  relic: [
    'Eternal Bond',
    'Momentary Bearer',
    'Reckless Discharge',
    'Sentinel',
    'Signature Move',
  ],
  'uncanny-being': [
    'Expressive Form',
    'Repel Witchery',
    'Self Discovery',
    'Shifting Form',
    'Strive to Belong',
  ],
  destiny: [
    'As Foretold',
    'Meet It Head-On',
    'Not How It Ends',
    'Reincarnation',
    'Pull of Destiny',
  ],
  dominion: [
    'Embodiment of the Realm',
    'Good Help Is Hard to Find',
    'My Word Is Absolute',
    'Regalia',
    'Untarnished Glory',
  ],
  mastery: [
    'Always Prepared',
    'Calculated Sacrifice',
    'Foresee the Outcome',
    'Lifelong Insight',
    'Second Wind',
  ],
  monstrosity: [
    'Display of Force',
    'Fine Control',
    'Invulnerability',
    'Magical Trace',
    'Surge of Power',
  ],
  companion: [
    "Everyone's Best Friend",
    'Here For You',
    'Perfect Positioning',
    'Reliable Ally',
    'Retaliation',
  ],
  magic: [
    'Scholar of Magic',
    'Ward Breaker',
    'Rote Technique',
    'Reputation Precedes',
    'Inspired Ingenuity',
  ],
  possessions: [
    'Durable',
    'Favorite Piece',
    "I'm Keeping This",
    'Just The Thing',
    'Quartermaster',
  ],
};

export const legendSpecialImprovements: readonly LegendSpecialImprovementDefinition[] =
  themebookRows.flatMap(([themebook, name, , page]) =>
    improvementNames[themebook].map((improvement) => ({
      id: `litm.improvement.${themebook}.${slug(improvement)}`,
      name: improvement,
      themebookId: `litm.themebook.${themebook}`,
      summary: `A ${name} special improvement. Its activation and narrative application remain visible on the theme card.`,
      ...citation(page + 1),
    })),
  );

export const legendMagicWays: readonly LegendMagicWayDefinition[] = [
  {
    id: 'litm.magic-way.alchemy-herbalism',
    name: 'Alchemy & Herbalism',
    summary:
      'Collect recipes and prepare consumable concoctions from a limited stock of ingredients.',
    trackLabel: 'Ingredient supply',
    itemLabel: 'Recipe or ingredient',
    optionalVariants: ['Mixing Ingredients'],
    ...citation(202),
  },
  {
    id: 'litm.magic-way.fey-patronage',
    name: 'Fey Patronage',
    summary:
      'Receive fickle enchantments whose reliability follows the favor and marks of the Fair Folk.',
    trackLabel: 'Fey favor',
    itemLabel: 'Boon or mark',
    optionalVariants: [],
    ...citation(205),
  },
  {
    id: 'litm.magic-way.landshaping',
    name: 'Landshaping',
    summary:
      'Draw power from a place, shaping what is present while risking depletion of the land.',
    trackLabel: 'Land vitality',
    itemLabel: 'Land aspect',
    optionalVariants: ['Elementalism'],
    ...citation(208),
  },
  {
    id: 'litm.magic-way.runic-invocation',
    name: 'Runic Invocation',
    summary:
      'Learn symbolic words of power and combine them into direct invocations or inscriptions.',
    trackLabel: 'Runic readiness',
    itemLabel: 'Known rune',
    optionalVariants: [],
    ...citation(210),
  },
  {
    id: 'litm.magic-way.shapeshifting',
    name: 'Shapeshifting',
    summary:
      'Assume new forms and their abilities while managing the instincts those forms impose.',
    trackLabel: 'Instinct',
    itemLabel: 'Known form',
    optionalVariants: [],
    ...citation(213),
  },
  {
    id: 'litm.magic-way.sorcery',
    name: 'Sorcery',
    summary:
      'Weave learned spells through complex preparation, personal toll, and the danger of a botch.',
    trackLabel: 'Sorcerous toll',
    itemLabel: 'Known spell',
    optionalVariants: ['Corruptive Sorcery'],
    ...citation(216),
  },
  {
    id: 'litm.magic-way.spirit-binding',
    name: 'Spirit Binding',
    summary:
      'Find, bargain with, command, and release spirits whose service always carries danger.',
    trackLabel: 'Binding pressure',
    itemLabel: 'Bound spirit',
    optionalVariants: [],
    ...citation(219),
  },
  {
    id: 'litm.magic-way.witchcraft',
    name: 'Witchcraft',
    summary:
      'Perform condition-bound rituals that require time, tools, ingredients, and concentration.',
    trackLabel: 'Ritual progress',
    itemLabel: 'Known ritual',
    optionalVariants: ['Mightier Witchcraft'],
    ...citation(223),
  },
];

const storeGroups: readonly [
  string,
  number,
  'standard' | 'single-use' | 'consumable',
  readonly string[],
][] = [
  [
    'Light Armor',
    129,
    'standard',
    [
      'Buff coat',
      'Gambeson',
      'Arming doublet',
      'Leather armor',
      'Boiled leather armor',
      'Hide armor',
      'Jack of plates',
      'Brigandine',
    ],
  ],
  [
    'Heavy Armor',
    129,
    'standard',
    [
      'Cuirass',
      'Breastplate',
      'Chainmail',
      'Hauberk',
      'Plate armor',
      'Mail and plate',
      'Helm',
    ],
  ],
  [
    'Shields',
    129,
    'standard',
    ['Buckler', 'Simple wooden shield', 'Heavy shield'],
  ],
  [
    'Assistance',
    130,
    'standard',
    [
      'Attendant',
      'Boat handler',
      'Fairy servant',
      'Informant',
      'Local guide',
      'Mule',
      'Storyteller',
      'Torchbearer',
    ],
  ],
  [
    'Clothing & Accessories',
    130,
    'standard',
    [
      'Bracers',
      'Cape',
      'Court dress',
      'Gloves',
      'Jewelry',
      'Jerkin',
      'Tunic',
      'Oilskins',
      'Sturdy boots',
      'Surcoat',
      'Travel cloak',
      'Vestments',
    ],
  ],
  [
    'Medicinal Items',
    131,
    'consumable',
    [
      'Antidote',
      'Bandages',
      'Foot ointment',
      'Healing brew',
      'Healing potion',
      'Poison',
      'Sleep stone',
      'Sleeping drug',
      'Soothing salves',
      'Tonic',
    ],
  ],
  [
    'Notes',
    131,
    'single-use',
    [
      'Directions',
      'Funny anecdote',
      'Juicy gossip',
      'Leftover meal recipe',
      'Little prayer',
      'Memory of sweet smelling bread',
      'Strong comeback',
      'Unsolvable conundrum',
    ],
  ],
  [
    'Personal Items',
    131,
    'standard',
    [
      'Biased dice',
      'Family signet',
      "Grandmother's shawl",
      'Parchment and ink',
      'Pipe and tobacco',
      'Shaving kit',
      'Small trophy',
      'War paint',
    ],
  ],
  [
    'Spiritual & Magical Trinkets',
    132,
    'standard',
    [
      'Fortune telling tools',
      'Good luck charm',
      'Prayer beads',
      'Religious icon',
      'Scrying mirror',
      'Spirit-warding symbol',
      'Talisman of spiritual power',
      'Wand',
    ],
  ],
  [
    'Supplies & Travel Gear',
    132,
    'standard',
    [
      'Bedroll',
      'Carving knife',
      'Cloth tent',
      'Frying pan',
      'Repair kit',
      'Signal whistle',
      'Soap and cloth',
      'Spyglass',
      'Travel provisions',
      'Waterskin',
      'Wineskin',
    ],
  ],
  [
    'Weaponry',
    133,
    'standard',
    [
      'Axe',
      'Bludgeoning weapon',
      'Bow',
      'Dirk',
      'Flail',
      'Polearm',
      'Slingshot',
      'Staff',
      'Sword',
      'Two-handed weapon',
    ],
  ],
];

export const legendStoreItems: readonly LegendStoreItemDefinition[] =
  storeGroups.flatMap(([category, page, defaultUsage, names]) =>
    names.map((name) => ({
      id: `litm.store.${slug(name)}`,
      name,
      category,
      summary: `A ${name.toLowerCase()} that can matter in the story when recorded as a backpack tag.`,
      defaultUsage,
      ...citation(page),
    })),
  );

export const legendFulfillmentOptions = [
  ['journeys-end', "Arrive at Journey's End", 189],
  ['reforged', 'Be Reforged', 190],
  ['quintessence', 'Gain a Quintessence', 190],
  ['foundations-of-magic', 'Shake the Foundations of Magic', 191],
  ['words-eternal', 'Speak Words Eternal', 191],
  ['lost-truths', 'Unearth Lost Truths', 191],
] as const;

export const legendQuintessences = [
  'Beyond Luck',
  'Canny One',
  'Dark Horse',
  'Diligent Drudge',
  'Fumbling Master',
  'Jack of Many Lives',
  'Larger Than Life',
  'Loyal Companion',
  'Lucky Bastard',
  'Magus Magnificent',
  'Master of Craft',
  'Master of the Little Things',
  'Nine Lives',
  'Old Hand',
  'Pillar of Wisdom',
  'The Bearer',
  'The Common Hero',
  'Virtuoso',
] as const;

export const legendCatalogCounts = {
  themebooks: legendThemebooks.length,
  tropes: legendTropes.length,
  coreThemeKits: legendThemeKits.filter((entry) => entry.page <= 126).length,
  magicThemeKits: legendThemeKits.filter((entry) => entry.page >= 202).length,
  specialImprovements: legendSpecialImprovements.length,
  magicWays: legendMagicWays.length,
  storeItems: legendStoreItems.length,
} as const;

export const findLegendKit = (id: string | null) =>
  legendThemeKits.find((entry) => entry.id === id);

export const findLegendThemebook = (id: string | null) =>
  legendThemebooks.find((entry) => entry.id === id);
