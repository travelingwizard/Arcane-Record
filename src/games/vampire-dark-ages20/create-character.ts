import { readSourceDefaults } from '../shared/catalog-sources';
import { dav20Backgrounds, dav20Disciplines } from './catalog';
import { DAV20_SCHEMA_VERSION } from './definitions';
import { DAV20_ABILITIES, DAV20_ATTRIBUTES } from './rules';
import {
  dav20DefaultLayout,
  type Dav20Character,
  type Dav20RatedTrait,
} from './schema';
import { dav20Sources } from './sources';

const trait = (
  kind: Dav20RatedTrait['kind'],
  name: string,
  category: string,
  rating: number,
  definitionId: string | null,
  page: number | null,
): Dav20RatedTrait => ({
  id: crypto.randomUUID(),
  definitionId,
  sourceId: 'dav20.core',
  page,
  custom: definitionId === null,
  name,
  kind,
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
const abilityCategories = Array.from({ length: 30 }, (_, i) =>
  i < 10 ? 'talents' : i < 20 ? 'skills' : 'knowledges',
);

export function createDav20Character(options?: {
  status?: Dav20Character['creation']['status'];
  mode?: Dav20Character['mode'];
}): Dav20Character {
  const emptyCoterie = {
    name: '',
    anchorBackgroundId: null,
    members: [],
    relationships: [],
    pooledBackgrounds: [],
    notes: '',
  };
  return {
    schemaVersion: DAV20_SCHEMA_VERSION,
    name: '',
    player: '',
    chronicle: '',
    natureId: null,
    demeanorId: null,
    concept: '',
    lineageId: null,
    sire: '',
    mortalLife: '',
    embrace: '',
    currentUnlife: '',
    age: '',
    apparentAge: '',
    birthDate: '',
    deathDate: '',
    gender: '',
    nationality: '',
    description: '',
    goals: '',
    history: '',
    notes: '',
    roadId: null,
    roadRating: 2,
    aura: '',
    clanWeakness: '',
    generation: 12,
    mode: options?.mode ?? 'build',
    layout: structuredClone(dav20DefaultLayout),
    enabledSources:
      typeof localStorage === 'undefined'
        ? ['dav20.core']
        : readSourceDefaults('vampire-dark-ages20', dav20Sources),
    showUnavailableSources: false,
    creation: {
      status: options?.status ?? 'draft',
      step: 1,
      attributePriorities: ['physical', 'social', 'mental'],
      abilityPriorities: ['talents', 'skills', 'knowledges'],
      freebieSpent: 0,
      flawCredit: 0,
      matureContent: false,
      restrictedSelection: false,
      approvals: [],
      rolls: [],
      finalizedAt: null,
      baseline: null,
      rebuildDraft: null,
    },
    attributes: DAV20_ATTRIBUTES.map((name, i) =>
      trait(
        'attribute',
        name,
        attributeCategories[i]!,
        1,
        `dav20.attribute.${name.toLowerCase()}`,
        159,
      ),
    ),
    abilities: DAV20_ABILITIES.map((name, i) =>
      trait(
        'ability',
        name,
        abilityCategories[i]!,
        0,
        `dav20.ability.${name.toLowerCase().replace(/\s+/g, '-')}`,
        162,
      ),
    ),
    backgrounds: dav20Backgrounds.map((entry) =>
      trait('background', entry.name, 'background', 0, entry.id, entry.page),
    ),
    disciplines: dav20Disciplines.map((entry) =>
      trait('discipline', entry.name, 'discipline', 0, entry.id, entry.page),
    ),
    virtues: [
      trait('virtue', 'Conscience / Conviction', 'road', 1, null, 183),
      trait('virtue', 'Self-Control / Instinct', 'road', 1, null, 183),
      trait('virtue', 'Courage', 'universal', 1, null, 183),
    ],
    merits: [],
    flaws: [],
    paths: [],
    rituals: [],
    otherTraits: [],
    willpower: { permanent: 1, current: 1 },
    blood: { current: 1, maximum: 10, perTurn: 1 },
    health: [],
    states: {
      frenzy: false,
      rotschreck: false,
      torpor: false,
      finalDeath: false,
      temporaryEffects: '',
    },
    derangements: [],
    coterie: emptyCoterie,
    possessions: [],
    weapons: [],
    armor: [],
    haven: { location: '', description: '', feedingGrounds: '' },
    experienceLedger: [],
    maturation: {
      enabled: false,
      years: 0,
      grantedExperience: 0,
      notes: '',
      completedAt: null,
    },
    sessionNotes: '',
  };
}
