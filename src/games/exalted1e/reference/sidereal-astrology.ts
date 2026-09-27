import { z } from 'zod';
import { siderealAbilityGroups } from '../definitions';
import type { ExaltedAbilityId } from '../definitions';

/**
 * Sidereal Astrology (Exalted: The Sidereals, Chapter Six) reference
 * catalog: the five astrological Houses, their 25 named Colleges (one per
 * Auspicious Ability, matching each House's Caste one-for-one), each
 * College's ~3 named Resplendent Effects, the five capstone Greater Signs,
 * and the eight generic Blessing/Curse effect types.
 *
 * This is browsable reference data, not a purchasable power catalog --
 * unlike Charms, Resplendent Effects are gated by initiation (see the
 * character's `familyState.colleges` rating) and by having assumed the
 * matching Resplendent Destiny (`familyState.destinies`), not by spending
 * experience, and this app has no dice-rolling engine anywhere to
 * automate the underlying Effect Roll/Scope/Duration/Power math (see
 * `sidereal-astrology-rules.json`, this catalog's promoted procedural-
 * rules counterpart, for that reference text). `SiderealAstrologyPanel.tsx`
 * renders all of this for the player/Storyteller to consult by hand,
 * matching how every other Exalted 1e family's reference/procedural
 * content (Sorcery's Scope/Duration tables, combat's stunt rules, etc.)
 * stays unautomated in this character-sheet application.
 *
 * Every College's name matches one of its House's Caste's five Auspicious
 * Abilities (verified against `siderealAbilityGroups` in `definitions.ts`,
 * itself derived from the promoted Charm catalog) -- confirmed directly
 * against the source text's own repeated cross-references rather than
 * assumed.
 */

const houseIds = [
  'journeys',
  'serenity',
  'battles',
  'secrets',
  'endings',
] as const;
export type SiderealHouseId = (typeof houseIds)[number];

const houseSchema = z.object({
  id: z.enum(houseIds),
  name: z.string().min(1),
  maiden: z.string().min(1),
  greaterSignName: z.string().min(1),
});

const rawHouses: readonly z.infer<typeof houseSchema>[] = [
  {
    id: 'journeys',
    name: 'The House of Journeys',
    maiden: 'Mercury',
    greaterSignName: 'Greater Sign of Mercury (Sign of Travel)',
  },
  {
    id: 'serenity',
    name: 'The House of Leisure',
    maiden: 'Venus',
    greaterSignName: 'Greater Sign of Venus (Sign of Serenity)',
  },
  {
    id: 'battles',
    name: 'The House of War',
    maiden: 'Mars',
    greaterSignName: 'Greater Sign of Mars (Sign of War)',
  },
  {
    id: 'secrets',
    name: 'The House of Secrets',
    maiden: 'Jupiter',
    greaterSignName: 'Greater Sign of Jupiter (Sign of Secrets)',
  },
  {
    id: 'endings',
    name: 'The House of Endings',
    maiden: 'Saturn',
    greaterSignName: 'Greater Sign of Saturn (Sign of Endings)',
  },
];

export const siderealAstrologyHouses = z
  .array(houseSchema)
  .length(5)
  .parse(rawHouses);

const collegeSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  houseId: z.enum(houseIds),
  name: z.string().min(1),
  abilityId: z.string().min(1),
  ascending: z.string().min(1),
  descending: z.string().min(1),
  trappings: z.string().min(1),
  correlations: z.string().min(1),
});

type CollegeSeed = z.infer<typeof collegeSchema>;

function college(
  houseId: SiderealHouseId,
  slug: string,
  name: string,
  abilityId: ExaltedAbilityId,
  ascending: string,
  descending: string,
  trappings: string,
  correlations: string,
): CollegeSeed {
  return {
    id: `${houseId}-${slug}`,
    houseId,
    name,
    abilityId,
    ascending,
    descending,
    trappings,
    correlations,
  };
}

