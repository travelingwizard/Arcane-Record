import { readSourceDefaults } from '../shared/catalog-sources';
import { w20Backgrounds } from './catalog';
import { W20_SCHEMA_VERSION } from './definitions';
import { W20_ABILITIES, W20_ATTRIBUTES, W20_FORM_NAMES } from './rules';
import {
  w20DefaultLayout,
  type W20Character,
  type W20RatedTrait,
} from './schema';
import { w20Sources } from './sources';
const rated = (
  kind: W20RatedTrait['kind'],
  name: string,
  category: string,
  rating: number,
  definitionId: string | null,
  page: number | null,
): W20RatedTrait => ({
  id: crypto.randomUUID(),
  definitionId,
  sourceId: 'w20.core',
  page,
  custom: !definitionId,
  name,
  kind,
  category,
  rating,
  cost: 0,
  specialty: '',
  notes: '',
  origin: 'creator',
});
const record = (name: string, category: string) => ({
  id: crypto.randomUUID(),
  definitionId: null,
  sourceId: 'w20.core',
  page: null,
  custom: true,
  name,
  category,
  rating: 0,
  state: '',
  quantity: 1,
  notes: '',
});
export function createW20Character(options?: {
  status?: W20Character['creation']['status'];
  mode?: W20Character['mode'];
  characterType?: W20Character['characterType'];
}): W20Character {
  const characterType = options?.characterType ?? 'garou';
  const supplemental =
    characterType === 'changing-breed'
      ? 'w20.changing-breeds'
      : characterType === 'kinfolk'
        ? 'w20.kinfolk'
        : characterType === 'wyrm-aligned'
          ? 'w20.book-of-the-wyrm'
          : null;
  const defaults =
    typeof localStorage === 'undefined'
      ? ['w20.core']
      : readSourceDefaults('werewolf20', w20Sources);
  return {
    schemaVersion: W20_SCHEMA_VERSION,
    characterType,
    changingBreedId: null,
    wyrmTypeId: null,
    kinfolkType: characterType === 'kinfolk' ? 'human' : null,
    name: '',
    player: '',
    chronicle: '',
    concept: '',
    natureId: null,
    demeanorId: null,
    breedId: null,
    auspiceId: null,
    tribeId: null,
    campId: null,
    deedName: '',
    packName: '',
    packTotemId: null,
    age: '',
    gender: '',
    description: '',
    goals: '',
    history: '',
    notes: '',
    mode: options?.mode ?? 'build',
    layout: structuredClone(w20DefaultLayout),
    enabledSources: [
      ...new Set([...defaults, ...(supplemental ? [supplemental] : [])]),
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
      restrictedSelection: characterType === 'wyrm-aligned',
      approvals: [],
      finalizedAt: null,
      baseline: null,
      rebuildDraft: null,
    },
    attributes: W20_ATTRIBUTES.map((name, i) =>
      rated(
        'attribute',
        name,
        i < 3 ? 'physical' : i < 6 ? 'social' : 'mental',
        1,
        `w20.core.attribute.${name.toLowerCase()}`,
        115,
      ),
    ),
    abilities: W20_ABILITIES.map((name, i) =>
      rated(
        'ability',
        name,
        i < 10 ? 'talents' : i < 20 ? 'skills' : 'knowledges',
        0,
        `w20.core.ability.${name.toLowerCase().replace(/\s+/g, '-')}`,
        128,
      ),
    ),
    backgrounds: w20Backgrounds.map((x) =>
      rated('background', x.name, 'background', 0, x.id, x.page),
    ),
    gifts: [],
    rites: [],
    fetishes: [],
    talens: [],
    merits: [],
    flaws: [],
    numina: [],
    otherTraits: [],
    forms: (characterType === 'kinfolk' ? ['Human'] : W20_FORM_NAMES).map((x) =>
      record(x, 'form'),
    ),
    currentFormId: null,
    renown: { glory: 0, honor: 0, wisdom: 0, otherName: '', other: 0, rank: 1 },
    rage: {
      permanent: characterType === 'kinfolk' ? 0 : 1,
      current: characterType === 'kinfolk' ? 0 : 1,
    },
    gnosis: {
      permanent: characterType === 'kinfolk' ? 0 : 1,
      current: characterType === 'kinfolk' ? 0 : 1,
    },
    willpower: {
      permanent: characterType === 'kinfolk' ? 3 : 1,
      current: characterType === 'kinfolk' ? 3 : 1,
    },
    states: {
      frenzy: false,
      foxFrenzy: false,
      harano: 0,
      hauglosk: 0,
      temporaryEffects: '',
    },
    health: [],
    battleScars: [],
    pack: {
      role: '',
      members: [],
      relationships: [],
      pooledBackgrounds: [],
      totemNotes: '',
      obligations: '',
    },
    possessions: [],
    weapons: [],
    armor: [],
    experienceLedger: [],
    rollHistory: [],
    sessionNotes: '',
  };
}
