import type {
  AbilityRatings,
  EnlightenmentRatings,
  MageCharacter,
} from '../../types/character';
import { MAGE_SCHEMA_VERSION, MAGE_SYSTEM_ID } from './definitions';

export function createDefaultAbilityRatings(): AbilityRatings {
  return {
    talents: {
      alertness: 0,
      art: 0,
      athletics: 0,
      awareness: 0,
      brawl: 0,
      empathy: 0,
      expression: 0,
      intimidation: 0,
      leadership: 0,
      streetwise: 0,
      subterfuge: 0,
    },
    skills: {
      crafts: 0,
      drive: 0,
      etiquette: 0,
      firearms: 0,
      martialArts: 0,
      meditation: 0,
      melee: 0,
      research: 0,
      stealth: 0,
      survival: 0,
      technology: 0,
    },
    knowledges: {
      academics: 0,
      computer: 0,
      cosmology: 0,
      enigmas: 0,
      esoterica: 0,
      investigation: 0,
      law: 0,
      medicine: 0,
      occult: 0,
      politics: 0,
      science: 0,
    },
  };
}

export function createDefaultEnlightenment(): EnlightenmentRatings {
  return {
    arete: 1,
    willpower: 5,
    willpowerTemporary: 5,
    quintessence: 0,
    paradox: 0,
  };
}

export function createBlankMageCharacter(
  now = new Date(),
  id = crypto.randomUUID(),
): MageCharacter {
  const timestamp = now.toISOString();

  return {
    id,
    systemId: MAGE_SYSTEM_ID,
    schemaVersion: MAGE_SCHEMA_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
    identity: {
      name: '',
      player: '',
      chronicle: '',
      nature: '',
      demeanor: '',
      essence: '',
      affiliation: '',
      sect: '',
      concept: '',
    },
    attributes: {
      physical: { strength: 1, dexterity: 1, stamina: 1 },
      social: { charisma: 1, manipulation: 1, appearance: 1 },
      mental: { perception: 1, intelligence: 1, wits: 1 },
    },
    abilities: createDefaultAbilityRatings(),
    enlightenment: createDefaultEnlightenment(),
    spheres: {
      correspondence: 0,
      entropy: 0,
      forces: 0,
      life: 0,
      matter: 0,
      mind: 0,
      prime: 0,
      spirit: 0,
      time: 0,
    },
    affinitySphere: null,
    repeatableEntries: {
      backgrounds: [],
      merits: [],
      flaws: [],
      focus: {
        paradigms: [],
        practices: [],
        instruments: [],
        need: '',
        culture: '',
        notes: '',
      },
      wonders: [],
      rotes: [],
    },
    health: { damage: [] },
  };
}
