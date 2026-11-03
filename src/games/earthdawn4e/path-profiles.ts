export type PathBonusTarget =
  | 'physicalDefense'
  | 'mysticDefense'
  | 'socialDefense'
  | 'mysticArmor'
  | 'initiative'
  | 'recovery';
export type EarthdawnPathRequirement =
  | { kind: 'talent' | 'skill' | 'language'; name: string; rank: number }
  | { kind: 'knowledge-skill'; rank: number }
  | { kind: 'manual'; description: string };
export type EarthdawnPathProfile = {
  id: string;
  name: string;
  summary: string;
  initiationCost: number;
  minimumCircle: number;
  maximumRank: number;
  talentCostTier: 'journeyman' | 'master';
  race: string | null;
  requirements: readonly EarthdawnPathRequirement[];
  questorProhibited: boolean;
  incompatiblePathIds: readonly string[];
  ordeal: string;
  bloodMagicDamage: number;
  rankBonuses: readonly {
    rank: number;
    target: PathBonusTarget;
    value: number;
    label: string;
  }[];
  optionTiers: readonly {
    minimumRank: number;
    costTier: 'journeyman' | 'warden' | 'master';
    maximumSelections?: number;
    talents: readonly string[];
  }[];
  halfMagic: string;
  karmaRitual: string;
  restrictions: readonly string[];
  features?: readonly string[];
  additionalCitations?: readonly string[];
  advancement: string;
  sourceId: string;
  page: number | null;
  pageEnd: number | null;
  citation: string;
  verified: boolean;
};

const source = 'The Adept’s Journey: Mystic Paths';
const cite = (page: number, end: number | null = null) =>
  `${source}, p. ${page}${end && end !== page ? `–${end}` : ''}`;
const b = (
  rank: number,
  target: PathBonusTarget,
  value: number,
  label: string,
) => ({ rank, target, value, label });
const o = (
  minimumRank: number,
  costTier: 'journeyman' | 'warden' | 'master',
  talents: string[],
  maximumSelections?: number,
) => ({ minimumRank, costTier, talents, maximumSelections });
const manual = (description: string): EarthdawnPathRequirement => ({
  kind: 'manual',
  description,
});
const imported = (
  value: Omit<EarthdawnPathProfile, 'sourceId' | 'citation' | 'verified'>,
): EarthdawnPathProfile => ({
  ...value,
  sourceId: 'ed4.mystic-paths',
  citation: value.page
    ? cite(value.page, value.pageEnd)
    : 'User-supplied Earthdawn Fourth Edition rules reference',
  verified: value.page != null,
});

