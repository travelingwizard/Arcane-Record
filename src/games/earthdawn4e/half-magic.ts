/**
 * Character-facing Half-Magic reference text. This is not a stored rating
 * and it does not choose an Attribute or roll a Step.
 */
export const earthdawnHalfMagicRule = [
  'When an adept makes a Half-Magic test, the gamemaster selects the most appropriate Attribute. The Step equals that Discipline’s Circle plus the chosen Attribute Step. Adepts of every Discipline can also use Half-Magic to know the lives, deeds, and history of legendary heroes and past adepts of their own Discipline.',
  'Half-Magic is vocational theory, maintenance, evaluation, and background lore. An Artisan skill is the hands-on act of creative expression and tangible craft. A gamemaster may allow a Half-Magic test before an Artisan or crafting test to recall rare techniques, historical patterns, or material properties. An Extra Success on that Half-Magic test can grant a +2 bonus, or reduce the time required, on the following test. A Perception-based Half-Magic test can also inspect another person’s craftwork for astral decay, Horror marks, or stylistic dissonance that a mundane observer would miss.',
].join('\n\n');

export const earthdawnHalfMagicByName: Record<string, string> = {
  'Air Sailor':
    'Used for knowledge of airship designs, recognizing different types of airships, knowing commonly followed flight paths, and identifying airship crew complements. It also covers the maintenance, repair, and construction of airships.',
  Archer:
    'Used when caring for ranged weapons, and when recognizing different types of ranged weapons, ammunition, or their famous creators.',
  Beastmaster:
    'Used when dealing with or caring for animals beyond the adept’s talents, including animal husbandry and veterinary first aid. Also used to recognize different animals, animal tracks, and abnormal behavior among creatures.',
  Cavalryman:
    'Used for knowledge of the different types of mounts used across the Namegiver races, upkeep and care of riding gear, animal husbandry, veterinary first aid, and knowledge of significant cavalry units throughout Barsaive.',
  Elementalist:
    'Used for knowledge of nature, the five elements, uses of elemental magic, and magical rituals. Elementalists also have an always-active innate sense: a Perception-based Half-Magic test against an elemental spirit’s Mystic Defense detects the presence of elemental spirits within 30 yards.',
  Illusionist:
    'Used to recognize different types of magic use, identify specific applications of illusion magic, and attempt to perceive the truth of a situation.',
  Nethermancer:
    'Used to recognize uses of nethermantic magic, identify different types of undead and spirits, understand magical rituals (especially blood magic), and deduce the effects of various blood charms. Nethermancers also have an always-active innate sense: a Perception-based Half-Magic test against a spirit’s Mystic Defense senses the presence of spirits within 30 yards.',
  Scout:
    'Used to recognize tracks and trails left by animals and Namegivers, identify plants and creatures native to a region, and recall general information about cultures across Barsaive.',
  'Sky Raider':
    'Used for the upkeep, repair, and construction of smaller airships such as the drakkar, knowledge of different airship designs and crew complements, and knowledge of commonly followed flight paths.',
  Swordmaster:
    'Used to care for and maintain weapons, recall the history of legendary weapons, and recognize different types of melee weapons. Also used to identify another combatant’s fighting techniques and recognize which prominent Swordmasters shaped that style.',
  Thief:
    'Used to evaluate, build, or bypass security measures designed to prevent theft, and to recognize different types of locking mechanisms.',
  Troubadour:
    'Used for knowledge of the legends, myths, and folklore of the adept’s home province, and to identify musical instruments and performing-arts traditions from different regions.',
  Warrior:
    'Used when caring for or repairing weapons and armor, recalling events of Barsaive’s military history, and applying knowledge of military tactics and strategy, such as identifying the safest approach to a target. Also used to recognize warrior orders, famous ancient Warriors, and ancient arms and armor.',
  Weaponsmith:
    'Used when caring for weapons and armor, and to recognize different types of weapons and armor worn or used by different Namegiver races or crafted by specific artisans.',
  Wizard:
    'Used to recognize different types of magic use, identify specific uses of Wizardry, and recall knowledge of theoretical and practical magical rituals.',
  Shaman:
    'Used to recognize different animals, animal tracks, and abnormal behavior among animals and creatures. Shamans also have an always-active innate sense: a Perception-based Half-Magic test against a beast spirit’s Mystic Defense detects the presence of beast spirits within 30 yards.',
  Gauntlet:
    'Used for knowledge of the elements, different unarmed fighting techniques, and recognizing which prominent unarmed combatants shaped someone’s fighting style. Also used to resist fatigue, distractions, and similar tests of willpower and physical endurance.',
  Boatman:
    'Discipline uses: knowledge of riverboat designs, recognizing different types of riverboats, knowing common river trade routes, identifying riverboat crew complements, and maintaining, repairing, and constructing riverboats, excluding fire engines. Mystic Path expansion: knowledge of river currents, rapids, and hazards along the Serpent River, identifying riverboat construction, and knowing the territorial waters of various aropagoi.',
  Sailor:
    'Used for knowledge of seafaring ship designs, recognizing different kinds of ships, knowing common sea trade routes, identifying crew complements, and maintaining, repairing, and constructing ships.',
  Marauder:
    'Used for maintaining weapons and armor, knowledge of different merchant caravans and crew complements, including guards, knowing commonly followed overland trade routes, and understanding the physical layout of farmsteads.',
  'Brother of Stone':
    'Used for knowledge of Liferocks, obsidiman history and customs, identifying corruption or blight affecting the earth, and recognizing the works and architecture of ancient stonecutters.',
  'Fire Eater':
    'Used to recognize triggers for gahad in other orks, identify emotional suppression techniques, recall ork clan histories, and gauge an opponent’s internal emotional intensity.',
  'Horror Stalker':
    'Used to identify Horror constructs, recognize signs of Horror marking or corruption in people and places, and recall historical encounters with specific Horrors and the weaknesses discovered by past stalkers.',
  Journeyman:
    'Used to recall basic traditions, philosophies, and training practices of Disciplines the adept does not belong to, aiding cross-Discipline cooperation.',
  Liberator:
    'Used to identify slave-trading networks, recognize Theran and merchant-house markings or slave brands, evaluate prison security and escape routes, and recall famous slave uprisings.',
  Messenger:
    'Used to know provincial courier networks, memorize map routes and safe houses, recognize code words and ciphers, and identify dead-drop locations used across Barsaive.',
  Purifier:
    'Used to evaluate the severity and depth of astral or land blight, identify natural flora and fauna that can aid ecological restoration, and recall ancient cleansing rituals.',
  Scholar:
    'Used for historical research, identifying the age and authenticity of ancient manuscripts, translating archaic dialects, and recognizing the provenance of library collections.',
  'Tail Dancer':
    'Used to evaluate dance styles, understand t’skrang martial traditions and theatrical performances, and recognize individual dueling styles that incorporate tail movements.',
  Windmaster:
    'Used for knowledge of windling settlements, aerial navigation and weather patterns, and identifying aerial combat tactics used by flying creatures and raiders.',
  Woodsman:
    'Used to navigate the deep canopies of the Blood Wood, identify rare plants and beasts native to elven forests, and recognize traditional elven court heraldry and tracking signs.',
};
