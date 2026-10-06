import type { EarthdawnDefinition } from './catalog';
import type { EarthdawnRuleBlock } from './rule-types';

const rule = (
  set: 'basic' | 'creation',
  order: number,
  name: string,
  summary: string,
  blocks: readonly EarthdawnRuleBlock[],
  aliases: string[] = [],
): EarthdawnDefinition => ({
  id: `ed4.reference.${set}-rule.${order}`,
  kind: set === 'basic' ? 'basic-rule' : 'creation-rule',
  name: `${order}. ${name}`,
  summary,
  mechanics: blocks
    .flatMap((block) =>
      block.type === 'table'
        ? [block.columns.join(' '), ...block.rows.map((row) => row.join(' '))]
        : block.type === 'list'
          ? block.items
          : [block.text],
    )
    .join(' '),
  requirements: [],
  aliases,
  sourceId: 'ed4.players-guide',
  source: 'Earthdawn Fourth Edition reference',
  page: null,
  verification: 'reference-only',
  ruleMetadata: { set, order, blocks },
});
const paragraph = (text: string): EarthdawnRuleBlock => ({
  type: 'paragraph',
  text,
});
const note = (text: string): EarthdawnRuleBlock => ({ type: 'note', text });
const warning = (text: string): EarthdawnRuleBlock => ({
  type: 'warning',
  text,
});
const list = (...items: string[]): EarthdawnRuleBlock => ({
  type: 'list',
  items,
});
const table = (columns: string[], rows: string[][]): EarthdawnRuleBlock => ({
  type: 'table',
  columns,
  rows,
});

export const earthdawnCreationRules: readonly EarthdawnDefinition[] = [
  rule(
    'creation',
    1,
    'Choose a Discipline',
    'Choose the character’s primary magical path or profession. Starting adepts begin at First Circle.',
    [
      paragraph(
        'Record the Discipline’s First Circle talents, options, abilities, Karma permissions, and spell access. A non-Adept Questor receives no starting Discipline talents or matrices.',
      ),
    ],
    ['first circle'],
  ),
  rule(
    'creation',
    2,
    'Choose a Race',
    'Choose one of the eight core Namegiver races.',
    [
      paragraph(
        'Race supplies starting Attributes, Movement, Karma modifier, racial abilities, and fixed bonuses: Dwarf, Elf, Human, Obsidiman, Ork, Troll, T’skrang, or Windling.',
      ),
    ],
    ['namegiver'],
  ),
  rule(
    'creation',
    3,
    'Generate Attributes',
    'Spend 25 Attribute Points against the race’s starting values.',
    [
      table(
        ['Increase', '+1', '+2', '+3', '+4', '+5', '+6', '+7', '+8'],
        [['Total cost', '1', '2', '3', '5', '7', '9', '12', '15']],
      ),
      paragraph(
        'Lowering an Attribute by one or two grants the same number of points. Unused points increase Maximum Karma one-for-one. Convert final values to Steps.',
      ),
    ],
    ['attribute points'],
  ),
  rule(
    'creation',
    4,
    'Determine Characteristics',
    'Calculate defenses, health, recovery, Initiative, movement, carrying capacity, and Karma.',
    [
      paragraph(
        'Physical Defense derives from Dexterity, Mystic Defense from Perception, and Social Defense from Charisma. Toughness determines health and recovery. Maximum Karma equals racial Karma modifier × applicable Discipline Circle, plus unused creation Attribute Points.',
      ),
    ],
    ['maximum karma'],
  ),
  rule(
    'creation',
    5,
    'Record Racial Abilities',
    'Record every ability and modifier granted by the selected race.',
    [
      paragraph(
        'Apply structured bonuses to the appropriate characteristic and retain descriptive abilities such as vision, Versatility, tail combat, aquatic movement, Flight, and Astral Sight.',
      ),
    ],
    ['racial features'],
  ),
  rule(
    'creation',
    6,
    'Assign Talent Ranks',
    'Distribute eight starting Talent Ranks among First Circle Discipline talents.',
    [
      paragraph(
        'Include a selected First Circle Talent Option and apply a maximum starting Rank of 3. A qualifying first magician Discipline receives two free Standard Matrices; secondary Disciplines do not duplicate that grant.',
      ),
    ],
    ['talent points', 'standard matrix'],
  ),
  rule(
    'creation',
    7,
    'Choose Spells',
    'Magicians learn starting spells using a budget equal to Perception Step.',
    [
      paragraph(
        'First Circle spells cost one creation point and Second Circle spells cost two. Record the source variant, Discipline-specific Thread Weaving requirement, and matrix capacity separately.',
      ),
    ],
    ['starting spells'],
  ),
  rule(
    'creation',
    8,
    'Assign Skill Ranks',
    'Take mandatory skill ranks, then distribute eight additional ranks freely.',
    [
      list(
        '2 Knowledge ranks',
        '1 Artisan rank',
        '2 Speak Language ranks',
        '1 Read/Write Language rank',
        '8 additional ranks across General, Knowledge, Artisan, or Language skills',
      ),
      paragraph(
        'No skill may begin above Rank 3. Non-Adept Questors use this allocation and receive no Discipline talents.',
      ),
    ],
    ['non-adept questor'],
  ),
  rule(
    'creation',
    9,
    'Equip the Character',
    'Record starting gear, armor, weapons, and 100 silver pieces.',
    [
      paragraph(
        'Starting equipment includes an adventurer’s kit, artisan tools, dagger, clothing, one week of rations, and a magician’s grimoire when applicable. Apply Armor, Defense, Initiative, weight, race-fitting, and size effects.',
      ),
    ],
    ['starting equipment'],
  ),
  rule(
    'creation',
    10,
    'Finish the Character',
    'Complete the Name, appearance, personality, history, motivations, and goals.',
    [
      paragraph(
        'Review Steps, dice, defenses, health, Movement, Karma, talents, skills, spells, matrices, equipment, and remaining resources before finalizing.',
      ),
    ],
    ['finalize'],
  ),
] as const;