const rawColleges: readonly CollegeSeed[] = [
  // The House of Journeys (Mercury) -- Sail/Thrown/Endurance/Ride/Survival
  college(
    'journeys',
    'the-captain',
    'The Captain',
    'sail',
    'Strength, determination and orderliness.',
    'Obsessive authority, paranoia of power, navel-gazing worship of organization.',
    'Wears an emblem of rank and carries a token of authority; fearless and untiring; not kind, but always fair.',
    'Military command, fatherhood, tyranny, crystals, bureaucracy, discipline.',
  ),
  college(
    'journeys',
    'the-gull',
    'The Gull',
    'thrown',
    'The wisdom of the outside perspective, the freedom of the wind-blown wanderer.',
    'Rootlessness, thoughtless irresponsibility, shallow self-examination.',
    'Carries a staff and wears a traveler\u2019s cape; dirty and hungry but happy.',
    'Wandering, wind, fish and birds, irresponsibility, rakish charisma, the unexamined life.',
  ),
  college(
    'journeys',
    'the-mast',
    'The Mast',
    'endurance',
    'Heroic exertion providing the main strength for a task.',
    'Strength without thought, unwillingness to question orders, stolid inability to communicate.',
    'Drably dressed and unspeaking; strong and honest but ignorant.',
    'Stoicism, tools, insects, architecture, manual labor, silence.',
  ),
  college(
    'journeys',
    'the-messenger',
    'The Messenger',
    'ride',
    'Good, professional, brave service.',
    'Service turned to bad ends, thoughtless abuse of power, abdication of moral responsibility.',
    'Has a mount and is on urgent business; daring and armed; carries an inseparable package.',
    'Duty, raptors, bravery, arrogance, journeys, communication, selflessness, news.',
  ),
  college(
    'journeys',
    'the-ships-wheel',
    "The Ship's Wheel",
    'survival',
    'The success of perseverance.',
    'Quixotic obsession and clinging to doomed causes.',
    'Sleepless and unwashed, wearing a long cape or jacket and wristlets/rope-belt; determined, shares the burden of the post with no one.',
    'Underdogs, cult beliefs, obsessive love, martyrdom, burdensome debt, wild animals as a group.',
  ),
  // The House of Leisure (Venus) -- Dodge/Socialize/Performance/Craft/Linguistics
  college(
    'serenity',
    'the-ewer',
    'The Ewer',
    'dodge',
    'Enduring adoration, flirtation, seduction, coquettish banter.',
    'The devouring mistrust of thoughtless, obsessive or impossible love.',
    'Bears flowers and a work of poetry; blissfully happy and in love with love.',
    'Love, motherhood, righteousness, idealism, monastic duty, seduction, dreams and fantasy.',
  ),
  college(
    'serenity',
    'the-lovers',
    'The Lovers',
    'socialize',
    'Relationships symbolically or situationally uneven, like a sex act.',
    'Sexual depravity and the rape or capture of the helpless or entrapped.',
    'Dressed in silk robes with rumpled hair; superficially friendly and attractive but betraying restraint or violence.',
    'Service, submission, slaves, vermin, Ravagers, lust, the sex act, rape, abuse.',
  ),
  college(
    'serenity',
    'the-musician',
    'The Musician',
    'performance',
    'Joy-in-plenty and enjoyment of the finer things.',
    'Hollow avarice, blind materialism, scandalous excess.',
    'Wears facial makeup, dresses outlandishly, always carries a musical instrument; cynically wise and uninhibited.',
    'Excess, laughter, hedonism, music, drug use, finery, greed, theater.',
  ),
  college(
    'serenity',
    'the-peacock',
    'The Peacock',
    'craft',
    'Practical alliance, thoughtful breeding, considered partnerships.',
    'Loveless marriages, forced alliances, half-functional partnerships.',
    'Struts magnificent finery; proud, has excellent taste, obviously sexually available.',
    'Greed, love for wealth\u2019s sake, procreation, dualities, alliances, bright colors, necessity, traps, distraction.',
  ),
  college(
    'serenity',
    'the-pillar',
    'The Pillar',
    'linguistics',
    'Partnerships tested and found stable.',
    'Bad parenting, and partnerships/authority tested and found wanting.',
    'Wears a wedding ring and dresses plainly; perceptive and practical; firm but just.',
    'Family, friendship, stability, civil society, unjust authority, stagnation, queens and princes.',
  ),
  // The House of War (Mars) -- Presence/Brawl/Archery/Resistance/Melee
  college(
    'battles',
    'the-banner',
    'The Banner',
    'presence',
    'Fame, glory, heroic reputation and leadership.',
    'Terror as a weapon, panic of rumor, infamy, uninspiring leadership, living on reputation.',
    'Strikingly clad and always among you; fearless, victorious and larger than life.',
    'Reputation, pageantry, leadership, epics, infamy, reigns of terror, philanthropy, heraldry.',
  ),
  college(
    'battles',
    'the-gauntlet',
    'The Gauntlet',
    'brawl',
    'The courage to undertake unpleasant necessities.',
    'Callousness, ruthlessness, justifying the whims of the moment as necessity.',
    'Bloodstained and brutal; wears a uniform and carries a cudgel; makes and enforces meaningless demands.',
    'Sergeants, confrontation, callousness, sacrifice of others, necessity, pragmatism, surgery, the greater good.',
  ),
  college(
    'battles',
    'the-quiver',
    'The Quiver',
    'archery',
    'Quick-wittedness and versatility.',
    'Stupidity explained convincingly, thinking in lockstep with one\u2019s peers.',
    'Carries a bow or map case; clever and witty; values education over valor.',
    'Strategy, choices, haste, pride, archery, boorishness, self-absorption.',
  ),
  college(
    'battles',
    'the-shield',
    'The Shield',
    'resistance',
    'Courage and heroism without regard for consequences.',
    'Sadism, masochism, suicidal bravery, battle literally without thought.',
    'Always carries a shield and a biting-strap; always armed and eager for battle; carries trophies of kills.',
    'Barbarians, fearlessness, protection, bragging, pain, heroism, heroic suicide, wrath, Lunars.',
  ),
  college(
    'battles',
    'the-spear',
    'The Spear',
    'melee',
    'Skill, professionalism and discipline.',
    'Superficial professionalism, professional myopia, inability to see solutions outside one\u2019s own scope.',
    'Wears a uniform but possesses no rank; called by family name or nickname; disciplined and brave.',
    'Soldiers, bodyguards, bravery, professionalism, training, taking initiative, tactics, skillfulness, competition.',
  ),
  // The House of Secrets (Jupiter) -- Larceny/Investigation/Stealth/Occult/Lore
  college(
    'secrets',
    'the-guardians',
    'The Guardians',
    'larceny',
    'A fundamental understanding of the nature of Creation from long observation or inbred wisdom.',
    'Quackery and meaningless superstition.',
    'Uneducated and carries a talisman; suspicious, knows the weather, has aiding wisdom.',
    'Hearth wisdom, respect for the elderly, age, superstition, charlatans, tradition, patience, observation, inevitability.',
  ),
  college(
    'secrets',
    'the-key',
    'The Key',
    'investigation',
    'Experimentation, inquiry, sharp thinking and new solutions.',
    'Pointless or wasteful experiments, tinkering with things best left undisturbed, sharp practice.',
    'Carries a measuring stick and a pen, but no notebook; claims innocence but has a dishonest expression.',
    'Innovation, hubris, corruption, automata and mechanical devices, books, libraries, medicine, curiosity.',
  ),
  college(
    'secrets',
    'the-mask',
    'The Mask',
    'stealth',
    'Religious mystery, rites of passage, the secrets of the bed.',
    'Humbug, deliberate obfuscation, the mountebank.',
    'Wears a mask over the face and clothes of soft fabric; quiet, clings to sacred places and lingers around Manses.',
    'Secrets, lies, security services, guarded individuals, religious worship, extortion, trickery.',
  ),
  college(
    'secrets',
    'the-sorcerer',
    'The Sorcerer',
    'occult',
    'Artifice, sorcery and geomancy.',
    'The black arts of demon summoning and necromancy.',
    'Displays goods of the Five Magical Materials, a Caste Mark, and a regal bearing; wears armor and carries a daiklave.',
    'Humanity, geomancy, artifice, demon summoning and infernalism, talismans, Essence use, egotism.',
  ),
  college(
    'secrets',
    'the-treasure-trove',
    'The Treasure Trove',
    'lore',
    'Erudition, education and enlightenment.',
    'Intellectual elitism, pointless cerebration, the bookworm and the know-it-all.',
    'Carries a book of wisdom and wears scholar\u2019s robes; poor in money but educated; impractical but well-meaning.',
    'Horoscopes, schools, scholarship, savants, blight, blindness, inflexibility, secret societies, prophecies.',
  ),
  // The House of Endings (Saturn) -- Medicine/Awareness/Bureaucracy/Athletics/Martial Arts
  college(
    'endings',
    'the-corpse',
    'The Corpse',
    'medicine',
    'Existences end with planning, dignity and grace.',
    'Existences end with agony and wailing.',
    'Wears his best clothes; calm, bears the emblem of a butterfly, carries a textbook; unshod.',
    'Quick and painless deaths, exits, sudden change, transformation, unfinished business, shapechangers, thresholds.',
  ),
  college(
    'endings',
    'the-crow',
    'The Crow',
    'awareness',
    'Comfort in death, morbid humor, the heroism of the forlorn hope.',
    'A rush to death disguised as acceptance, false bravado, indifference to others\u2019 suffering.',
    'Carries black feathers and wears a black cloak; morbidly humorous and clever, attracted to shiny objects.',
    'Slow and painless deaths, inevitability, ancestors, widows and orphans, acceptance of death, dark humor, indifference.',
  ),
  college(
    'endings',
    'the-haywain',
    'The Haywain',
    'bureaucracy',
    'Ruin gives way to new growth.',
    'Leads to placid stasis and bucolic decay.',
    'Wears dishevelled robes and an informal attitude; hard of hearing but demands bribes; arrogant and ambitious.',
    'Muddled deaths, mystery, cover-ups, treachery, comebacks, aging and decrepitude.',
  ),
  college(
    'endings',
    'the-rising-smoke',
    'The Rising Smoke',
    'athletics',
    'Paths end in transformation to a new state.',
    'Bootless errands and death by accident, heart attack, stroke or murder.',
    'Carries good-luck prayer strips, a purse of money from her teacher, and brand-new journeyman\u2019s equipment; optimistic and naive.',
    'Quick and painful deaths, rest, stagnation, growth, chance, new employment, fresh prospects, murder.',
  ),
  college(
    'endings',
    'the-sword',
    'The Sword',
    'martialArts',
    'Continuing on without a fulfilled hope\u2019s assistance once it is realized.',
    'Hopes and dreams wither and die; the broken, crushed and worn down.',
    'Is worn out; carries or wears a withered flower, dresses in burial cerements; weeps but cannot be consoled; unshod.',
    'Slow and painful deaths, perseverance, failure, illness, tribulation, inheritance, resignation, the vanquished.',
  ),
];

