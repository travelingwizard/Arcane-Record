export const coc7eEquipmentSource = {
  id: 'coc7e.chaosium-wiki.equipment',
  title: 'The Call of Cthulhu RPG Wiki - General Equipment',
  url: 'https://cthulhuwiki.chaosium.com/equipment/equipment.html',
  era: '1920s',
} as const;

export type Coc7eEquipmentCategory =
  | 'clothing'
  | 'food-drink'
  | 'lodging'
  | 'real-estate'
  | 'medical'
  | 'travel'
  | 'tents'
  | 'tools'
  | 'investigator-tools'
  | 'transport'
  | 'vehicle-accessories';

export interface Coc7eEquipmentDefinition {
  id: string;
  name: string;
  category: Coc7eEquipmentCategory;
  priceLabel: string;
  priceMinimumCents: number | null;
  priceMaximumCents: number | null;
  pricingUnit: string;
  era: '1920s';
  sourceId: string;
  sourceUrl: string;
  verified: true;
}

const equipmentRows: readonly [
  Coc7eEquipmentCategory,
  string,
  string,
  number | null,
  number | null,
  string?,
][] = [
  ['clothing', 'Worsted Wool Dress Suit', '$17.95', 1795, 1795],
  ['clothing', 'Cashmere Dress Suit', '$18.50', 1850, 1850],
  ['clothing', 'Outdoor Coat', '$9.95-$35.00', 995, 3500],
  ['clothing', 'Oxford Dress Shoes', '$6.95', 695, 695],
  ['clothing', 'Felt Fedora', '$4.95', 495, 495],
  ['clothing', 'Hiking Boots', '$7.25', 725, 725],
  ['clothing', 'Silk Taffeta Frock', '$10.95', 1095, 1095],
  ['clothing', 'Velour Coat with Fur Trim', '$39.75', 3975, 3975],
  ['clothing', 'Belted Cotton Rain Coat', '$3.98', 398, 398],
  ['food-drink', 'Breakfast', '45¢', 45, 45, 'per meal'],
  ['food-drink', 'Lunch', '65¢', 65, 65, 'per meal'],
  ['food-drink', 'Dinner', '$1.25', 125, 125, 'per meal'],
  ['food-drink', 'Cocktail', '25¢', 25, 25, 'per glass'],
  ['food-drink', 'Beer', '20¢', 20, 20, 'per glass'],
  ['lodging', 'Average Hotel', '$4.50', 450, 450, 'per night'],
  ['lodging', 'Fleabag Hotel', '75¢', 75, 75, 'per night'],
  ['lodging', 'Good Hotel', '$9.00', 900, 900, 'per night'],
  ['lodging', 'Luxury Hotel', '$30.00+', 3000, null, 'per night'],
  ['lodging', 'Average Apartment', '$10.00', 1000, 1000, 'per week'],
  ['real-estate', 'Country House', '$20,000.00+', 2000000, null],
  ['real-estate', 'Town House', '$4,000.00-$8,142.00', 400000, 814200],
  ['real-estate', 'Bungalow', '$3,100.00', 310000, 310000],
  ['medical', 'Aspirin (12 pills)', '10¢', 10, 10],
  ['medical', 'Medical Case', '$10.45', 1045, 1045],
  ['medical', 'Scalpel Set', '$1.39', 139, 139],
  ['medical', 'Hypodermic Syringes', '$12.50', 1250, 1250],
  ['medical', 'Gauze Bandages (5 yards)', '69¢', 69, 69],
  ['medical', 'Clinical Thermometer', '69¢', 69, 69],
  ['medical', 'Wheel Chair', '$39.95', 3995, 3995],
  ['travel', 'Cooking Kit', '$8.98', 898, 898],
  ['travel', 'Camp Stove', '$6.10', 610, 610],
  ['travel', 'Waterproof Blanket', '$5.06', 506, 506],
  ['travel', 'Carbide Lamp', '$2.35', 235, 235],
  ['travel', 'Electric Torch', '$2.40', 240, 240],
  ['travel', 'Batteries', '60¢', 60, 60],
  ['travel', 'Binoculars', '$28.50', 2850, 2850],
  ['travel', 'Compass with Lid', '$2.85', 285, 285],
  ['travel', 'Hunting Knife', '$2.35', 235, 235],
  ['travel', 'Hand Axe', '98¢', 98, 98],
  ['travel', 'Bear Trap', '$11.43', 1143, 1143],
  ['travel', 'Fishing Rod and Tackle', '$9.35', 935, 935],
  ['travel', 'Heavy Canvas Shoulder Bag', '$3.45', 345, 345],
  ['travel', 'Waterproof Match Case', '48¢', 48, 48],
  ['travel', 'Canvas and Wood Canoe', '$75.00', 7500, 7500],
  ['tents', '7 × 7 Foot Tent', '$11.48', 1148, 1148],
  ['tents', '12 × 16 Foot Tent', '$28.15', 2815, 2815],
  ['tents', '24 × 36 Foot Tarpaulin', '$39.35', 3935, 3935],
  ['tents', 'Canteen (1 quart)', '$1.69', 169, 169],
  ['tents', 'Water Bag (1 gallon)', '80¢', 80, 80],
  ['tools', 'Tool Outfit (20 tools)', '$14.90', 1490, 1490],
  ['tools', 'Hand Drill and 8 Bits', '$6.15', 615, 615],
  ['tools', 'Padlock', '95¢', 95, 95],
  ['tools', 'Rope (50 feet)', '$8.60', 860, 860],
  ['tools', 'Crowbar', '$2.25', 225, 225],
  ['tools', 'Gasoline Blowtorch', '$4.45', 445, 445],
  ['tools', 'Shovel', '95¢', 95, 95],
  ['investigator-tools', 'Handcuffs', '$3.35', 335, 335],
  ['investigator-tools', 'Police Whistle', '30¢', 30, 30],
  ['investigator-tools', 'Dictaphone', '$39.95', 3995, 3995],
  ['investigator-tools', 'Wrist Watch', '$5.95', 595, 595],
  ['investigator-tools', 'Fountain Pen', '$1.80', 180, 180],
  ['investigator-tools', 'Remington Typewriter', '$40.00', 4000, 4000],
  ['investigator-tools', 'Pocket Microscope', '58¢', 58, 58],
  ['investigator-tools', 'Pocket Magnifying Glass', '$1.68', 168, 168],
  ['investigator-tools', 'Briefcase', '$1.48', 148, 148],
  ['investigator-tools', 'Chemical Fire Extinguisher', '$13.85', 1385, 1385],
  ['transport', 'Norton Motorcycle', '$95.00', 9500, 9500],
  ['transport', 'Ford Model T', '$360.00', 36000, 36000],
  ['transport', 'Ford Model A', '$450.00', 45000, 45000],
  ['transport', 'Chevrolet Pickup Truck', '$545.00', 54500, 54500],
  ['transport', 'Bentley 3-Litre', '$9,000.00', 900000, 900000],
  ['transport', 'Rolls-Royce Silver Ghost', '$6,750.00', 675000, 675000],
  ['vehicle-accessories', 'Tire', '$10.95', 1095, 1095],
  ['vehicle-accessories', 'Tire Repair Kit', '32¢', 32, 32],
  ['vehicle-accessories', 'Jack', '$1.00', 100, 100],
  ['vehicle-accessories', 'Auto Battery', '$14.15', 1415, 1415],
  ['vehicle-accessories', 'Portable Air Pump', '$3.25', 325, 325],
];

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const coc7eEquipmentCatalog: readonly Coc7eEquipmentDefinition[] =
  equipmentRows.map(
    ([category, name, priceLabel, minimum, maximum, pricingUnit = 'each']) => ({
      id: `coc7e.wiki.equipment.${slug(name)}`,
      name,
      category,
      priceLabel,
      priceMinimumCents: minimum,
      priceMaximumCents: maximum,
      pricingUnit,
      era: '1920s',
      sourceId: coc7eEquipmentSource.id,
      sourceUrl: coc7eEquipmentSource.url,
      verified: true,
    }),
  );

