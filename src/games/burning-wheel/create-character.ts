import type { BurningWheelStock } from './catalog';
import { defaultGroupOrder, type BurningWheelCharacter } from './schema';

const tests = () => ({ routine: 0, difficult: 0, challenging: 0 });
const stat = () => ({
  shade: 'B' as const,
  mentalPoints: 0,
  physicalPoints: 0,
  eitherPoints: 0,
  bonus: 0,
  tests: tests(),
});

export function createBlankBurningWheelCharacter(
  stock: BurningWheelStock,
): BurningWheelCharacter {
  return {
    stock,
    mode: 'build',
    identity: { name: '', player: '', concept: '', gender: '' },
    beliefs: ['', '', ''],
    instincts: ['', '', ''],
    burn: {
      settings: {
        enforceLifepathRequirements: true,
        enforcePointLimits: true,
        appropriateWeapons: {},
      },
      lifepaths: [],
      stats: {
        will: stat(),
        perception: stat(),
        power: stat(),
        forte: stat(),
        agility: stat(),
        speed: stat(),
      },
      skills: [],
      traits: [],
      attributeModifiers: {},
    },
    connections: { relationships: [], affiliations: [], reputations: [] },
    possessions: [],
    play: {
      experience: { total: 0, current: 0 },
      artha: { fate: 0, persona: 0, deeds: 0 },
      resourceTax: 0,
      wounds: [],
      advancement: [],
      notes: '',
    },
    sheetLayout: {
      buildGroupOrder: [...defaultGroupOrder],
      playGroupOrder: [...defaultGroupOrder],
    },
  };
}
