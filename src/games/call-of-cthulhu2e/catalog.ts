export interface CocDefinition {
  id: string;
  name: string;
  kind:
    | 'occupation'
    | 'skill'
    | 'weapon'
    | 'equipment'
    | 'spell'
    | 'tome'
    | 'insanity';
  summary: string;
  sourceId: 'coc2e.core' | 'coc2e.1920s';
  page: number;
  aliases: readonly string[];
  verified: boolean;
}
const d = (value: CocDefinition) => value;
export const occupations = [
  d({
    id: 'coc2e.core.occupation.journalist',
    name: 'Journalist',
    kind: 'occupation',
    summary:
      'An investigator trained to gather facts, interview people, and recognize a story.',
    sourceId: 'coc2e.core',
    page: 10,
    aliases: ['Reporter'],
    verified: true,
  }),
  d({
    id: 'coc2e.core.occupation.parapsychologist',
    name: 'Parapsychologist',
    kind: 'occupation',
    summary:
      'A student of unusual mental and supernatural claims who approaches them through research.',
    sourceId: 'coc2e.core',
    page: 10,
    aliases: [],
    verified: true,
  }),
  d({
    id: 'coc2e.core.occupation.professor',
    name: 'Professor',
    kind: 'occupation',
    summary:
      'An academic whose education and institutional connections support specialist research.',
    sourceId: 'coc2e.core',
    page: 10,
    aliases: ['Academic'],
    verified: true,
  }),
  d({
    id: 'coc2e.core.occupation.antiquarian',
    name: 'Historian or Antiquarian',
    kind: 'occupation',
    summary:
      'A scholar of old objects, records, cultures, and forgotten events.',
    sourceId: 'coc2e.core',
    page: 10,
    aliases: ['Historian'],
    verified: true,
  }),
  d({
    id: 'coc2e.core.occupation.author',
    name: 'Author',
    kind: 'occupation',
    summary:
      'A professional observer and writer with broad research and communication experience.',
    sourceId: 'coc2e.core',
    page: 10,
    aliases: ['Writer'],
    verified: true,
  }),
  d({
    id: 'coc2e.core.occupation.private-investigator',
    name: 'Private Investigator',
    kind: 'occupation',
    summary:
      'A practical investigator skilled at surveillance, interviews, and following evidence.',
    sourceId: 'coc2e.core',
    page: 10,
    aliases: ['Detective'],
    verified: true,
  }),
  d({
    id: 'coc2e.core.occupation.dilettante',
    name: 'Dilettante',
    kind: 'occupation',
    summary:
      'An independently supported investigator whose interests and social access define their expertise.',
    sourceId: 'coc2e.core',
    page: 10,
    aliases: [],
    verified: true,
  }),
  d({
    id: 'coc2e.core.occupation.other',
    name: 'Other occupation',
    kind: 'occupation',
    summary:
      'A Keeper-reviewed profession such as doctor, lawyer, or clergyman.',
    sourceId: 'coc2e.core',
    page: 10,
    aliases: ['Doctor', 'Lawyer', 'Clergyman'],
    verified: true,
  }),
  d({
    id: 'coc2e.1920s.occupation.sailor',
    name: 'Sailor',
    kind: 'occupation',
    summary:
      'A maritime professional familiar with ships, navigation, ports, and life at sea.',
    sourceId: 'coc2e.1920s',
    page: 7,
    aliases: ['Seaman'],
    verified: true,
  }),
  d({
    id: 'coc2e.1920s.occupation.criminal',
    name: 'Criminal',
    kind: 'occupation',
    summary:
      'A character shaped by illicit work, underworld contacts, and evading authorities.',
    sourceId: 'coc2e.1920s',
    page: 8,
    aliases: [],
    verified: true,
  }),
] as const;

const skill = (
  id: string,
  name: string,
  base: number,
  page = 11,
  sourceId: 'coc2e.core' | 'coc2e.1920s' = 'coc2e.core',
  summary = 'A percentile skill; roll equal to or below its current rating to succeed.',
) =>
  d({
    id: `${sourceId}.skill.${id}`,
    name,
    kind: 'skill',
    summary: `${summary} Base chance ${base}%.`,
    sourceId,
    page,
    aliases: [],
    verified: true,
  });