export const coc7eSpellSource = {
  id: 'coc7e.barrucadu.spell-reference',
  title: 'Call of Cthulhu spell reference',
  url: 'https://memo.barrucadu.co.uk/call-of-cthulhu-spell-reference.html',
  license: 'CC BY-NC-SA 4.0',
  attribution: 'Michael Walker (Barrucadu)',
} as const;

export type Coc7eSpellCategory =
  | 'attacks'
  | 'creatures-gods'
  | 'gates'
  | 'items'
  | 'personal'
  | 'wards'
  | 'miscellaneous';

const spellRows: readonly [Coc7eSpellCategory, string, string, string][] = [
  [
    'attacks',
    'Breath of the Deep',
    'KR 247',
    'Threatens a target with magically conjured water.',
  ],
  [
    'attacks',
    'Cause/Cure Blindness',
    'KR 249',
    'Inflicts or reverses supernatural blindness.',
  ],
  ['attacks', 'Cloud Memory', 'KR 250', 'Obscures a chosen memory.'],
  ['attacks', 'Clutch of Nyogtha', 'KR 250', 'Injures and restrains a target.'],
  ['attacks', 'Dominate', 'KR 254', 'Attempts to impose the caster’s will.'],
  [
    'attacks',
    'Dust of Suleiman',
    'KR 255',
    'Creates a substance harmful to unearthly beings.',
  ],
  [
    'attacks',
    'Fist of Yog-Sothoth',
    'KR 259',
    'Strikes with invisible supernatural force.',
  ],
  [
    'attacks',
    'Implant Fear',
    'KR 259',
    'Overwhelms a target with supernatural dread.',
  ],
  ['attacks', 'Mindblast', 'KR 260', 'Assaults a target’s sanity.'],
  [
    'attacks',
    'Red Sign of Shudde M’ell',
    'KR 261',
    'Creates an injurious supernatural sign.',
  ],
  [
    'attacks',
    'Shrivelling',
    'KR 261',
    'Inflicts variable supernatural injury.',
  ],
  [
    'attacks',
    'Wave of Oblivion',
    'KR 265',
    'Conjures a destructive ocean wave.',
  ],
  [
    'creatures-gods',
    'Banishment of Yde Etad',
    'KR 246',
    'A group rite for banishing certain intelligences.',
  ],
  [
    'creatures-gods',
    'Bind Creature',
    'KR 265',
    'Compels a specified Mythos creature.',
  ],
  [
    'creatures-gods',
    'Call Deity',
    'KR 248',
    'Invites a deity or avatar to manifest.',
  ],
  [
    'creatures-gods',
    'Contact Creature',
    'KR 250',
    'Attempts communication with a Mythos species.',
  ],
  [
    'creatures-gods',
    'Contact Deity',
    'KR 252',
    'Attempts telepathic contact with a deity.',
  ],
  [
    'creatures-gods',
    'Dismiss Deity',
    'KR 249',
    'Attempts to send away a manifested entity.',
  ],
  [
    'creatures-gods',
    'Summon Creature',
    'KR 263',
    'Calls a specified Mythos creature.',
  ],
  ['gates', 'Create Gate', 'KR 256', 'Creates a stable supernatural passage.'],
  ['gates', 'Find Gate', 'KR 256', 'Locates or reveals a nearby gate.'],
  ['gates', 'Gate Boxes', 'KR 256', 'Creates paired objects that form a gate.'],
  ['gates', 'Time Gate', 'KR 256', 'Creates a passage through time.'],
  ['gates', 'View Gate', 'KR 257', 'Reveals what lies beyond a gate.'],
  [
    'items',
    'Bless Blade',
    'KR 246',
    'Enchants a blade against unnatural creatures.',
  ],
  [
    'items',
    'Brew Space Mead',
    'KR 247',
    'Creates a substance used for extraordinary journeys.',
  ],
  [
    'items',
    'Enchant Book',
    'KR 255',
    'Prepares a book for a specific occult purpose.',
  ],
  ['items', 'Enchant Knife', 'KR 255', 'Prepares a knife for occult rites.'],
  ['items', 'Enchant Pipes', 'KR 255', 'Prepares pipes for occult rites.'],
  [
    'items',
    'Enchant Whistle',
    'KR 258',
    'Prepares a whistle for occult rites.',
  ],
  [
    'items',
    'Powder of Ibn-Ghazi',
    'KR 261',
    'Creates powder that reveals unseen things.',
  ],
  [
    'items',
    'Prinn’s Crux Ansata',
    'KR 261',
    'Creates a sign used to banish certain creatures.',
  ],
  [
    'personal',
    'Apportion Ka',
    'KR 246',
    'Separates enchanted organs from the caster.',
  ],
  [
    'personal',
    'Body Warping of Gorgoroth',
    'KR 246',
    'Transforms the caster’s body.',
  ],
  [
    'personal',
    'Chant of Thoth',
    'KR 249',
    'Aids a knowledge-oriented undertaking.',
  ],
  [
    'personal',
    'Consume Likeness',
    'KR 250',
    'Assumes the appearance of a deceased person.',
  ],
  [
    'personal',
    'Flesh Ward',
    'KR 259',
    'Provides temporary supernatural protection.',
  ],
  [
    'personal',
    'Mind Exchange',
    'KR 260',
    'Exchanges minds with a willing subject.',
  ],
  ['personal', 'Voorish Sign', 'KR 265', 'Enhances the next use of magic.'],
  [
    'wards',
    'Create Barrier of Naach-Tith',
    'KR 253',
    'Creates a large transparent barrier.',
  ],
  [
    'wards',
    'Elder Sign',
    'KR 255',
    'Activates a ward against Mythos influence.',
  ],
  [
    'wards',
    'Warding',
    'KR 265',
    'Creates a boundary that reacts to intrusion.',
  ],
  [
    'miscellaneous',
    'Augury',
    'MoN 630',
    'Seeks supernatural portents of the future.',
  ],
  [
    'miscellaneous',
    'Cast Out the Devil',
    'MoN 631',
    'Attempts to end supernatural possession.',
  ],
  [
    'miscellaneous',
    'Create Mist of R’lyeh',
    'KR 253',
    'Conjures a dense unnatural mist.',
  ],
  [
    'miscellaneous',
    'Create Zombie',
    'KR 253',
    'Animates a corpse as an obedient servant.',
  ],
  [
    'miscellaneous',
    'Resurrection',
    'KR 262',
    'Reduces or restores a body from essential salts.',
  ],
];

export const coc7eSpellCatalog = spellRows.map(
  ([category, name, reference, summary]) => ({
    id: `coc7e.spell-index.${slug(name)}`,
    name,
    category,
    aliases: [] as string[],
    summary,
    reference,
    sourceId: coc7eSpellSource.id,
    sourceUrl: coc7eSpellSource.url,
    verified: true as const,
  }),
);