export const siderealAstrologyColleges = z
  .array(collegeSchema)
  .length(25)
  .parse(rawColleges);

const collegeIdSet = new Set(siderealAstrologyColleges.map(({ id }) => id));
export const siderealAstrologyCollegeIds = Array.from(collegeIdSet) as [
  string,
  ...string[],
];

const resplendentEffectSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  collegeId: z.string().min(1),
  name: z.string().min(1),
  cost: z.string().min(1),
  description: z.string().min(1),
});

type ResplendentEffectSeed = z.infer<typeof resplendentEffectSchema>;

function slugify(name: string) {
  return name
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function effects(
  collegeId: string,
  entries: readonly [name: string, cost: string, description: string][],
): ResplendentEffectSeed[] {
  return entries.map(([name, cost, description]) => ({
    id: `${collegeId}-${slugify(name)}`,
    collegeId,
    name,
    cost,
    description,
  }));
}

const rawResplendentEffects: readonly ResplendentEffectSeed[] = [
  ...effects('journeys-the-captain', [
    [
      'Ship-Commanding Attitude',
      '1 effect point/week',
      'Radiates intimidating charisma; adds Essence to Presence rolls to command and control a crew so long as the character rules absolutely.',
    ],
    [
      'Choosing for Fangs',
      '1 effect point/month',
      'Naturally chooses fearsome, hardworking subordinates; suffers no complaints from underlings of lower Valor than the Sidereal\u2019s Charisma, but cannot intimidate a subordinate who wants to quit into staying.',
    ],
    [
      'Iron Drill Exercise',
      '1 effect point/week',
      'Through personal example, teaches followers a task: each week of drill grants 1 dot in an Ability (capped at the Sidereal\u2019s own rating); can train up to (College rating x 10) individuals, none learning more points from her than her Conviction.',
    ],
  ]),
  ...effects('journeys-the-gull', [
    [
      'Honest Face Spirit',
      '1 effect point/week',
      'When evaluated for a menial job or insignificant responsibility, the character is found trustworthy regardless of her actual intentions.',
    ],
    [
      'Good Worker Spirit',
      '1 effect point/month',
      'Never accused of slacking no matter how little honest work she actually does.',
    ],
    [
      'Joyous Grasshopper Spirit',
      '1 effect point/season (3 for the season of Water)',
      'Grants the Bon Vivant Nature alongside her own, and each day on waking may lower the target number of Conviction rolls to regain Willpower by 1.',
    ],
  ]),
  ...effects('journeys-the-mast', [
    [
      'Strength of the Mast',
      '3 effect points, 1 Paradox die',
      'So long as she is the strongest person present (and not alone), her Strength is equal to any task; Strength + Athletics x 10 determines how much she can lift.',
    ],
    [
      'Structure of the Mast',
      '1 effect point',
      'May add three dice to a roll so long as she is only passively supporting the task rather than actively assisting or performing a specialist\u2019s job.',
    ],
    [
      'Invisible at the Center',
      '1 effect point, 1 Paradox die/week',
      'Can find menial, subsistence-level work within hours anywhere populated; while remaining a silent, unquestioning laborer, she avoids legal/bureaucratic/official scrutiny (pursuers must beat her Stamina + Athletics roll, Essence as automatic successes) but lives in virtual servitude with only 7 free hours per week.',
    ],
  ]),
  ...effects('journeys-the-messenger', [
    [
      'Iron Heart, Iron Horse',
      '1 effect point/month',
      'While carrying a message, neither the Sidereal nor her familiar/mount ever fails a Valor roll that would delay the message or lengthen the route.',
    ],
    [
      'Blow Wind Blow Style',
      '1 effect point/week',
      'The Sidereal and her mount make all Fatigue checks unmodified by weather, and wake well-rested regardless of poor sleeping conditions.',
    ],
    [
      'Field Mouse Rider',
      '1 effect point, 3 Paradox dice/day',
      'May cause any familiar to bear and carry her no matter how unsuitable a mount it is, with only minor temporary fatigue as consequence.',
    ],
  ]),
  ...effects('journeys-the-ships-wheel', [
    [
      'Stronger Than This Job',
      '1 effect point',
      'So long as she has a job to do, Fatigue penalties become bonus dice (never dropping her pool below 0); once done, she takes unsoakable bashing damage equal to the Fatigue penalties absorbed.',
    ],
    [
      'Marshaling Infinite Strength',
      '1 effect point',
      'If able to perform a task when begun, she can finish it regardless of later fatigue, injury or condition; bodies/ghosts of those who die of natural causes keep performing the task until relieved.',
    ],
    [
      'Poetic Sacrifice Insurance',
      '2 effect points, 1 Paradox die',
      'May roll again for a Sail or Survival roll to travel in inclement weather and add both rolls\u2019 successes together; excess successes must be spent traveling farther than intended.',
    ],
  ]),
  ...effects('serenity-the-ewer', [
    [
      'Sweet Flirtation Smile',
      '1 effect point',
      'May add the character\u2019s Charisma to any Bureaucracy, Socialize or Presence roll.',
    ],
    [
      'Snappy Banter Approach',
      '1 effect point',
      'If the character\u2019s Wits is equal to or higher than the target\u2019s, may reroll a failed social roll so the target does not fall under the Sidereal\u2019s sway.',
    ],
    [
      'Frenzied Courtship Dodge',
      '1 effect point, 1 Paradox die/week',
      'Draws the character into an all-consuming (if never-concluding) courtship or marriage negotiation within a day of arriving anywhere populated; so long as he lives only for his beloved he avoids legal/official scrutiny (pursuers must beat his Wits + Athletics roll, Essence as automatic successes; only 7 free hours per week).',
    ],
  ]),
  ...effects('serenity-the-lovers', [
    [
      'Handsome Boy Eyes',
      '1 effect point',
      'Can attempt a seduction roll on a target without looking at or speaking to them, merely seeing them from across a room.',
    ],
    [
      'Celestial Bliss Trick',
      '1 effect point/performance',
      'A simple trick bringing total sexual ecstasy within three minutes; the target must succeed at a difficulty-1 Willpower and Temperance roll or fall under the Sidereal\u2019s sway.',
    ],
    [
      'Whore-and-Virgin Stance',
      '1 effect point, 1 Paradox die/week',
      'Becomes a worshiped god or possessed object, a kept courtesan or pimped prostitute within a day of arriving anywhere populated; so long as she lives an empty life of sex and submission she avoids legal/official scrutiny (pursuers must beat her Manipulation + Presence roll, Essence as automatic successes; only 7 free hours per week).',
    ],
  ]),
  ...effects('serenity-the-musician', [
    [
      'Strange Days',
      '1 effect point',
      'May force anyone presented with a source of gratification or intoxication to make a Temperance roll or succumb, even against their normal inclination.',
    ],
    [
      'Impossible-to-Remember Party Approach',
      '1 effect point/night',
      'While performing (holding court, conversing, or performing music/dance), the difficulty of everyone nearby\u2019s Temperance rolls increases by 1.',
    ],
    [
      'Brigand-and-Carouser Attracting Style',
      '1 effect point/week, 1 Paradox die',
      'By spending a night out, attaches the character to a family or friendship group of marginal personalities who accept him as one of their own by day\u2019s end; so long as he lives large with this troupe he avoids legal/official scrutiny (pursuers must beat his Stamina + Presence roll, Essence as automatic successes; only 7 free hours per week).',
    ],
  ]),
  ...effects('serenity-the-peacock', [
    [
      'Proper Plumage',
      '1 effect point, 1 Paradox die',
      'Given access to a large closet, second-hand clothing store, or pile of cloth scraps, can always look good enough for +1 to Appearance-based rolls at any social event regardless of setting or attire norms.',
    ],
    [
      'Spouse-Saving Grace',
      '1 effect point',
      'Whenever present with his/her mate and the mate fails a Bureaucracy or Socialize roll, may spend a point of Conviction or Temperance to have his/her own player make the roll instead.',
    ],
    [
      'Wife-Procuring Tailfeathers',
      '1 effect point, 1 Paradox die/week',
      'Finds himself married and managing a large, prosperous household within a week of arriving anywhere populated; so long as he lives as full-time family manager he avoids legal/official scrutiny (pursuers must beat his Charisma + Bureaucracy roll, Essence as automatic successes; only 7 free hours per week).',
    ],
  ]),
  ...effects('serenity-the-pillar', [
    [
      'Comforting Matriarch Embrace',
      '1 effect point',
      'May hold and comfort another person before putting him to sleep; on waking, his player may roll the character\u2019s Conviction twice to regain Willpower.',
    ],
    [
      'Equitable Partnership',
      '1 effect point, 1 Paradox die',
      'Can find a monetary backer well-matched to a business plan\u2019s plausible merit; cannot be used to swindle anyone.',
    ],
    [
      'Best Friend\u2019s Couch',
      '1 effect point, 1 Paradox die/week',
      'By approaching the nearest habitation where she speaks the language, presents herself as a long-lost friend and is fed and housed as well as anyone in the house (though she must move on every few days); so long as she stays with these newfound friends she avoids legal/official scrutiny (pursuers must beat her Charisma + Presence roll, Essence as automatic successes; only 7 free hours per week).',
    ],
  ]),
  ...effects('battles-the-banner', [
    [
      'Heroic General Presence',
      '2 effect points/scene',
      'Exhibited at the forefront of battle, reduces the difficulty of all Valor checks for those under his direct command to 1.',
    ],
    [
      'Battle-Fellow Attitude',
      '1 effect point/month',
      'Can call up any soldier who ever fought for him by publicly posting a call to arms; each week the effect is active, every such soldier must make a difficulty-2 Willpower roll or come serve beneath his banner again.',
    ],
    [
      'Tide of History',
      '3 effect points, 1 Paradox die/month',
      'Troops marching beneath his banner fight without fear or hesitation as if endorsed by history itself, never failing difficulty-1 Valor checks or suffering wound/fatigue penalties (though they can still be worked or marched to death).',
    ],
  ]),
  ...effects('battles-the-gauntlet', [
    [
      'Weak-Spine Sense',
      '1 effect point/week',
      'Instantly knows who among people facing her is intimidated by or frightened of her, and to what degree.',
    ],
    [
      'Knuckle-Cracking Stance',
      '1 effect point',
      'May add her Essence to an intimidation attempt, though the target perceives her as relying on physical Attributes.',
    ],
    [
      'Thug Fist',
      '2 effect points, 1 Paradox die',
      'Activated reflexively before an attack roll: if her next unarmed attack does damage, the target permanently loses 1 Appearance to disfigurement.',
    ],
  ]),
  ...effects('battles-the-quiver', [
    [
      'Apologetic Feint',
      '1 effect point',
      'Can rephrase a demand to look like an acceptable compromise; on a roll involving a Social Attribute, may reflexively add a number of dice equal to that Attribute even after dice are already counted.',
    ],
    [
      'Instant Genius Style',
      '1 effect point',
      'May make any Intelligence + Lore, Occult, or Bureaucracy roll that would normally require long research time immediately -- she simply knows the answer.',
    ],
    [
      'Several Arrows of Reason',
      '1 effect point per three arrows, 1 Paradox die',
      'Arms the character with arrows of reason that ignore gossamer armor and cause any creature outside fate they strike and damage to become part of fate until scene\u2019s end; the arrows dissipate at scene\u2019s end.',
    ],
  ]),
  ...effects('battles-the-shield', [
    [
      'Wounded Lion Strength',
      '2 effect points',
      'May add dice to a single attack\u2019s damage equal to her currently suffered health levels of damage, added before armor.',
    ],
    [
      'Hero\u2019s Iron Skin',
      '3 effect points/scene',
      'So long as wearing no armor, has the effect of +9L/+9B armor, treated as natural soak against armor-penetrating effects.',
    ],
    [
      'Aspect of the Bear',
      '2 effect points, 1 Paradox die/scene',
      'Transforms the character\u2019s anima banner into the shape of a great bear; onlookers must make a difficulty-1 Valor roll to face her, and she cannot fail Valor rolls or suffer Valor penalties while so transformed.',
    ],
  ]),
  ...effects('battles-the-spear', [
    [
      'Someone\u2019s Son Style',
      '1 effect point, 1 Paradox die/lunar month',
      'Common folk aid and feed him without question or revealing his location to enemies, so long as he makes no political pretensions, protects them, and avoids drawing war to them; so long as he keeps this compact he avoids legal/official scrutiny (pursuers must beat his Stamina + Presence roll, Essence as automatic successes; only 7 free hours per week).',
    ],
    [
      'Hero-Supporting Performance',
      '1 effect point/scene',
      'If anyone in his unit can do something, so can he -- for the scene, he may accept the unit\u2019s highest Athletics success total, and likewise use the strongest helper\u2019s Strength + Athletics total to lift.',
    ],
    [
      'Battle-Carrying Presence',
      '1 effect point/scene',
      'No one fighting under his direct command can fail a Valor check unless they (or he) suffer a wound or Fatigue penalty higher than his own.',
    ],
  ]),
  ...effects('secrets-the-guardians', [
    [
      'Lazy Works Smart Style',
      '1 effect point',
      '-2 difficulty to any Athletics roll for physical labor, but only if the extra successes shorten the task\u2019s duration.',
    ],
    [
      'Hayseed Eye',
      '1 effect point/week',
      'Can detect whether someone interacting with her plans to take advantage of the Sidereal -- not a danger sense, but a read on hostile intent.',
    ],
    [
      'Talisman-Making Touch',
      '1 effect point, 1 Paradox die',
      'Creates a talisman of some type from a personal possession or blessed object; it cannot be kept and must be given to one in need.',
    ],
  ]),
  ...effects('secrets-the-key', [
    [
      'Never Cease Moving',
      '1 effect point/week',
      'So long as preparing for a Lore or Bureaucracy roll, needs only sleep an hour a day and can live on Essence alone.',
    ],
    [
      'Ascending Destiny Mien',
      '1 effect point, 1 Paradox die/week',
      'May lower difficulty by 1 when interacting with anyone whose Temperance is lower than the Exalt\u2019s Intelligence.',
    ],
    [
      'Provable Location of the Gate',
      '1 effect point, 3 Paradox dice',
      'Proves through measurements and mathematics that the Calibration Gate is present right at his current location, and so it is (possibly delayed if the gate is truly elsewhere).',
    ],
  ]),
  ...effects('secrets-the-mask', [
    [
      'Privacy-Enhancing Gesture',
      '1 effect point',
      'The area within (Essence x 10) yards becomes proof against supernatural scrying, teleportation and other intrusion, including Everywhere and Nowhere Technique.',
    ],
    [
      'Foot Treads No Twig',
      '1 effect point, 1 Paradox die',
      'May reroll a single Dexterity + Stealth roll before it is compared to an enemy\u2019s roll.',
    ],
    [
      'Everywhere and Nowhere Technique',
      '1 effect point, 3 Paradox dice/week',
      'Conceals herself in the most unlikely places, eating and sleeping unseen; so long as she persists in this furtive existence she avoids legal/official scrutiny (pursuers must beat her Intelligence + Occult roll, College + Essence as automatic successes; only 7 free hours per week to spy within Essence miles of unshielded places).',
    ],
  ]),
  ...effects('secrets-the-sorcerer', [
    [
      'Invincible Essence Core',
      '1 effect point',
      'If targeted by a hostile effect that would lower permanent Essence, cause memory loss, or block access to spells/Charms/Combos/Abilities, may reflexively spend 1 effect point to block it.',
    ],
    [
      'Prince of the Earth',
      '1 effect point/scene',
      '+3 to all social rolls with the unExalted so long as acting the part of an Exalt, without implying superiority; may have many peers but no superiors.',
    ],
    [
      'Seer',
      'X effect points',
      'When taking part in astrology alongside another Sidereal to determine or plan the future, may spend any number of effect points to give that Sidereal\u2019s attempt bonus dice.',
    ],
  ]),
  ...effects('secrets-the-treasure-trove', [
    [
      'Stab the Seer\u2019s Eye',
      '1 effect point/season',
      'Instantly aware of any mortal astrological inquiry about her, and can make it produce any reading she pleases.',
    ],
    [
      'Dismissive Scholar\u2019s Sniff',
      '1 effect point',
      'May always appeal to an authority yet unread, adding her Essence to a Lore or Bureaucracy roll made in argument with someone whose Lore or Bureaucracy is no higher than her own.',
    ],
    [
      'Professorial Mien',
      '1 effect point/month',
      'Others treat her as cultured and educated, turning to her to resolve disputes and problems; may add her Essence to Presence or Socialize rolls, but only when her Lore exceeds the target\u2019s Intelligence.',
    ],
  ]),
  ...effects('endings-the-corpse', [
    [
      'Dignity of the Dead',
      '1 effect point',
      'May ignore the effect of one lost Social roll with no ill effects.',
    ],
    [
      'Shadow of the Reaper',
      '3 effect points, 1 Paradox die',
      'By making the Superior Sign of the Corpse, fills the target with intimations of mortality, causing loss of all temporary Willpower in excess of her permanent Conviction.',
    ],
    [
      'Rising Butterfly Prayer',
      '3 effect points, 3 Paradox dice',
      'By reciting a homily and burning a silk memorial to Lytek (with a copy to Taru-Han) at a formal funeral, can request due consideration by the Division of Abstract Matters for a soul\u2019s reincarnation into a body chosen for Terrestrial Exaltation.',
    ],
  ]),
  ...effects('endings-the-crow', [
    [
      'Reading Dead Eyes',
      '1 effect point',
      'By eating a corpse\u2019s eye, learns the last thing the corpse saw before dying, and whether the target is a ghost or hungry ghost.',
    ],
    [
      'Bold Filcher',
      '1 effect point, 1 Paradox die',
      'Can take something from plain sight; witnesses must win an opposed Perception + Awareness roll against her Dexterity + Larceny to notice.',
    ],
    [
      'Feathered Cloak Trick',
      '3 effect points, 3 Paradox dice/day',
      'Makes the Superior Sign of the Crow and turns into a raven, crow or other corvid with Strength/Stamina 1, her own Dexterity, health levels, Social/Mental traits, and a 0L/1B soak, equipment transforming along with her.',
    ],
  ]),
  ...effects('endings-the-haywain', [
    [
      'Harvest Ripe Wheat, Father Falling Hay',
      '1 effect point',
      'By waiting in a reception area or shop floor, learns how corrupt a business or bureau is as a whole (wholly/mostly/somewhat corrupt to totally honest), or whether a contemplated misdeed will attract official scrutiny.',
    ],
    [
      'Old Fellows Society Luncheon',
      '1 effect point',
      'By approaching any meeting of officials or merchants, gains an important-but-unburdensome government or business position filled with meetings and dinners by day\u2019s end; so long as he immerses himself in this purposeless upward mobility he avoids legal/official scrutiny (pursuers must beat his Wits + Bureaucracy roll, Essence as automatic successes; only 7 free hours per week).',
    ],
    [
      'Celestial Intervention Appeal',
      '1 effect point, 5 Paradox dice',
      'Makes the Superior Sign of the Haywain and summons the most severe available heavenly censor (Bureau of Heaven, not Destiny) to attend to a Celestial legal/security matter -- a serious, politically sensitive admission that the Bureau of Destiny cannot handle it alone.',
    ],
  ]),
  ...effects('endings-the-rising-smoke', [
    [
      'Record-Obtaining Inquiry',
      '1 effect point',
      'May add her Essence to any roll involving Charisma made with a god, judge, or magistrate.',
    ],
    [
      'Superior-Entreating Memorial Style',
      '1 effect point',
      'Burns a letter of fine silk addressed to a fellow Sidereal, which appears discreetly against the recipient\u2019s skin (requiring 6+ successes on Perception + Awareness to notice); the recipient may annotate and return it within three days.',
    ],
    [
      'Chains of Adorjan',
      '3 effect points, 1 or 3 Paradox dice',
      'Makes the Superior Sign of the Rising Smoke and summons Adorjan\u2019s deadly, silent wind to scour a touched target for 13 turns, dealing 1A per success or 4A on a failed difficulty-4 Stamina + Resistance roll each turn.',
    ],
  ]),
  ...effects('endings-the-sword', [
    [
      'Style-Discerning Eye',
      '1 effect point, 1 Paradox die',
      'Reflexively activated when the Exalt clearly observes another activate a Martial Arts Charm she doesn\u2019t know, letting her learn that Charm\u2019s trick without a tutor (still requiring doubled training time, spent experience, and prerequisites); the stolen knowledge fades after a year and a day.',
    ],
    [
      'Minimum Legal Defense Competence',
      '1 effect point',
      'May make a parry or dodge attempt at full dice pool against an attack, but that defense cannot be enhanced by Charms, Virtues, Willpower, or any other effect.',
    ],
    [
      'Tears of the Blade',
      '3 effect points, 1 Paradox die',
      'Making the Superior Sign of the Sword at an individual dooms them: mortals are slain instantly or die horribly within five days (Exalt\u2019s choice), and any Exalted subject dies instantly and irrevocably the next time reduced to Incapacitated (lasting the rest of a Terrestrial Exalt\u2019s life, but only a year and a day for a Celestial); has no effect on beings outside fate, gods, or elementals.',
    ],
  ]),
];

export const siderealResplendentEffects = z
  .array(resplendentEffectSchema)
  .length(75)
  .refine((rows) => rows.every((row) => collegeIdSet.has(row.collegeId)), {
    message: 'Every Resplendent Effect must reference a real College id.',
  })
  .parse(rawResplendentEffects);

const blessingCurseTypeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['blessing', 'curse']),
  name: z.string().min(1),
  effect: z.string().min(1),
});

