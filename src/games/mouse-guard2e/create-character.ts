import { readSourceDefaults } from '../shared/catalog-sources';
import { ranks, type GuardRankId } from './catalog';
import {
  mouseGuardGroupIds,
  MOUSE_GUARD_PATROL_SCHEMA_VERSION,
  MOUSE_GUARD_SCHEMA_VERSION,
  patrolGroups,
} from './definitions';
import type {
  MouseGuardCharacter,
  MouseGuardPatrol,
  MouseGuardRated,
} from './schema';
import { mouseGuardSources } from './sources';
const rated = (
  name: string,
  rating: number,
  origin: MouseGuardRated['origin'] = 'rank',
): MouseGuardRated => ({
  id: crypto.randomUUID(),
  definitionId: `mg2.core.${name.toLowerCase().replaceAll(' ', '-')}`,
  name,
  rating,
  marks: { pass: 0, fail: 0 },
  notes: '',
  sourceId: 'mg2.core',
  page: 300,
  origin,
});
export function createMouseGuardCharacter(options?: {
  rankId?: GuardRankId;
  status?: MouseGuardCharacter['creation']['status'];
  method?: MouseGuardCharacter['creation']['method'];
  mode?: MouseGuardCharacter['mode'];
}): MouseGuardCharacter {
  const rank = ranks.find((x) => x.id === (options?.rankId ?? 'guardmouse'))!;
  const enabled =
    typeof localStorage === 'undefined'
      ? ['mg2.core']
      : readSourceDefaults('mouse-guard2e', mouseGuardSources);
  return {
    schemaVersion: MOUSE_GUARD_SCHEMA_VERSION,
    name: '',
    player: '',
    chronicle: '',
    concept: '',
    rankId: rank.id,
    age: rank.age[0],
    birthYear: null,
    homeId: '',
    furColor: '',
    description: '',
    cloakColor: '',
    belief: '',
    goal: '',
    instinct: '',
    mode: options?.mode ?? 'build',
    layout: {
      build: [...mouseGuardGroupIds],
      play: [
        'conditions',
        'mission',
        'rewards',
        'abilities',
        'skills',
        'traits',
        'gear',
        'relationships',
        'character',
        'advancement',
        'records',
      ],
    },
    enabledSources: enabled,
    showUnavailableSources: false,
    creation: {
      status: options?.status ?? 'draft',
      method: options?.method ?? 'recruitment',
      step: 1,
      natureAnswers: ['', '', ''],
      gmOverrides: [],
      finalizedAt: null,
      baseline: null,
      rebuildDraft: null,
    },
    will: rated('Will', rank.will),
    health: rated('Health', rank.health),
    nature: {
      ...rated('Nature', 3),
      maximum: 3,
      tax: 0,
      descriptors: ['Escaping', 'Climbing', 'Hiding', 'Foraging'],
    },
    resources: rated('Resources', rank.resources),
    circles: rated('Circles', rank.circles),
    skills: Object.entries(rank.skills).map(([n, v]) => rated(n, v)),
    wises: [],
    traits: [],
    relationships: [],
    gear: [],
    conditions: Object.fromEntries(
      ['Hungry and Thirsty', 'Angry', 'Tired', 'Injured', 'Sick'].map((x) => [
        x,
        false,
      ]),
    ),
    checks: 0,
    fate: { current: 1, earned: 1, spent: 0 },
    persona: { current: 1, earned: 1, spent: 0 },
    mission: { title: '', patrolGoal: '', notes: '', tests: [] },
    conflict: {
      active: false,
      type: '',
      goal: '',
      captain: '',
      participants: [],
      maximumDisposition: 0,
      currentDisposition: 0,
      actions: [],
      result: '',
      compromise: '',
    },
    rollHistory: [],
    advancementHistory: [],
    sessionNotes: '',
    patrol: { kind: 'none' },
  };
}
export function createMouseGuardPatrol(): MouseGuardPatrol {
  return {
    schemaVersion: MOUSE_GUARD_PATROL_SCHEMA_VERSION,
    name: '',
    gm: '',
    year: 1152,
    season: 'Spring',
    location: '',
    mode: 'build',
    layout: {
      build: patrolGroups.map((x) => x.id),
      play: ['mission', 'roster', 'rewards', 'patrol', 'history'],
    },
    enabledSources: ['mg2.core'],
    revision: 0,
    members: [],
    mission: { title: '', goal: '', obstacles: [], turns: 0, notes: '' },
    rewards: [],
    allies: [],
    enemies: [],
    settlements: [],
    history: [],
    notes: '',
  };
}
