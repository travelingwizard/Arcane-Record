import type { EarthdawnDefinition } from './catalog';

const rule = (
  step: number,
  name: string,
  summary: string,
  mechanics: string,
  aliases: string[] = [],
): EarthdawnDefinition => ({
  id: `ed4.players-guide.basic-rule.creation-${step}`,
  kind: 'basic-rule',
  name: `${step}. ${name}`,
  summary,
  mechanics,
  requirements: ['First Circle character creation'],
  aliases,
  sourceId: 'ed4.players-guide',
  source: 'Earthdawn Fourth Edition Player’s Guide',
  page: null,
  verification: 'reference-only',
});

export const earthdawnBasicRules: readonly EarthdawnDefinition[] = [
  rule(
    1,
    'Choose a Discipline',
    'Choose the character’s primary magical path or profession. A starting adept begins at First Circle.',
    'Select a Discipline and record its First Circle talents, talent options, abilities, Karma permissions, and spell access. A non-Adept Questor does not select a Discipline or receive starting Discipline talents or matrices.',
    ['character creation', 'first circle'],
  ),
  rule(
    2,
    'Choose a Race',
    'Choose one of the eight core Namegiver races.',
    'Race supplies starting Dexterity, Strength, Toughness, Perception, Willpower, and Charisma values, plus Movement, Karma modifier, racial abilities, and fixed racial bonuses. Core choices are Dwarf, Elf, Human, Obsidiman, Ork, Troll, T’skrang, and Windling.',
    ['namegiver'],
  ),
  rule(
    3,
    'Generate Attributes',
    'Spend 25 Attribute Points against the selected race’s starting values.',
    'Total costs above the racial value are +1: 1, +2: 2, +3: 3, +4: 5, +5: 7, +6: 9, +7: 12, and +8: 15. Lowering an Attribute by one or two grants the same number of points. Unused points increase Maximum Karma one-for-one. Convert final values to Steps using the Characteristics Table.',
    ['attribute points', 'modifier cost'],
  ),
  rule(
    4,
    'Determine Characteristics',
    'Calculate defenses, health, recovery, Initiative, movement, carrying capacity, and Karma.',
    'Physical Defense derives from Dexterity, Mystic Defense from Perception, and Social Defense from Charisma. Toughness determines Unconsciousness, Death, Wound Threshold, and Recovery Tests. Initiative begins with Dexterity Step and applies armor penalties. Maximum Karma equals racial Karma modifier × applicable Discipline Circle, plus unused creation Attribute Points.',
    ['derived characteristics', 'maximum karma'],
  ),
  rule(
    5,
    'Record Racial Abilities',
    'Record every ability and modifier granted by the selected race.',
    'Examples include Heat Sight, Low-Light Vision, Versatility, natural armor, tail combat, aquatic movement, Flight, and Astral Sight. Apply structured bonuses to the appropriate characteristic and keep descriptive abilities with the character.',
    ['racial talents', 'racial features'],
  ),
  rule(
    6,
    'Assign Talent Ranks',
    'Distribute eight starting Talent Ranks among First Circle Discipline talents.',
    'A starting adept assigns eight ranks, including any selected First Circle Talent Option, with a maximum starting Rank of 3 in one talent. Apply free Discipline abilities. A qualifying first magician Discipline receives two free Standard Matrices; secondary Disciplines do not duplicate that grant.',
    ['talent points', 'standard matrix'],
  ),
  rule(
    7,
    'Choose Spells',
    'Magicians learn starting spells using a budget equal to Perception Step.',
    'First Circle spells cost one creation point and Second Circle spells cost two. The spell must belong to a known spellcasting Discipline. Record its source variant and Discipline-specific Thread Weaving requirement. Matrix capacity is managed separately.',
    ['starting spells', 'perception step'],
  ),
  rule(
    8,
    'Assign Skill Ranks',
    'Take mandatory skill ranks, then distribute eight additional ranks freely.',
    'Assign two Knowledge ranks, one Artisan rank, two Speak Language ranks, and one Read/Write Language rank. Then distribute eight ranks across General, Knowledge, Artisan, or Language skills. No skill may begin above Rank 3. Non-Adept Questors use this same allocation and receive no Discipline talents.',
    ['skills', 'non-adept questor', 'language'],
  ),
  rule(
    9,
    'Equip the Character',
    'Record starting gear, armor, weapons, and 100 silver pieces.',
    'The standard starting equipment includes an adventurer’s kit, artisan tools, dagger, clothing, one week of rations, and a magician’s grimoire when applicable. Equip armor, shields, and weapons, then apply Armor, Defense, Initiative, weight, race-fitting, and size effects.',
    ['starting equipment', '100 silver'],
  ),
  rule(
    10,
    'Finish the Character',
    'Complete the character’s Name, appearance, personality, history, motivations, and goals.',
    'Review every Step and die expression, defenses, health ratings, Movement, Karma, talents, skills, spells, matrices, equipment, and remaining resources. Resolve creation warnings before finalizing the First Circle character.',
    ['background', 'finalize'],
  ),
] as const;
