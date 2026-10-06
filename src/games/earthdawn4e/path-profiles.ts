export type EarthdawnPathProfile = {
  id: string;
  name: string;
  summary: string;
  initiationCost: number;
  minimumCircle: number;
  maximumRank: number;
  talentCostTier: 'journeyman' | 'master';
  race: string | null;
  requiredTalentRanks: Readonly<Record<string, number>>;
  ordeal: string;
  bloodMagicDamage: number;
  rankBonuses: Readonly<Record<number, readonly string[]>>;
  optionTiers: readonly {
    minimumRank: number;
    costTier: 'journeyman' | 'warden' | 'master';
    talents: readonly string[];
  }[];
  advancement: string;
  citation: string;
};

export const earthdawnPathProfiles: readonly EarthdawnPathProfile[] = [
  {
    id: 'outcast',
    name: 'Outcast Path',
    summary:
      'A troll-focused Mystic Path entered through the Ritual of Severance and personal reflection on ka’tosh.',
    initiationCost: 200,
    minimumCircle: 5,
    maximumRank: 5,
    talentCostTier: 'journeyman',
    race: 'Troll',
    requiredTalentRanks: {},
    ordeal: 'Ritual of Severance',
    bloodMagicDamage: 0,
    rankBonuses: { 2: ['+1 Social Defense'], 4: ['+2 Social Defense'] },
    optionTiers: [
      {
        minimumRank: 1,
        costTier: 'journeyman',
        talents: [
          'Battle Shout',
          'Danger Sense',
          'Fireblood',
          'Iron Constitution',
          'Rite of Kho’pesh',
          'Steel Thought',
          'Wilderness Survival',
          'Wound Balance',
        ],
      },
      {
        minimumRank: 5,
        costTier: 'warden',
        talents: ['Lion Heart', 'Temper Flesh'],
      },
    ],
    advancement:
      'Talent options are gained through an honor-related epiphany followed by eight hours of meditation, not from an instructor.',
    citation: 'User-supplied Earthdawn Fourth Edition rules reference',
  },
  {
    id: 'windmaster',
    name: 'Windmaster Path',
    summary:
      'A windling martial Path centered on defensive aerial combat and battlefield awareness.',
    initiationCost: 500,
    minimumCircle: 5,
    maximumRank: 10,
    talentCostTier: 'master',
    race: 'Windling',
    requiredTalentRanks: { 'Melee Weapons': 5 },
    ordeal: 'Windmaster Ordeal',
    bloodMagicDamage: 2,
    rankBonuses: {
      2: ['+1 Physical Defense'],
      4: ['+1 Mystic Defense'],
      6: ['+2 Physical Defense'],
      8: ['+1 Recovery Test'],
      9: ['+3 Physical Defense'],
      10: ['+1 Initiative'],
    },
    optionTiers: [
      {
        minimumRank: 1,
        costTier: 'journeyman',
        talents: [
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
        ],
      },
      {
        minimumRank: 5,
        costTier: 'warden',
        talents: [
          'Air Dance',
          'Dive Attack',
          'Leadership',
          'Lion Heart',
          'Spot Armor Flaw',
          'Temper Flesh',
        ],
      },
      {
        minimumRank: 9,
        costTier: 'master',
        talents: [
          'Critical Hit',
          'Defensive Posture',
          'Unflinching Fortitude',
          'Wing Blitz',
        ],
      },
    ],
    advancement: 'Requires the recorded Windmaster initiation and ordeal.',
    citation: 'User-supplied Earthdawn Fourth Edition rules reference',
  },
  {
    id: 'tail-dancer',
    name: 'Tail Dancer Path',
    summary:
      'A t’skrang martial Path from the House K’tenshin War College emphasizing mobile tail-based combat.',
    initiationCost: 500,
    minimumCircle: 5,
    maximumRank: 10,
    talentCostTier: 'master',
    race: 'T’skrang',
    requiredTalentRanks: { Dancing: 5, 'Melee Weapons': 5 },
    ordeal: 'Tail Dancer Ordeal',
    bloodMagicDamage: 2,
    rankBonuses: {
      2: ['+1 Physical Defense'],
      4: ['+1 Social Defense'],
      6: ['+2 Physical Defense'],
      8: ['+1 Initiative'],
      9: ['+2 Social Defense'],
      10: ['+2 Initiative'],
    },
    optionTiers: [
      {
        minimumRank: 1,
        costTier: 'journeyman',
        talents: [
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
        ],
      },
      {
        minimumRank: 5,
        costTier: 'warden',
        talents: [
          'Engaging Dance',
          'Graceful Exit',
          'Spot Armor Flaw',
          'Swift Kick',
        ],
      },
      {
        minimumRank: 9,
        costTier: 'master',
        talents: ['Champion Challenge', 'Critical Hit'],
      },
    ],
    advancement: 'Requires the recorded Tail Dancer initiation and ordeal.',
    citation: 'User-supplied Earthdawn Fourth Edition rules reference',
  },
] as const;
