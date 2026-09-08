import { readSourceDefaults } from '../shared/catalog-sources';
import { v20Backgrounds, v20Disciplines } from './catalog';
import { V20_SCHEMA_VERSION } from './definitions';
import { V20_ABILITIES, V20_ATTRIBUTES } from './rules';
import {
  v20DefaultLayout,
  type V20Character,
  type V20RatedTrait,
} from './schema';
import { v20Sources } from './sources';

const trait = (
  kind: V20RatedTrait['kind'],
  name: string,
  category: string,
  rating: number,
  definitionId: string | null,
  page: number | null,
): V20RatedTrait => ({
  id: crypto.randomUUID(),
  definitionId,
  sourceId: 'v20.core',
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

export function createV20Character(options?: {
  status?: V20Character['creation']['status'];
  mode?: V20Character['mode'];
  characterType?: V20Character['characterType'];
}): V20Character {
  const characterType = options?.characterType ?? 'vampire';
  const emptyCoterie = {
    name: '',
    anchorBackgroundId: null,
    members: [],
    relationships: [],
    pooledBackgrounds: [],
    notes: '',
  };
  return {
    schemaVersion: V20_SCHEMA_VERSION,
    characterType,
    ghoulType: characterType === 'ghoul' ? 'vassal' : null,
    revenantFamilyId: null,
    domitor: {
      name: '',
      clanId: null,
      generation: null,
      bondLevel: 0,
      notes: '',
    },
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
    roadId: 'v20.road.humanity',
    roadRating: 2,
    aura: '',
    clanWeakness: '',
    generation: 13,
    mode: options?.mode ?? 'build',
    layout: structuredClone(v20DefaultLayout),
    enabledSources: [
      ...new Set([
        ...(typeof localStorage === 'undefined'
          ? ['v20.core']
          : readSourceDefaults('vampire20', v20Sources)),
        ...(characterType === 'vampire' ? [] : ['v20.ghouls-revenants']),
      ]),
    ],
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
    attributes: V20_ATTRIBUTES.map((name, i) =>
      trait(
        'attribute',
        name,
        attributeCategories[i]!,
        1,
        `v20.attribute.${name.toLowerCase()}`,
        80,
      ),
    ),
    abilities: V20_ABILITIES.map((name, i) =>
      trait(
        'ability',
        name,
        abilityCategories[i]!,
        0,
        `v20.ability.${name.toLowerCase().replace(/\s+/g, '-')}`,
        80,
      ),
    ),
    backgrounds: v20Backgrounds.map((entry) =>
      trait('background', entry.name, 'background', 0, entry.id, entry.page),
    ),
    disciplines: v20Disciplines.map((entry) =>
      trait(
        'discipline',
        entry.name,
        'discipline',
        characterType !== 'vampire' && entry.name === 'Potence' ? 1 : 0,
        entry.id,
        entry.page,
      ),
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
    blood: {
      current: 1,
      maximum: characterType === 'vampire' ? 10 : 2,
      perTurn: 1,
    },
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
    society: {
      titles: [],
      boons: [],
      relationships: [],
      organizations: [],
      technologyComplications: [],
    },
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
