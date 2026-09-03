import { defaultEarthdawn4eGroupOrder } from './definitions';
import { earthdawnSources } from './catalog';
import type { Earthdawn4eCharacter } from './schema';
import { readEarthdawnSourceDefaults } from './source-preferences';

const attribute = () => ({
  racial: 10,
  purchased: 0,
  increases: 0,
  temporaryBonus: 0,
});
export function createBlankEarthdawn4eCharacter(
  options: {
    status?: Earthdawn4eCharacter['creation']['status'];
    mode?: Earthdawn4eCharacter['sheetLayout']['mode'];
  } = {},
): Earthdawn4eCharacter {
  return {
    identity: {
      name: '',
      player: '',
      raceId: null,
      raceName: '',
      gender: '',
      age: '',
      hair: '',
      skin: '',
      eyes: '',
      passion: '',
      traits: '',
      description: '',
    },
    creation: {
      status: options.status ?? 'draft',
      currentStep: 0,
      enforceRules: true,
      overrides: [],
      attributePoints: {},
      talentPoints: {},
      skillPoints: { general: 8, knowledge: 2, artisan: 1 },
      finalizedAt: null,
    },
    sources: {
      enabledSourceIds:
        typeof localStorage === 'undefined'
          ? earthdawnSources
              .filter(({ required }) => required)
              .map(({ id }) => id)
          : readEarthdawnSourceDefaults(),
      showUnavailable: false,
    },
    disciplines: [],
    attributes: {
      dexterity: attribute(),
      strength: attribute(),
      toughness: attribute(),
      perception: attribute(),
      willpower: attribute(),
      charisma: attribute(),
    },
    talents: [],
    skills: [],
    knacks: [],
    abilities: [],
    magic: { spells: [], matrices: [], effects: [] },
    equipment: [],
    health: {
      damage: 0,
      wounds: 0,
      unconsciousnessBonus: 0,
      deathBonus: 0,
      recoveryUsed: 0,
      karmaCurrent: 0,
      karmaMaximum: 0,
      devotionPoints: 0,
      conditions: {
        stance: 'normal',
        knockedDown: false,
        knockedDownSocial: false,
        harried: false,
        surprised: false,
        surprisedSocial: false,
        darkness: 0,
      },
      modifiers: [],
    },
    advancement: { legend: { current: 0, total: 0 }, ledger: [] },
    dice: { step: 8, modifier: 0, targetNumber: 0, context: '', history: [] },
    notes: { log: '', notes: '', importReview: null },
    sheetLayout: {
      mode: options.mode ?? 'edit',
      groupOrder: [...defaultEarthdawn4eGroupOrder],
    },
  };
}
