import {
  defaultTorchbearer2eGroupOrder,
  torchbearer2eConditionIds,
} from './definitions';
import {
  TORCHBEARER_CORE_SOURCE,
  TORCHBEARER_CORE_SOURCE_ID,
  torchbearerSkills,
} from './catalog';
import {
  emptyTorchbearerCreationState,
  emptyScholarPlayState,
  type Torchbearer2eCharacter,
} from './schema';

const advancement = () => ({ rating: 0, passed: 0, failed: 0 });

export function createBlankTorchbearer2eCharacter(
  options: {
    creationStatus?: Torchbearer2eCharacter['creation']['status'];
    mode?: Torchbearer2eCharacter['sheetLayout']['mode'];
  } = {},
): Torchbearer2eCharacter {
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
    creation: emptyTorchbearerCreationState(options.creationStatus ?? 'draft'),
    playState: emptyScholarPlayState(),
    terriblePrice: [],
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
    skills: torchbearerSkills.map((definition) => ({
      id: crypto.randomUUID(),
      definitionId: definition.id,
      name: definition.name,
      beginnersLuckRoot: definition.beginnersLuckRoot,
      rating: 0,
      startingRating: 0,
      passed: 0,
      failed: 0,
      notes: '',
      source: {
        sourceId: TORCHBEARER_CORE_SOURCE_ID,
        source: TORCHBEARER_CORE_SOURCE,
        page: definition.page,
      },
      origin: { type: 'creation', choiceId: 'core-skill-catalog' },
    })),
    wises: [],
    inventory: [],
    relationships: [],
    magic: { urdr: 0, burden: 0, memoryPalace: 0, relics: [], spells: [] },
    advancement: {
      experience: { total: 0, current: 0 },
      levelBenefit: '',
      levelBenefits: [],
      history: '',
    },
    notes: '',
    sheetLayout: {
      mode: options.mode ?? 'edit',
      groupOrder: [...defaultTorchbearer2eGroupOrder],
    },
  };
}