export const earthdawnBasicRules: readonly EarthdawnDefinition[] = [
  rule(
    'basic',
    1,
    'Resolve a Test',
    'Calculate a Step, roll exploding dice, and resolve an Action or Effect test.',
    [
      list(
        'Choose the ability and relevant Attribute.',
        'Calculate the Step, usually Attribute Step plus Talent or Skill Rank.',
        'Apply modifiers and decide whether to spend Karma.',
        'Roll; maximum die results explode.',
        'Compare an Action test to its Difficulty Number; use an Effect test as the quantity produced.',
      ),
      table(
        ['Result', 'Successes', 'Extra'],
        [
          ['Below DN', '0', '0'],
          ['DN to DN + 4', '1', '0'],
          ['DN + 5 to +9', '2', '1'],
          ['DN + 10 to +14', '3', '2'],
          ['DN + 15 to +19', '4', '3'],
        ],
      ),
      note(
        'Bonuses and penalties normally alter Steps before rolling. The Rule of One applies to Action tests, not Effect tests.',
      ),
      note(
        'Citation: Earthdawn Fourth Edition Player’s Guide, pp. 32, 34, 381.',
      ),
    ],
    ['exploding dice', 'success levels'],
  ),
  rule(
    'basic',
    2,
    'Combat Procedure',
    'Resolve attacks, damage, Armor, Wounds, Knockdown, and health in sequence.',
    [
      list(
        'Roll the attack against Physical Defense.',
        'The first success hits; each extra success adds +2 Damage Steps.',
        'Roll damage and subtract applicable Armor.',
        'A hit at or above Wound Threshold causes a Wound.',
        'At Wound Threshold + 5 damage, test Knockdown.',
        'Record damage and check Unconsciousness and Death.',
      ),
      table(
        ['Option', 'Strain', 'Use'],
        [
          ['Aggressive Attack', '1', '+3 Attack/Damage; −3 Defenses'],
          ['Defensive Stance', '0', '+3 Defenses; −3 most tests'],
          ['Called Shot', '1', '−3 Attack for a precise target'],
          ['Split Movement', '1', 'Move, act, move; become Harried'],
          ['Shatter Shield', '1', 'Damage vs. Shatter Threshold'],
        ],
      ),
      warning(
        'Aggressive Attack and Defensive Stance cannot be combined. Spells use their own Casting Difficulty, Effect, Armor, and Success Levels.',
      ),
      note('Citation: Earthdawn Fourth Edition Player’s Guide, pp. 377–379.'),
    ],
    ['attack', 'damage', 'knockdown'],
  ),
  rule(
    'basic',
    3,
    'Karma',
    'Spend Karma only where a Talent, Half-Magic rule, ability, knack, or item permits it.',
    [
      table(
        ['Question', 'Rule'],
        [
          [
            'Maximum',
            'Racial modifier × applicable Discipline Circle + unused Attribute Points',
          ],
          ['Spend', 'Add an exploding d6'],
          ['Master tier', 'Karma die becomes d8 at Circle 13'],
          ['Ritual', 'Thirty minutes restores the pool'],
        ],
      ),
      note(
        'Talent Options may use Karma. Separate permissions can permit additional points. Spellcasting permission does not automatically apply to an Effect test.',
      ),
      note(
        'Citations: Earthdawn Fourth Edition Player’s Guide, p. 120; Questors, p. 20.',
      ),
    ],
    ['karma ritual'],
  ),
  rule(
    'basic',
    4,
    'Damage, Wounds, and Recovery',
    'Track Damage, Wounds, Recovery Tests, and Blood Magic Damage separately.',
    [
      table(
        ['Track', 'Meaning'],
        [
          ['Current Damage', 'Accumulates toward unconsciousness and death'],
          ['Wounds', 'Penalize most tests and Recovery'],
          ['Recovery Tests', 'Daily healing resource'],
          ['Blood Magic Damage', 'Committed to an ongoing effect'],
        ],
      ),
      list(
        'Spend a Recovery Test and roll the Toughness-based Recovery Step.',
        'Subtract Wounds from the result and recover at least 1 damage.',
        'Allow an hour between ordinary Recovery Tests unless a rule says otherwise.',
        'Natural healing can remove one Wound after a full night when ordinary Current Damage is zero.',
      ),
      note(
        'The Willpower bonus after Stun heals Stun only. Blood Magic Damage does not block natural Wound healing.',
      ),
      note('Citation: Earthdawn Fourth Edition Player’s Guide, pp. 381, 383.'),
    ],
    ['healing', 'stun'],
  ),
  rule(
    'basic',
    5,
    'Spellcasting Methods',
    'Choose a matrix, attuned grimoire, unattuned grimoire, or raw magic.',
    [
      table(
        ['Method', 'Preparation', 'Higher Circle?', 'Risk'],
        [
          ['Matrix', 'Suitable attuned matrix', 'No', 'Safe'],
          [
            'Attuned grimoire',
            '10-minute Patterncraft test',
            'Yes',
            'Filtered',
          ],
          [
            'Unattuned grimoire',
            'Reference spell directly',
            'Yes',
            'Raw magic',
          ],
          [
            'Raw magic',
            'No filter',
            'Yes',
            'Warping, damage, Horror attention',
          ],
        ],
      ),
      list(
        'Check required and extra threads.',
        'Weave required threads.',
        'Cast against Casting Difficulty.',
        'Apply Success Levels and Effect tests.',
      ),
      table(
        ['Discipline Circle', 'Extra-thread limit'],
        [
          ['1–4', '1'],
          ['5–8', '2'],
          ['9–12', '3'],
          ['13–15', '4'],
        ],
      ),
      warning(
        'The caster needs the spell Discipline’s Thread Weaving Talent. Extra-thread limits do not replace required threads.',
      ),
      note('Citation: Earthdawn Fourth Edition Player’s Guide, pp. 248, 256.'),
    ],
    ['matrix', 'grimoire', 'raw magic'],
  ),
  rule(
    'basic',
    6,
    'Thread Items',
    'Discover knowledge, complete deeds, invest LP, and weave the item thread.',
    [
      list(
        'Discover Key Knowledge.',
        'Complete the required deed or condition.',
        'Invest LP for the desired Thread Rank.',
        'Test Thread Weaving.',
        'Apply only unlocked benefits.',
      ),
      note(
        'Record the item Name, current Rank, benefits, next knowledge, next deed, and LP cost. Item threads differ from temporary spell threads.',
      ),
    ],
    ['key knowledge', 'deed'],
  ),
  rule(
    'basic',
    7,
    'Healing Aids',
    'Healing equipment modifies Recovery, Wounds, poison, disease, or death.',
    [
      table(
        ['Aid', 'Cost', 'Quick effect'],
        [
          ['Booster Potion', '50 sp', '+8 next Recovery within 24 hours'],
          ['Healing Potion', '300 sp', 'Heal one Wound; improve next Recovery'],
          ['Last Chance Salve', '600 sp', 'May return a character to life'],
          [
            'Salve of Closure',
            '200 sp',
            'Heal one Wound; costs a Recovery Test',
          ],
          [
            'Healing Kit',
            'Equipment list',
            'Ten minutes; +1 next Recovery; three uses',
          ],
        ],
      ),
      warning(
        'A bonus does not grant a Recovery Test or remove timing restrictions. Last Chance Salve must reduce damage below Death Rating.',
      ),
    ],
    ['potion', 'salve'],
  ),
  rule(
    'basic',
    8,
    'Alchemy and Custom Enchanting',
    'Use published enchanting-pattern and recipe rules rather than universal shortcuts.',
    [
      list(
        'Learn a pattern of a Rank no higher than Alchemy Rank.',
        'Acquire ingredients.',
        'Brew for one day and test Alchemy against EDN.',
        'Success produces a dose; extra requested doses increase EDN.',
      ),
      table(
        ['Pattern', 'Rank', 'EDN', 'Materials'],
        [
          ['Booster Potion', '1', '7', '25 sp'],
          ['Healing Potion', '6', '12', '150 sp'],
          ['Salve of Closure', '4', '10', '100 sp'],
        ],
      ),
      warning(
        'Custom designs require explicit effect, duration, limits, Rank, EDN, ingredients, cost, and failure outcome approved by the GM.',
      ),
      note(
        'Source note: the supplied reference cites FASA’s published alchemy preview and directs readers to the published Companion for final rules.',
      ),
    ],
    ['alchemy', 'enchanting'],
  ),
  rule(
    'basic',
    9,
    'Blood Charms',
    'Blood charms commit Blood Magic Damage and use individual activation rules.',
    [
      table(
        ['Charm', 'Blood Magic', 'Effect'],
        [
          ['Absorb Blow', '2', 'Absorbs damage; consumed'],
          ['Death Cheat', '3', 'Recovery chance on death'],
          ['Desperate Blow', '3', '+6 Attack or Damage'],
          ['Desperate Spell', '3', '+6 Spellcasting or Effect'],
        ],
      ),
      note(
        'Initial attachment takes one day. Recharge a reusable charm by healing and recommitting its damage.',
      ),
      note('Citation: Earthdawn Fourth Edition Player’s Guide, p. 415.'),
      warning(
        'Crystal Skin and Last Grasp statistics remain unavailable until a Fourth Edition source and page are verified.',
      ),
    ],
    ['blood charm'],
  ),
  rule(
    'basic',
    10,
    'Keep Play Moving',
    'Use compact records and explicit tracking to reduce lookup time.',
    [
      list(
        'Keep common Talent statistics together.',
        'Keep spell threads, difficulties, range, Effect, duration, Success Levels, and Extra Threads together.',
        'Track Damage, Wounds, Karma, Recovery, and Blood Magic separately.',
        'Record temporary-effect expiration.',
        'Prepare spells and healing equipment before risky encounters.',
        'Label temporary GM rulings.',
      ),
      note('These are organizational suggestions, not additional rules.'),
    ],
    ['rules reminder'],
  ),
] as const;
