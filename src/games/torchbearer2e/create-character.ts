import {
  defaultTorchbearer2eGroupOrder,
  torchbearer2eConditionIds,
  torchbearer2eSkills,
} from './definitions';
import type { Torchbearer2eCharacter } from './schema';

const advancement = () => ({ rating: 0, passed: 0, failed: 0 });

export function createBlankTorchbearer2eCharacter(): Torchbearer2eCharacter {
  return {
    identity: {
      name: '',
      stock: '',
      class: '',
      age: '',
      home: '',
      raiment: '',
      parents: '',
      mentor: '',
      friend: '',
      enemy: '',
      level: 1,
    },
    drives: { belief: '', creed: '', goal: '', instinct: '' },
    traits: [],
    rewards: {
      fate: { current: 0, total: 0, totalSpent: 0 },
      persona: { current: 0, total: 0, totalSpent: 0 },
    },
    conditions: Object.fromEntries(
      torchbearer2eConditionIds.map((id) => [id, id === 'fresh']),
    ) as Torchbearer2eCharacter['conditions'],
    abilities: {
      will: advancement(),
      health: advancement(),
      nature: { ...advancement(), current: 0, descriptors: ['', '', ''] },
      resources: advancement(),
      circles: advancement(),
      precedence: 0,
      might: 0,
    },
    skills: torchbearer2eSkills.map(([definitionId, name, root]) => ({
      id: crypto.randomUUID(),
      definitionId,
      name,
      beginnersLuckRoot: root,
      rating: 0,
      passed: 0,
      failed: 0,
      notes: '',
    })),
    wises: [],
    inventory: [],
    relationships: [],
    magic: { urdr: 0, burden: 0, memoryPalace: 0, relics: [], spells: [] },
    advancement: {
      experience: { total: 0, current: 0 },
      levelBenefit: '',
      history: '',
    },
    notes: '',
    sheetLayout: { groupOrder: [...defaultTorchbearer2eGroupOrder] },
  };
}