const rawBlessingCurseTypes: readonly z.infer<
  typeof blessingCurseTypeSchema
>[] = [
  {
    id: 'artless-prodigy',
    kind: 'blessing',
    name: 'Artless Prodigy Blessing',
    effect: '-1 to a roll\u2019s target number.',
  },
  {
    id: 'blissful-idiot',
    kind: 'blessing',
    name: 'Blissful Idiot Blessing',
    effect:
      'Regains 1 point of temporary Willpower from accomplishing a task related to the blessing (or +1 success in an opposed test).',
  },
  {
    id: 'hound-chases-rabbit',
    kind: 'blessing',
    name: 'Hound-Chases-Rabbit Blessing',
    effect:
      '+1 die to a roll involving the blessing (or +1 success in an opposed test).',
  },
  {
    id: 'fortified-spirit',
    kind: 'blessing',
    name: 'Fortified Spirit Blessing',
    effect: '+1 to a chosen Virtue for a roll related to the blessing.',
  },
  {
    id: 'sloped-floor',
    kind: 'curse',
    name: 'Sloped Floor Curse',
    effect: '+1 difficulty to a roll involving the curse.',
  },
  {
    id: 'ruin-without-failure',
    kind: 'curse',
    name: 'Ruin Without Failure Curse',
    effect:
      '+1 difficulty to the target\u2019s roll involving the curse (or -1 success in an opposed test).',
  },
  {
    id: 'heart-piercing',
    kind: 'curse',
    name: 'Heart-Piercing Curse',
    effect:
      'Any failure on an Ability roll relating to the curse costs a point of temporary Willpower.',
  },
  {
    id: 'name-destroying',
    kind: 'curse',
    name: 'Name-Destroying Curse',
    effect: '-1 to a chosen Virtue for a roll related to the curse.',
  },
];