export const skills = [
  skill('accounting', 'Accounting', 10),
  skill('anthropology', 'Anthropology', 0),
  skill('archaeology', 'Archaeology', 0),
  skill('astronomy', 'Astronomy', 0),
  skill('bargain', 'Bargain', 5),
  skill('biology', 'Biology', 0),
  skill('chemistry', 'Chemistry', 0),
  skill('climb', 'Climb', 40),
  skill('conceal', 'Conceal', 15),
  skill('credit-rating', 'Credit Rating', 15),
  skill(
    'cthulhu-mythos',
    'Cthulhu Mythos',
    0,
    11,
    'coc2e.core',
    'Keeper-granted knowledge; it cannot receive ordinary creation points or experience checks.',
  ),
  skill('dodge', 'Dodge', 10),
  skill('drive-auto', 'Drive Automobile', 20),
  skill('electrical-repair', 'Electrical Repair', 10),
  skill('fast-talk', 'Fast Talk', 5),
  skill('first-aid', 'First Aid', 30),
  skill('geology', 'Geology', 0),
  skill('hide', 'Hide', 10),
  skill('history', 'History', 20),
  skill('jump', 'Jump', 25),
  skill('law', 'Law', 5),
  skill('library-use', 'Library Use', 25),
  skill('listen', 'Listen', 25),
  skill('locksmith', 'Locksmith', 0),
  skill('mechanical-repair', 'Mechanical Repair', 20),
  skill('medicine', 'Medicine', 5),
  skill('natural-history', 'Natural History', 10),
  skill('navigate', 'Navigate', 10),
  skill('occult', 'Occult', 5),
  skill('operate-heavy-machine', 'Operate Heavy Machine', 0),
  skill('other-language', 'Other Language', 0),
  skill(
    'own-language',
    'Read/Write Own Language',
    0,
    11,
    'coc2e.core',
    'A native written language normally begins at EDU × 5.',
  ),
  skill('persuade', 'Persuade', 15),
  skill('pharmacy', 'Pharmacy', 0),
  skill('photography', 'Photography', 10),
  skill('physics', 'Physics', 0),
  skill('pick-pocket', 'Pick Pocket', 5),
  skill('psychoanalysis', 'Psychoanalysis', 0),
  skill('psychology', 'Psychology', 5),
  skill('ride', 'Ride', 5),
  skill('sneak', 'Sneak', 10),
  skill('spot-hidden', 'Spot Hidden', 25),
  skill('swim', 'Swim', 25),
  skill('throw', 'Throw', 25),
  skill('track', 'Track', 10),
  skill(
    'naval-gunnery',
    'Naval Gunnery',
    0,
    11,
    'coc2e.1920s',
    'Specialized operation of naval weapons.',
  ),
] as const;

export const weapons = [
  d({
    id: 'coc2e.core.weapon.fist',
    name: 'Fist/Punch',
    kind: 'weapon',
    summary:
      'An unarmed strike using the investigator’s damage modifier where applicable.',
    sourceId: 'coc2e.core',
    page: 38,
    aliases: ['Punch'],
    verified: true,
  }),
  d({
    id: 'coc2e.core.weapon.knife',
    name: 'Knife',
    kind: 'weapon',
    summary: 'A close-combat blade capable of an impaling result.',
    sourceId: 'coc2e.core',
    page: 38,
    aliases: [],
    verified: true,
  }),
  d({
    id: 'coc2e.core.weapon.club',
    name: 'Club',
    kind: 'weapon',
    summary:
      'A blunt hand weapon that can parry and benefits from physical force.',
    sourceId: 'coc2e.core',
    page: 38,
    aliases: [],
    verified: true,
  }),
  d({
    id: 'coc2e.core.weapon.handgun',
    name: 'Handgun',
    kind: 'weapon',
    summary:
      'A common sidearm; record its caliber, damage, ammunition, and reliability.',
    sourceId: 'coc2e.core',
    page: 39,
    aliases: ['Pistol', 'Revolver'],
    verified: true,
  }),
  d({
    id: 'coc2e.core.weapon.rifle',
    name: 'Rifle',
    kind: 'weapon',
    summary: 'A long firearm with substantial range and impaling potential.',
    sourceId: 'coc2e.core',
    page: 39,
    aliases: [],
    verified: true,
  }),
  d({
    id: 'coc2e.core.weapon.shotgun',
    name: 'Shotgun',
    kind: 'weapon',
    summary:
      'A firearm whose effectiveness and damage depend strongly on range.',
    sourceId: 'coc2e.core',
    page: 39,
    aliases: [],
    verified: true,
  }),
] as const;
export const equipment = [
  d({
    id: 'coc2e.core.equipment.flashlight',
    name: 'Flashlight',
    kind: 'equipment',
    summary:
      'Portable illumination; track batteries and condition when relevant.',
    sourceId: 'coc2e.core',
    page: 45,
    aliases: ['Torch'],
    verified: true,
  }),
  d({
    id: 'coc2e.core.equipment.first-aid-kit',
    name: 'First-aid kit',
    kind: 'equipment',
    summary: 'Supplies appropriate for immediate treatment of injuries.',
    sourceId: 'coc2e.core',
    page: 45,
    aliases: [],
    verified: true,
  }),
] as const;
export const keeperMythos = [
  d({
    id: 'coc2e.core.spell.contact-deity',
    name: 'Contact Deity',
    kind: 'spell',
    summary:
      'Restricted Mythos magic. The Keeper grants access and records its verified terms.',
    sourceId: 'coc2e.core',
    page: 65,
    aliases: [],
    verified: true,
  }),
  d({
    id: 'coc2e.core.tome.necronomicon',
    name: 'Necronomicon',
    kind: 'tome',
    summary:
      'A restricted Mythos tome whose edition and effects must be recorded by the Keeper.',
    sourceId: 'coc2e.core',
    page: 71,
    aliases: [],
    verified: true,
  }),
] as const;
export const insanities = [
  d({
    id: 'coc2e.core.insanity.temporary',
    name: 'Temporary insanity',
    kind: 'insanity',
    summary:
      'A short-lived break prompted by severe Sanity loss; the Keeper and player record its expression.',
    sourceId: 'coc2e.core',
    page: 50,
    aliases: [],
    verified: true,
  }),
  d({
    id: 'coc2e.core.insanity.indefinite',
    name: 'Indefinite insanity',
    kind: 'insanity',
    summary:
      'A lasting condition requiring an agreed description and recovery record.',
    sourceId: 'coc2e.core',
    page: 50,
    aliases: [],
    verified: true,
  }),
] as const;
export const allDefinitions = [
  ...occupations,
  ...skills,
  ...weapons,
  ...equipment,
  ...keeperMythos,
  ...insanities,
];
