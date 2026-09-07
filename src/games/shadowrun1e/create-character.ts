import { readSourceDefaults } from '../shared/catalog-sources';
import { SHADOWRUN1E_SCHEMA_VERSION } from './definitions';
import { shadowrun1eSources } from './sources';
import { shadowrun1eDefaultLayout, type Shadowrun1eCharacter } from './schema';

export function createShadowrun1eCharacter(options?: {
  status?: Shadowrun1eCharacter['creation']['status'];
  mode?: Shadowrun1eCharacter['mode'];
}): Shadowrun1eCharacter {
  const zeroAttributes = {
    body: 1,
    quickness: 1,
    strength: 1,
    charisma: 1,
    intelligence: 1,
    willpower: 1,
    essence: 6,
    magic: 0,
  };
  return {
    schemaVersion: SHADOWRUN1E_SCHEMA_VERSION,
    name: '',
    player: '',
    streetName: '',
    metatype: 'human',
    archetype: '',
    age: '',
    sex: '',
    height: '',
    weight: '',
    description: '',
    notes: '',
    mode: options?.mode ?? 'build',
    layout: structuredClone(shadowrun1eDefaultLayout),
    creation: {
      status: options?.status ?? 'draft',
      priorities: { magic: 4, attributes: 3, skills: 2, tech: 1, race: 0 },
      gmApproved: false,
      approvalNotes: '',
      finalizedAt: null,
    },
    enabledSources:
      typeof localStorage === 'undefined'
        ? ['sr1.core']
        : readSourceDefaults('shadowrun1e', shadowrun1eSources),
    showUnavailableSources: false,
    attributes: zeroAttributes,
    pools: { combat: 0, hacking: 0, magic: 0, astral: 0, defense: 0 },
    skills: [],
    spells: [],
    cyberware: [],
    gear: [],
    contacts: [],
    matrix: {
      deck: '',
      persona: { body: 0, evasion: 0, masking: 0, sensors: 0 },
      programs: [],
      notes: '',
    },
    combat: {
      armorBallistic: 0,
      armorImpact: 0,
      damagePhysical: 0,
      damageStun: 0,
      initiativeDice: 1,
      initiativeBonus: 0,
      currentInitiative: 0,
      conditions: '',
    },
    experience: { total: 0, current: 0 },
  };
}
