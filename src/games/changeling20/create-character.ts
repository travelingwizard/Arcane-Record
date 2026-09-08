import { readSourceDefaults } from '../shared/catalog-sources';
import { c20Arts, c20Backgrounds, c20Realms } from './catalog';
import { CHANGELING20_SCHEMA_VERSION } from './definitions';
import { C20_ABILITY_NAMES, C20_ATTRIBUTE_NAMES } from './rules';
import {
  changeling20DefaultLayout,
  type C20RatedTrait,
  type Changeling20Character,
} from './schema';
import { changeling20Sources } from './sources';

const trait = (
  kind: C20RatedTrait['kind'],
  name: string,
  category: string,
  rating: number,
  definitionId: string | null = null,
  page: number | null = null,
): C20RatedTrait => ({
  id: crypto.randomUUID(),
  definitionId,
  sourceId: 'c20.core',
  page,
  custom: definitionId === null,
  kind,
  name,
  category,
  rating,
  cost: 0,
  specialty: '',
  notes: '',
  origin: 'creator',
});

const attributeCategories = [
  'physical',
  'physical',
  'physical',
  'social',
  'social',
  'social',
  'mental',
  'mental',
  'mental',
];
const abilityCategories = Array.from({ length: 30 }, (_, index) =>
  index < 10 ? 'talents' : index < 20 ? 'skills' : 'knowledges',
);

export function createChangeling20Character(options?: {
  status?: Changeling20Character['creation']['status'];
  mode?: Changeling20Character['mode'];
}): Changeling20Character {
  return {
    schemaVersion: CHANGELING20_SCHEMA_VERSION,
    name: '',
    player: '',
    chronicle: '',
    concept: '',
    mortalIdentity: '',
    faeMien: '',
    seeming: 'wilder',
    profile: 'kithain',
    kithId: null,
    court: 'seelie',
    seelieLegacyId: null,
    unseelieLegacyId: null,
    houseId: null,
    motley: '',
    thresholdId: null,
    antithesis: '',
    mode: options?.mode ?? 'build',
    layout: structuredClone(changeling20DefaultLayout),
    enabledSources:
      typeof localStorage === 'undefined'
        ? ['c20.core']
        : readSourceDefaults('changeling20', changeling20Sources),
    showUnavailableSources: false,
    creation: {
      status: options?.status ?? 'draft',
      step: 1,
      attributePriorities: ['physical', 'social', 'mental'],
      abilityPriorities: ['talents', 'skills', 'knowledges'],
      freebieSpent: 0,
      flawCredit: 0,
      matureContent: false,
      approvals: [],
      finalizedAt: null,
      baseline: null,
      rebuildDraft: null,
    },
    attributes: C20_ATTRIBUTE_NAMES.map((name, index) =>
      trait(
        'attribute',
        name,
        attributeCategories[index]!,
        1,
        `c20.attribute.${name.toLowerCase()}`,
        160,
      ),
    ),
    abilities: C20_ABILITY_NAMES.map((name, index) =>
      trait(
        'ability',
        name,
        abilityCategories[index]!,
        0,
        `c20.ability.${name.toLowerCase().replace(/\s+/g, '-')}`,
        162,
      ),
    ),
    backgrounds: c20Backgrounds.map((entry) =>
      trait('background', entry.name, 'background', 0, entry.id, entry.page),
    ),
    arts: c20Arts.map((entry) =>
      trait('art', entry.name, 'art', 0, entry.id, entry.page),
    ),
    realms: c20Realms.map((entry) =>
      trait('realm', entry.name, 'realm', 0, entry.id, entry.page),
    ),
    merits: [],
    flaws: [],
    birthrights: [],
    frailties: [],
    alternatePowers: [],
    tempers: {
      willpower: { permanent: 4, current: 4 },
      glamour: { permanent: 5, current: 5 },
      banality: { permanent: 3, current: 3 },
      nightmare: { permanent: 0, current: 0 },
    },
    damage: [],
    society: [],
    possessions: [],
    combat: [],
    cantripNotes: '',
    temporaryEffects: '',
    history: '',
    motivations: '',
    goals: '',
    notes: '',
    experienceLedger: [],
    sessionNotes: '',
  };
}