export const siderealBlessingCurseTypes = z
  .array(blessingCurseTypeSchema)
  .length(8)
  .parse(rawBlessingCurseTypes);

const greaterSignSchema = z.object({
  id: z.string().min(1),
  houseId: z.enum(houseIds),
  name: z.string().min(1),
  description: z.string().min(1),
});

const rawGreaterSigns: readonly z.infer<typeof greaterSignSchema>[] = [
  {
    id: 'greater-sign-of-mercury',
    houseId: 'journeys',
    name: 'Greater Sign of Mercury (Sign of Travel)',
    description:
      'A brilliant yellow aura; instantly moves the Exalt and up to Essence allies to any location that is part of fate (excluding the Jade Pleasure Dome and the Lotus of Destiny); she must travel with them to guide them.',
  },
  {
    id: 'greater-sign-of-venus',
    houseId: 'serenity',
    name: 'Greater Sign of Venus (Sign of Serenity)',
    description:
      'A brilliant blue aura; instantly and silently snuffs out all Essence effects within a radius of miles equal to the Exalt\u2019s Essence that are not Solar Circle Sorcery or a Celestial Incarna\u2019s own doing.',
  },
  {
    id: 'greater-sign-of-mars',
    houseId: 'battles',
    name: 'Greater Sign of Mars (Sign of War)',
    description:
      'A brilliant ruby aura; for Essence hours, all attacks by allies against foes within a radius of Essence miles deal maximum raw pre-soak damage equal to the attacker\u2019s own Essence.',
  },
  {
    id: 'greater-sign-of-jupiter',
    houseId: 'secrets',
    name: 'Greater Sign of Jupiter (Sign of Secrets)',
    description:
      'A brilliant green aura; for Essence hours, all beings outside of fate within a radius of Essence miles are temporarily made part of the Tapestry as if successfully affected by a Charm.',
  },
  {
    id: 'greater-sign-of-saturn',
    houseId: 'endings',
    name: 'Greater Sign of Saturn (Sign of Endings)',
    description:
      'A brilliant violet aura; for Essence hours, all damage rolls by allies against foes within a radius of Essence miles have their unsoaked/minimum damage dice converted into automatic successes.',
  },
];

