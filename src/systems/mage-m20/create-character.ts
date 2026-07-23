import type { MageCharacter } from '../../types/character';
import { MAGE_SCHEMA_VERSION, MAGE_SYSTEM_ID } from './definitions';

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
      focus: [],
      wonders: [],
      rotes: [],
    },
    health: { damage: [] },
  };
}