export const earthdawnPathProfiles: readonly EarthdawnPathProfile[] = [
  imported({
    id: 'brother-of-stone',
    name: 'Brother of Stone',
    summary:
      'An ancient obsidiman brotherhood devoted to all Liferocks, elemental Earth, and the protection of the land from corruption and exploitation.',
    initiationCost: 500,
    minimumCircle: 5,
    maximumRank: 10,
    talentCostTier: 'master',
    race: 'Obsidiman',
    requirements: [
      { kind: 'language', name: 'Speak Obsidiman', rank: 5 },
      { kind: 'language', name: 'Read and Write Obsidiman', rank: 5 },
      { kind: 'skill', name: 'Obsidiman Lore', rank: 5 },
      manual(
        'Present yourself before at least three Rank 5 Brothers of Stone and complete their philosophical questioning and Path Ordeal.',
      ),
    ],
    questorProhibited: false,
    incompatiblePathIds: [],
    ordeal:
      'A gathering of at least three Rank 5 Brothers conducts rigorous philosophical questioning before assigning a Path Ordeal.',
    bloodMagicDamage: 2,
    rankBonuses: [
      b(2, 'mysticDefense', 1, '+1 Mystic Defense'),
      b(4, 'physicalDefense', 1, '+1 Physical Defense'),
      b(7, 'mysticDefense', 2, '+2 Mystic Defense'),
      b(8, 'recovery', 1, '+1 Recovery Test per day'),
      b(9, 'physicalDefense', 2, '+2 Physical Defense'),
      b(10, 'recovery', 2, '+2 Recovery Tests per day'),
    ],
    optionTiers: [
      o(1, 'journeyman', [
        'Astral Sight',
        'Danger Sense',
        'Deliberate Assault',
        'Earth Bond',
        'Item History',
        'Navigation',
        'Steel Thought',
        'True Sight',
        'Wilderness Survival',
        'Wound Balance',
      ]),
      o(5, 'warden', [
        'Earth Skin',
        'Earth Speak',
        'Earth Walk',
        'Iron Constitution',
        'Resist Taunt',
        'Temper Self',
      ]),
      o(9, 'master', [
        'Relentless Recovery',
        'Resist Pain',
        'Unflinching Fortitude',
        'Wisdom of Ages',
      ]),
    ],
    halfMagic:
      'Locate other Brothers of Stone, recall the brotherhood’s history, and use a Perception-based Half-Magic test against Mystic Defense to detect earth elemental spirits within 30 yards.',
    karmaRitual:
      'Perform the adept’s Karma Ritual with bare skin in direct contact with earth or stone while connecting the ritual to the brotherhood.',
    restrictions: [
      'The Path is restricted to obsidimen.',
      'Brother of Stone Rank adds to Interaction tests made to impress or request favors from other Brothers of Stone.',
    ],
    features: [
      'Karma knacks: Stability of Stone, Earth Cloak, Earth Sense, Resilience of Stone, Earth Brother, Force of Stone, Earth Elemental Affinity, and Stone Flesh.',
      'Thread Weaving maneuvers: Falling Rocks and Stone Strike.',
      'Patterncraft spell access: Resist Earth, Uneven Ground, Earth Surfing, and Earth Wall.',
      'Earth Bond and Earth Walk knacks include Earth Slumber, Earth Mending, Earth Awareness, and Stone Walk.',
      'Wisdom of Ages permits communion with the adept’s home Liferock.',
    ],
    additionalCitations: [
      'The Adept’s Journey: Mystic Paths, p. 68',
      'The Adept’s Journey: Mystic Paths, p. 208',
    ],
    advancement:
      'Advance the Brother of Stone Path talent at Master-tier costs to a maximum of Rank 10. Path Talent Options unlock at Ranks 1, 5, and 9.',
    page: 11,
    pageEnd: 22,
  }),
  imported({
    id: 'outcast',
    name: 'Outcast Path',
    summary:
      'A troll-focused Path entered through the Ritual of Severance and reflection on ka’tosh.',
    initiationCost: 200,
    minimumCircle: 5,
    maximumRank: 5,
    talentCostTier: 'journeyman',
    race: 'Troll',
    requirements: [manual('Undergo the Ritual of Severance.')],
    questorProhibited: false,
    incompatiblePathIds: [],
    ordeal: 'Ritual of Severance',
    bloodMagicDamage: 0,
    rankBonuses: [
      b(2, 'socialDefense', 1, '+1 Social Defense'),
      b(4, 'socialDefense', 2, '+2 Social Defense'),
    ],
    optionTiers: [
      o(1, 'journeyman', [
        'Battle Shout',
        'Danger Sense',
        'Fireblood',
        'Iron Constitution',
        'Rite of Kho’pesh',
        'Steel Thought',
        'Wilderness Survival',
        'Wound Balance',
      ]),
      o(5, 'warden', ['Lion Heart', 'Temper Flesh']),
    ],
    halfMagic: 'Find Outcasts and recall their history.',
    karmaRitual: 'Reflects severance and ka’tosh.',
    restrictions: [],
    advancement:
      'Gain options through an honor-related epiphany followed by eight hours of meditation.',
    page: null,
    pageEnd: null,
  }),
  imported({
    id: 'windmaster',
    name: 'Windmaster Path',
    summary: 'A windling martial Path centered on defensive aerial combat.',
    initiationCost: 500,
    minimumCircle: 5,
    maximumRank: 10,
    talentCostTier: 'master',
    race: 'Windling',
    requirements: [
      { kind: 'talent', name: 'Melee Weapons', rank: 5 },
      manual('Complete a Windmaster Ordeal.'),
    ],
    questorProhibited: false,
    incompatiblePathIds: ['messenger'],
    ordeal: 'Windmaster Ordeal',
    bloodMagicDamage: 2,
    rankBonuses: [
      b(2, 'physicalDefense', 1, '+1 Physical Defense'),
      b(4, 'mysticDefense', 1, '+1 Mystic Defense'),
      b(6, 'physicalDefense', 2, '+2 Physical Defense'),
      b(8, 'recovery', 1, '+1 Recovery Test'),
      b(9, 'physicalDefense', 3, '+3 Physical Defense'),
      b(10, 'initiative', 1, '+1 Initiative'),
    ],
    optionTiers: [
      o(1, 'journeyman', [
        'Air Speaking',
        'Awareness',
        'Distract',
        'Danger Sense',
        'Sprint',
        'Stealthy Stride',
        'Surprise Strike',
        'Tactics',
        'Tiger Spring',
        'Wound Balance',
      ]),
      o(5, 'warden', [
        'Air Dance',
        'Dive Attack',
        'Leadership',
        'Lion Heart',
        'Spot Armor Flaw',
        'Temper Flesh',
      ]),
      o(9, 'master', [
        'Critical Hit',
        'Defensive Posture',
        'Unflinching Fortitude',
        'Wing Blitz',
      ]),
    ],
    halfMagic: 'Applies Windmaster martial and aerial knowledge.',
    karmaRitual: 'Incorporates aerial vigilance and defense.',
    restrictions: [],
    advancement: 'Requires the recorded Windmaster initiation and ordeal.',
    page: null,
    pageEnd: null,
  }),
  imported({
    id: 'tail-dancer',
    name: 'Tail Dancer Path',
    summary: 'A t’skrang martial Path emphasizing mobile tail-based combat.',
    initiationCost: 500,
    minimumCircle: 5,
    maximumRank: 10,
    talentCostTier: 'master',
    race: 'T’skrang',
    requirements: [
      { kind: 'talent', name: 'Dancing', rank: 5 },
      { kind: 'talent', name: 'Melee Weapons', rank: 5 },
      manual('Complete a Tail Dancer Ordeal.'),
    ],
    questorProhibited: false,
    incompatiblePathIds: ['horror-stalker'],
    ordeal: 'Tail Dancer Ordeal',
    bloodMagicDamage: 2,
    rankBonuses: [
      b(2, 'physicalDefense', 1, '+1 Physical Defense'),
      b(4, 'socialDefense', 1, '+1 Social Defense'),
      b(6, 'physicalDefense', 2, '+2 Physical Defense'),
      b(8, 'initiative', 1, '+1 Initiative'),
      b(9, 'socialDefense', 2, '+2 Social Defense'),
      b(10, 'initiative', 2, '+2 Initiative'),
    ],
    optionTiers: [
      o(1, 'journeyman', [
        'Acrobatic Defense',
        'Dance Partner',
        'Impressive Display',
        'Maneuver',
        'Tail Dance',
        'Tail Spike',
        'Tiger Spring',
        'Unarmed Combat',
        'Wound Balance',
        'Ch’tard',
        'Edo',
        'Shivoavara',
      ]),
      o(5, 'warden', [
        'Engaging Dance',
        'Graceful Exit',
        'Spot Armor Flaw',
        'Swift Kick',
      ]),
      o(9, 'master', ['Champion Challenge', 'Critical Hit']),
    ],
    halfMagic: 'Applies Tail Dancer martial and performance knowledge.',
    karmaRitual: 'Incorporates movement, dance, and tail combat.',
    restrictions: [],
    advancement: 'Requires the recorded Tail Dancer initiation and ordeal.',
    page: null,
    pageEnd: null,
  }),
  imported({
    id: 'fire-eater',
    name: 'Fire Eater Path',
    summary:
      'An ork Path that cultivates gahad as a source of identity, courage, and action.',
    initiationCost: 200,
    minimumCircle: 5,
    maximumRank: 5,
    talentCostTier: 'journeyman',
    race: 'Ork',
    requirements: [
      manual(
        'Complete a personal Fire Eater ordeal and the modified shpita initiation.',
      ),
    ],
    questorProhibited: false,
    incompatiblePathIds: ['horror-stalker'],
    ordeal:
      'Give in to gahad spectacularly in an unfamiliar, public, and vulnerable situation.',
    bloodMagicDamage: 2,
    rankBonuses: [
      b(2, 'socialDefense', 1, '+1 Social Defense'),
      b(4, 'physicalDefense', 1, '+1 Physical Defense'),
    ],
    optionTiers: [
      o(1, 'journeyman', [
        'Battle Shout',
        'Emotion Song',
        'Fireblood',
        'Fires of Gahad',
        'First Impression',
        'Heartening Laugh',
        'Impressive Display',
        'Lion Heart',
      ]),
      o(5, 'warden', ['Fire Heal', 'Resist Taunt']),
    ],
    halfMagic:
      'Find Fire Eaters, recall their history, and learn about an ork’s gahad with Perception-based Half-Magic.',
    karmaRitual: 'Incorporates the adept’s gahad.',
    restrictions: ['Cannot also follow Horror Stalker.'],
    advancement:
      'Approval by three higher-rank Fire Eaters or one Droth’Cha, followed by a modified shpita ritual.',
    page: 23,
    pageEnd: 31,
  }),
  imported({
    id: 'horror-stalker',
    name: 'Horror Stalker Path',
    summary:
      'A relentless Path devoted to understanding, hunting, and destroying Horrors.',
    initiationCost: 500,
    minimumCircle: 5,
    maximumRank: 10,
    talentCostTier: 'master',
    race: null,
    requirements: [
      manual(
        'Have lost someone important to a Horror, or have been marked by and killed a Horror; complete an ordeal and taint examination.',
      ),
    ],
    questorProhibited: true,
    incompatiblePathIds: [
      'fire-eater',
      'journeyman',
      'messenger',
      'tail-dancer',
      'woodsman',
    ],
    ordeal:
      'Directly confront a Horror, discover its pattern, Name, or weakness, or disrupt its plans.',
    bloodMagicDamage: 2,
    rankBonuses: [
      b(2, 'mysticDefense', 1, '+1 Mystic Defense'),
      b(4, 'physicalDefense', 1, '+1 Physical Defense'),
      b(6, 'mysticDefense', 2, '+2 Mystic Defense'),
      b(8, 'mysticArmor', 1, '+1 Mystic Armor'),
      b(9, 'physicalDefense', 2, '+2 Physical Defense'),
      b(10, 'recovery', 1, '+1 Recovery Test'),
    ],
    optionTiers: [
      o(1, 'journeyman', [
        'Astral Sight',
        'Awareness',
        'Bear Mark',
        'Call of Harrow',
        'Danger Sense',
        'Mystic Pursuit',
        'Research',
        'Stealthy Stride',
        'Suppress Curse',
        'Steel Thought',
      ]),
      o(5, 'warden', [
        'Bane Strike',
        'Gaze into the Abyss',
        'Lion Heart',
        'Purge Karma',
        'Sense Horrorspawn',
        'True Sight',
      ]),
      o(9, 'master', [
        'Life Check',
        'Netherwalk',
        'Relentless Recovery',
        'Unflinching Fortitude',
      ]),
    ],
    halfMagic: 'Use Perception-based Half-Magic in place of Horror Lore tests.',
    karmaRitual:
      'Incorporates the hunt, lost loved ones, or searching for Horror information.',
    restrictions: [
      'Questors cannot initiate or advance.',
      'Path secrets cannot be taught to outsiders.',
    ],
    advancement:
      'A higher-rank member approves each ordeal; Ranks 5 and 9 require a tribunal of three.',
    page: 35,
    pageEnd: 41,
  }),
  imported({
    id: 'journeyman',
    name: 'Journeyman Path',
    summary:
      'A human Path using Versatility to broaden perspective beyond one Discipline.',
    initiationCost: 500,
    minimumCircle: 5,
    maximumRank: 5,
    talentCostTier: 'master',
    race: 'Human',
    requirements: [
      { kind: 'talent', name: 'Versatility', rank: 5 },
      manual(
        'Complete a perspective-broadening ordeal and take the blood oath.',
      ),
    ],
    questorProhibited: false,
    incompatiblePathIds: ['horror-stalker'],
    ordeal:
      'Overcome varied challenges through Versatility or knowledge of other Disciplines.',
    bloodMagicDamage: 2,
    rankBonuses: [],
    optionTiers: [
      o(1, 'journeyman', ['Any Novice talent'], 5),
      o(3, 'warden', ['Any Journeyman talent'], 3),
      o(5, 'master', ['Any Warden talent', 'Morphism']),
    ],
    halfMagic: 'Use Versatility-based adaptation and broad knowledge.',
    karmaRitual: 'Expands perspective and adapts to the surroundings.',
    restrictions: [
      'Versatility Rank must equal or exceed desired Path Rank plus 5.',
      'Cannot also follow Horror Stalker.',
    ],
    advancement:
      'A Journeyman of the sought Rank judges the ordeal; Rank 5 requires three Rank 5 Journeymen.',
    page: 47,
    pageEnd: 54,
  }),
  imported({
    id: 'liberator',
    name: 'Liberator Path',
    summary:
      'A Path devoted to resisting tyranny, freeing captives, and preserving freedom.',
    initiationCost: 500,
    minimumCircle: 5,
    maximumRank: 10,
    talentCostTier: 'master',
    race: null,
    requirements: [
      manual('Complete a Liberator ordeal and swear a blood peace oath.'),
    ],
    questorProhibited: false,
    incompatiblePathIds: ['messenger'],
    ordeal:
      'Complete a personalized test requiring abilities outside the candidate’s usual strengths.',
    bloodMagicDamage: 2,
    rankBonuses: [
      b(2, 'physicalDefense', 1, '+1 Physical Defense'),
      b(4, 'socialDefense', 1, '+1 Social Defense'),
      b(6, 'physicalDefense', 2, '+2 Physical Defense'),
      b(8, 'recovery', 1, '+1 Recovery Test'),
      b(9, 'socialDefense', 2, '+2 Social Defense'),
      b(10, 'recovery', 2, '+2 Recovery Tests'),
    ],
    optionTiers: [
      o(1, 'journeyman', [
        'Air Speaking',
        'Awareness',
        'Disguise Self',
        'Empathic Sense',
        'Heartening Laugh',
        'Lock Picking',
        'Picking Pockets',
        'Sense Captive',
        'Stealthy Stride',
        'Tyranny’s Ruin',
      ]),
      o(5, 'warden', [
        'Conceal Object',
        'Inspire Others',
        'Leadership',
        'Power Mask',
        'Resist Taunt',
        'Shout of Justice',
      ]),
      o(9, 'master', [
        'Escape Plan',
        'Liberation',
        'Safe Thought',
        'Thought Link',
      ]),
    ],
    halfMagic:
      'Use Half-Magic for tyrants, regimes, slavers, resistance fighters, and tactics.',
    karmaRitual: 'Incorporates expressions of freedom.',
    restrictions: [
      'Knowingly partnering with a slaver or tyrant suspends benefits until atonement.',
    ],
    advancement:
      'Three higher-ranking Liberators approve the ordeal and advancement ritual.',
    page: 59,
    pageEnd: 67,
  }),
  imported({
    id: 'messenger',
    name: 'Messenger Path',
    summary: 'An independent Path devoted to neutral, reliable delivery.',
    initiationCost: 500,
    minimumCircle: 5,
    maximumRank: 10,
    talentCostTier: 'master',
    race: null,
    requirements: [
      manual(
        'Renounce prior allegiances, complete three delivery tests, and take the Messenger’s Vow.',
      ),
    ],
    questorProhibited: true,
    incompatiblePathIds: [
      'horror-stalker',
      'liberator',
      'purifier',
      'windmaster',
      'woodsman',
    ],
    ordeal:
      'Complete discovery, long-distance timed, and covert delivery tests.',
    bloodMagicDamage: 2,
    rankBonuses: [
      b(2, 'socialDefense', 1, '+1 Social Defense'),
      b(4, 'mysticDefense', 1, '+1 Mystic Defense'),
      b(6, 'physicalDefense', 1, '+1 Physical Defense'),
      b(8, 'recovery', 1, '+1 Recovery Test'),
      b(9, 'socialDefense', 2, '+2 Social Defense'),
      b(10, 'initiative', 1, '+1 Initiative Step'),
    ],
    optionTiers: [
      o(1, 'journeyman', [
        'Astral Sight',
        'Awareness',
        'Book Memory',
        'Conversation',
        'Danger Sense',
        'Disguise Self',
        'Etiquette',
        'Read and Write Language',
        'Speak Language',
        'Stealthy Stride',
      ]),
      o(5, 'warden', [
        'Evidence Analysis',
        'Graceful Exit',
        'Orbiting Spy',
        'Power Mask',
        'Safe Path',
        'Spirit Mount',
      ]),
      o(9, 'master', [
        'Astral Pocket',
        'Netherwalk',
        'Safe Thought',
        'Thought Link',
      ]),
    ],
    halfMagic:
      'Use Half-Magic for trade routes, travel perils, and transportation.',
    karmaRitual: 'Incorporates travel, sensory awareness, and self-reliance.',
    restrictions: [
      'Must remain neutral and unsworn.',
      'Questors and Blood Elves are barred.',
    ],
    advancement:
      'A panel of three qualified Messengers approves missions and teaches the next oath stanza.',
    page: 73,
    pageEnd: 81,
  }),
  imported({
    id: 'purifier',
    name: 'Purifier Path',
    summary:
      'A Path dedicated to healing the land and opposing Horrors and despoilers.',
    initiationCost: 200,
    minimumCircle: 5,
    maximumRank: 5,
    talentCostTier: 'journeyman',
    race: null,
    requirements: [
      manual(
        'Complete an ordeal protecting the Earth and meditate at a kaliff.',
      ),
    ],
    questorProhibited: false,
    incompatiblePathIds: ['messenger'],
    ordeal: 'Heal damaged land, defeat a despoiler, or slay a Horror.',
    bloodMagicDamage: 2,
    rankBonuses: [
      b(2, 'mysticDefense', 1, '+1 Mystic Defense'),
      b(4, 'mysticDefense', 2, '+2 Mystic Defense'),
    ],
    optionTiers: [
      o(1, 'journeyman', [
        'Astral Sight',
        'Awareness',
        'Blood Share',
        'Cold Purify',
        'Earth Bond',
        'Elemental Hold',
        'Elemental Tongues',
        'Wilderness Survival',
      ]),
      o(5, 'warden', ['Lifesight', 'Purification']),
    ],
    halfMagic: 'Recognize and restore environmental destruction.',
    karmaRitual: 'Incorporates healing, purification, or retribution.',
    restrictions: [
      'Blood Elves serving Blood Wood are barred.',
      'Purifiers never become Horror Stalkers.',
    ],
    advancement: 'Three Rank 5 Purifiers approve the ordeal at a kaliff.',
    page: 97,
    pageEnd: 104,
  }),
  imported({
    id: 'scholar',
    name: 'Scholar Path',
    summary:
      'An academic Path devoted to rigorous research and preservation of knowledge.',
    initiationCost: 200,
    minimumCircle: 5,
    maximumRank: 5,
    talentCostTier: 'journeyman',
    race: null,
    requirements: [
      { kind: 'knowledge-skill', rank: 5 },
      manual(
        'Pass admissions, present work, edit two applicants’ works, and complete the symposium initiation.',
      ),
    ],
    questorProhibited: false,
    incompatiblePathIds: [],
    ordeal:
      'Present independent research and defend it at an official symposium.',
    bloodMagicDamage: 2,
    rankBonuses: [
      b(2, 'socialDefense', 1, '+1 Social Defense'),
      b(4, 'mysticDefense', 1, '+1 Mystic Defense'),
    ],
    optionTiers: [
      o(1, 'journeyman', [
        'Arcane Mutterings',
        'Expansive Expertise',
        'Book Memory',
        'Conversation',
        'Item History',
        'Read and Write Language',
        'Research',
        'Speak Language',
      ]),
      o(5, 'warden', ['Applied Knowledge', 'Evidence Analysis']),
    ],
    halfMagic:
      'Use Half-Magic for academic information, libraries, and bureaucracy.',
    karmaRitual: 'Imparts knowledge or focuses on expertise.',
    restrictions: [
      'Questors of non-scholarly Passions require GM review.',
      'Plagiarism or fabrication causes severance.',
    ],
    advancement:
      'Conduct research, obtain peer endorsements, and defend a dissertation.',
    page: 109,
    pageEnd: 116,
  }),
  imported({
    id: 'woodsman',
    name: 'Woodsman Path',
    summary:
      'An elven Path protecting elven people, culture, lore, and forests.',
    initiationCost: 500,
    minimumCircle: 5,
    maximumRank: 10,
    talentCostTier: 'master',
    race: 'Elf',
    requirements: [
      { kind: 'language', name: 'Speak Elf', rank: 1 },
      { kind: 'language', name: 'Read and Write Elf (Sperethiel)', rank: 1 },
      { kind: 'skill', name: 'Elf Lore', rank: 5 },
      manual('Complete a Woodsman ordeal and receive a nordaltre.'),
    ],
    questorProhibited: false,
    incompatiblePathIds: ['horror-stalker', 'messenger'],
    ordeal:
      'Protect elven people or culture, eliminate a threat, or recover lost lore.',
    bloodMagicDamage: 2,
    rankBonuses: [
      b(2, 'physicalDefense', 1, '+1 Physical Defense'),
      b(4, 'mysticDefense', 1, '+1 Mystic Defense'),
      b(6, 'physicalDefense', 2, '+2 Physical Defense'),
      b(8, 'initiative', 1, '+1 Initiative'),
      b(9, 'mysticDefense', 2, '+2 Mystic Defense'),
      b(10, 'recovery', 1, '+1 Recovery Test'),
    ],
    optionTiers: [
      o(1, 'journeyman', [
        'Anticipate Blow',
        'Awareness',
        'Climbing',
        'Danger Sense',
        'Great Leap',
        'Guardian’s Service',
        'Stealthy Stride',
        'Tracking',
        'Wilderness Survival',
        'Wood Skin',
      ]),
      o(5, 'warden', [
        'Mystic Pursuit',
        'Evidence Analysis',
        'Lifesight',
        'Safe Path',
        'Wood Speak',
        'Wood Walk',
      ]),
      o(9, 'master', ['Chameleon', 'Forest Sense', 'Plant Talk', 'Vine Armor']),
    ],
    halfMagic: 'Detect wood elemental spirits within 30 yards.',
    karmaRitual: 'Incorporates forests, protection, or elven culture.',
    restrictions: ['Horror Stalkers are barred.'],
    advancement:
      'A qualifying nordal approves advancement; higher Ranks require Ketrahim and a night journey.',
    page: 145,
    pageEnd: 155,
  }),
] as const;

export const earthdawnPathById = new Map(
  earthdawnPathProfiles.map((path) => [path.id, path]),
);
export function pathRankModifier(
  path: EarthdawnPathProfile,
  rank: number,
  target: PathBonusTarget,
) {
  return (
    path.rankBonuses
      .filter((entry) => entry.target === target && entry.rank <= rank)
      .sort((a, c) => c.rank - a.rank)[0]?.value ?? 0
  );
}