export const siderealGreaterSigns = z
  .array(greaterSignSchema)
  .length(5)
  .parse(rawGreaterSigns);

type SiderealCollegeDefinition = (typeof siderealAstrologyColleges)[number];

/** Convenience lookup: house id -> its five College ids, house-ordered. */
export const siderealCollegesByHouse: Record<
  SiderealHouseId,
  readonly SiderealCollegeDefinition[]
> = houseIds.reduce(
  (map, houseId) => {
    map[houseId] = siderealAstrologyColleges.filter(
      (entry) => entry.houseId === houseId,
    );
    return map;
  },
  {} as Record<SiderealHouseId, readonly SiderealCollegeDefinition[]>,
);

/**
 * Every College's House matches the same House id used by
 * `siderealAbilityGroups` in `definitions.ts` -- cross-checked here at
 * module load (not merely commented) so any future edit to either file
 * that breaks the mapping fails immediately and loudly.
 */
for (const house of siderealAstrologyHouses) {
  const abilityGroup = siderealAbilityGroups.find(({ id }) => id === house.id);
  const colleges = siderealCollegesByHouse[house.id];
  if (!abilityGroup || colleges.length !== 5) {
    throw new Error(
      `sidereal-astrology.ts: House "${house.id}" does not resolve to a 5-Ability group.`,
    );
  }
  const abilityIds = new Set(abilityGroup.abilityIds);
  for (const collegeEntry of colleges) {
    if (!abilityIds.has(collegeEntry.abilityId as ExaltedAbilityId)) {
      throw new Error(
        `sidereal-astrology.ts: College "${collegeEntry.id}" Ability "${collegeEntry.abilityId}" is not part of House "${house.id}"'s Auspicious Abilities.`,
      );
    }
  }
}
