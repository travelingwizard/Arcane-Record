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
      height: '',
      weight: '',
      hair: '',
      skin: '',
      eyes: '',
      passion: '',
      traits: '',
      description: '',
    },
    portrait: null,
    raceSnapshot: null,
    creation: {
      status: options.status ?? 'draft',
      currentStep: 0,
      profile: 'adept',
      specializedPathId: null,
      specializedPathRank: 0,
      enforceRules: true,
      overrides: [],
      attributePoints: {},
      talentPoints: {},
      skillPoints: { general: 8, knowledge: 2, artisan: 1, language: 3 },
      finalizedAt: null,
    },
    sources: {
      enabledSourceIds:
        typeof localStorage === 'undefined'
          ? earthdawnSources.map(({ id }) => id)
          : readEarthdawnSourceDefaults(),
      showUnavailable: false,
      defaultsVersion: 2,
    },
    disciplines: [],
    questor: {
      patronId: null,
      patronName: '',
      rank: 0,
      tier: 'none',
      outOfFavor: false,
      notes: '',
    },
    questorPaths: [],
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
    weapons: [],
    wealth: { copper: 0, silver: 100, gold: 0, other: '', startingSilver: 100 },
    activity: { tracking: true, ledger: [] },
    reputation: { legendaryStatus: '', renown: '', reputation: '' },
    health: {
      basicMode: true,
      damage: 0,
      wounds: 0,
      bloodMagicDamage: 0,
      unconsciousnessBonus: 0,
      deathBonus: 0,
      recoveryUsed: 0,
      karmaCurrent: 0,
      karmaMaximum: 0,
      devotionPoints: 0,
      karmaAdjustment: 0,
      lastKarmaRitualAt: null,
      lastRecoveryRoll: null,
      lastWoundBalanceRoll: null,
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
    advancement: { ledger: [] },
    dice: {
      step: 8,
      modifier: 0,
      targetNumber: 0,
      context: '',
      tracking: true,
      historyLimit: 10,
      lastRoll: null,
      history: [],
    },
    notes: { log: '', notes: '', entries: [], importReview: null },
    sheetLayout: {
      mode: options.mode ?? 'edit',
      groupOrder: [...defaultEarthdawn4eGroupOrder],
    },
  };
}
