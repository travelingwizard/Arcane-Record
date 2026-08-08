import type { Exalted1eCharacter } from './schema';
import {
  defaultExaltedSectionGroupOrder,
  exaltedAbilities,
  exaltedAttributeGroups,
  exaltedVirtues,
  type ExaltedSheetType,
} from './definitions';

export function createBlankExaltedCharacter(
  sheetType: ExaltedSheetType,
): Exalted1eCharacter {
  return {
    sheetType,
    identity: {
      name: '',
      player: '',
      concept: '',
      nature: '',
      caste: '',
      aspect: '',
      house: '',
      anima: '',
    },
    attributes: Object.fromEntries(
      exaltedAttributeGroups.map((group) => [
        group.id,
        Object.fromEntries(group.traits.map((trait) => [trait.id, 1])),
      ]),
    ) as Exalted1eCharacter['attributes'],
    abilities: Object.fromEntries(
      exaltedAbilities.map((ability) => [ability.id, 0]),
    ) as Exalted1eCharacter['abilities'],
    favoredAbilities: [],
    backgrounds: [],
    virtues: Object.fromEntries(
      exaltedVirtues.map((virtue) => [virtue.id, 1]),
    ) as Exalted1eCharacter['virtues'],
    willpower: { permanent: 0, temporary: 0 },
    essence: { rating: 1, personal: 0, peripheral: 0, committed: 0 },
    limit: { rating: 0, virtueFlaw: '' },
    meritsFlaws: { merits: [], flaws: [] },
    powers: { charms: [], spells: [] },
    equipment: { weapons: [], armor: [], shields: [], ammunition: [] },
    combat: {
      profile: 'classic',
      specialties: [],
      woundPenalty: 0,
      staticInitiativeModifier: 0,
      staticDodgeModifier: 0,
    },
    combos: [],
    notes: { anima: '', weapons: '', experience: '' },
    sheetLayout: {
      groupOrder: [...defaultExaltedSectionGroupOrder],
    },
  };
}
