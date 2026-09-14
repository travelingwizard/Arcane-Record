import { backgrounds } from './catalog';
import {
  characterGroupIds,
  DITV_SCHEMA_VERSION,
  DITV_SOURCE_ID,
  townGroupIds,
} from './definitions';
import { emptyDice } from './rules';
import type { DitvCharacter, DitvTown } from './schema';

const rated = (name: string, dice: ReturnType<typeof emptyDice>) => ({
  id: crypto.randomUUID(),
  name,
  dice,
  notes: '',
  origin: 'creation' as const,
  temporaryUntilConflict: false,
  sourceId: DITV_SOURCE_ID,
  page: 27,
});

export function createDitvCharacter(
  status: DitvCharacter['creation']['status'] = 'draft',
): DitvCharacter {
  const background = backgrounds[0]!;
  return {
    schemaVersion: DITV_SCHEMA_VERSION,
    name: '',
    player: '',
    pronouns: '',
    background: '',
    homeBranch: '',
    route: '',
    mode: 'build',
    layout: {
      build: [...characterGroupIds],
      play: ['play', 'traits', 'possessions', 'growth', 'character', 'records'],
    },
    creation: {
      status,
      step: 1,
      backgroundId: status === 'draft' ? background.id : '',
      hopedAccomplishment: '',
      initiationConflictId: null,
      initiationTraitId: null,
      approvals: [],
      baseline: null,
      rebuildDraft: null,
      finalizedAt: null,
    },
    stats:
      status === 'draft'
        ? { acuity: 5, body: 4, heart: 4, will: 4 }
        : { acuity: 0, body: 0, heart: 0, will: 0 },
    traits: [],
    relationships: [],
    availableRelationshipDice:
      status === 'draft' ? { ...background.relationships } : emptyDice(),
    belongings:
      status === 'draft'
        ? [
            {
              ...rated('Coat', { d4: 0, d6: 2, d8: 0, d10: 0 }),
              kind: 'coat',
              quality: 'excellent',
              state: 'carried',
            },
            {
              ...rated('Horse', { d4: 0, d6: 1, d8: 0, d10: 0 }),
              kind: 'horse',
              quality: 'normal',
              state: 'carried',
            },
            {
              ...rated('Book of Life', { d4: 0, d6: 1, d8: 0, d10: 0 }),
              kind: 'book',
              quality: 'normal',
              state: 'carried',
            },
            {
              ...rated('Consecrated earth', { d4: 0, d6: 1, d8: 0, d10: 0 }),
              kind: 'earth',
              quality: 'normal',
              state: 'carried',
            },
            {
              ...rated('Gun', { d4: 1, d6: 1, d8: 0, d10: 0 }),
              kind: 'gun',
              quality: 'normal',
              state: 'carried',
            },
          ]
        : [],
    coatDescription: '',
    conflicts: [],
    fallout: [],
    temporaryStatPenalties: { acuity: 0, body: 0, heart: 0, will: 0 },
    betweenTowns: {
      reflection: '',
      falloutChoice: '',
      relationshipChoice: '',
      direction: '',
      applied: false,
    },
    retired: false,
    deceased: false,
    history: [],
    town: { kind: 'none', snapshot: null },
    notes: '',
  };
}

export function createDitvTown(): DitvTown {
  return {
    schemaVersion: DITV_SCHEMA_VERSION,
    name: '',
    gm: '',
    assignment: '',
    mode: 'build',
    revision: 0,
    layout: {
      build: [...townGroupIds],
      play: ['play', 'people', 'town', 'records'],
    },
    problems: [
      {
        id: crypto.randomUUID(),
        label: 'Town problem',
        pride: '',
        injustice: '',
        sin: '',
        demonicAttacks: '',
        falseDoctrine: '',
        corruptWorship: '',
        falsePriesthood: '',
        sorcery: '',
        hateMurder: '',
      },
    ],
    townspeople: [],
    demonWants: '',
    demonWantsFromDogs: '',
    withoutDogs: '',
    demonicInfluence: emptyDice(),
    npcs: [],
    freeDice: emptyDice(),
    conflicts: [],
    privateNotes: '',
    history: [],
    notes: '',
  };
}
