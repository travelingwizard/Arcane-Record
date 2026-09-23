import type { ExaltedCharacterType, ExaltedSourceId } from './profiles';

export interface ExaltedCatalogDefinition {
  id: string;
  name: string;
  summary: string;
  aliases: readonly string[];
  sourceId: ExaltedSourceId;
  printedPage: number;
  pdfPage: number;
  verification: 'verified';
}

const definitions = (
  sourceId: ExaltedSourceId,
  printedPage: number,
  pdfPage: number,
  rows: readonly [string, string, string][],
): readonly ExaltedCatalogDefinition[] =>
  rows.map(([id, name, summary]) => ({
    id,
    name,
    summary,
    aliases: [],
    sourceId,
    printedPage,
    pdfPage,
    verification: 'verified',
  }));

export const exaltedFamilyBackgroundCatalogs: Partial<
  Record<ExaltedCharacterType, readonly ExaltedCatalogDefinition[]>
> = {
  lunar: definitions('lunars', 93, 96, [
    ['allies', 'Allies', 'Friends and aides who provide meaningful help.'],
    ['artifact', 'Artifact', 'Wondrous tools, commonly made from moonsilver.'],
    ['backing', 'Backing', 'Standing in an influential organization.'],
    ['contacts', 'Contacts', 'Information sources in useful places.'],
    ['cult', 'Cult', 'Mortals who offer worship.'],
    ['familiar', 'Familiar', 'An animal companion.'],
    [
      'followers',
      'Followers',
      'Mortals or beastmen who accept the Lunar’s leadership.',
    ],
    ['hearts-blood', "Heart's Blood", 'Forms the Lunar has learned to assume.'],
    ['influence', 'Influence', 'Pull in the surrounding world.'],
    ['manse', 'Manse', 'Access to a geomantic place of power.'],
    ['mentor', 'Mentor', 'A patron and teacher.'],
    ['renown', 'Renown', 'Standing within the Silver Pact.'],
    ['resources', 'Resources', 'Material wealth and goods.'],
  ]),
  abyssal: definitions('abyssals', 125, 126, [
    [
      'abyssal-command',
      'Abyssal Command',
      'Authority over the liege’s troops.',
    ],
    ['allies', 'Allies', 'Friends and aides who provide meaningful help.'],
    ['artifact', 'Artifact', 'First Age wonders or relics of the dead.'],
    ['contacts', 'Contacts', 'Information sources in useful places.'],
    ['familiar', 'Familiar', 'An animal companion.'],
    [
      'followers',
      'Followers',
      'Ghosts or mortals who accept the deathknight’s leadership.',
    ],
    ['influence', 'Influence', 'Pull in the surrounding world.'],
    ['liege', 'Liege', 'The character’s relationship with a Deathlord.'],
    ['manse', 'Manse', 'Access to a geomantic place of power.'],
    ['necromancy', 'Necromancy', 'Training in the magic of the dead.'],
    ['resources', 'Resources', 'Material wealth and goods.'],
    ['spies', 'Spies', 'Access to the liege’s espionage network.'],
    [
      'underworld-manse',
      'Underworld Manse',
      'Access to a place of power in the Underworld.',
    ],
    ['whispers', 'Whispers', 'Attunement to the Malfeans.'],
  ]),
  sidereal: definitions('sidereals', 101, 104, [
    [
      'acquaintances',
      'Acquaintances',
      'Useful mortal associates familiar with the Sidereal.',
    ],
    ['allies', 'Allies', 'Powerful friends, often gods.'],
    ['artifact', 'Artifact', 'Wondrous tools, commonly made from starmetal.'],
    ['backing', 'Backing', 'Rank within a faction or other organization.'],
    ['celestial-manse', 'Celestial Manse', 'A dwelling in Yu-Shan.'],
    [
      'connections',
      'Connections',
      'Information networks that provide pull in a chosen sphere.',
    ],
    ['familiar', 'Familiar', 'An animal companion.'],
    ['manse', 'Manse', 'Access to a geomantic place of power.'],
    ['salary', 'Salary', 'The character’s Celestial pay allocation.'],
    ['savant', 'Savant', 'Recovered knowledge of the First Age.'],
    ['sifu', 'Sifu', 'A mentor in Sidereal martial arts.'],
  ]),
  alchemical: definitions('autochthonians', 64, 65, [
    ['allies', 'Allies', 'Friends and aides who provide meaningful help.'],
    ['artifact', 'Artifact', 'Magical tools and weapons.'],
    ['backing', 'Backing', 'Rank in an Autochthonian organization.'],
    ['class', 'Class', 'Social rank and standard of living.'],
    ['contacts', 'Contacts', 'Information sources in useful places.'],
    ['familiar', 'Familiar', 'Access to an automaton or divine servitor.'],
    ['followers', 'Followers', 'Mortals who accept an exile’s leadership.'],
    ['manse', 'Manse', 'A geomantic place of power in Creation.'],
    ['resources', 'Resources', 'Hoarded goods available to an exile.'],
    ['vats', 'Vats', 'Access to refitting facilities and reserve Charms.'],
  ]),
  'fair-folk': definitions('fair-folk', 100, 101, [
    ['allies', 'Allies', 'Friends and aides who provide meaningful help.'],
    [
      'artifact',
      'Artifact',
      'Wyld-shaped weapons, tools, creatures, or spells.',
    ],
    ['birth', 'Birth', 'Powers inherited from an auspicious origin.'],
    ['familiar', 'Familiar', 'A bestial companion.'],
    ['freehold', 'Freehold', 'Access to a stable place of Wyld power.'],
    ['gossamer', 'Gossamer', 'Income measured in dream-stuff.'],
    ['manse', 'Manse', 'Access to a geomantic place of power.'],
    ['mentor', 'Mentor', 'A patron and teacher.'],
    ['retinue', 'Retinue', 'Authority over common raksha.'],
    ['style', 'Style', 'Confidence and force when shaping reality.'],
  ]),
};

export function getExaltedFamilyBackgrounds(type: ExaltedCharacterType) {
  return exaltedFamilyBackgroundCatalogs[type] ?? [];
}
