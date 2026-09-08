import { readSourceDefaults } from '../shared/catalog-sources';
import { wr20Arcanoi, wr20Backgrounds } from './catalog';
import { WR20_SCHEMA_VERSION, WR20_SHADOW_SCHEMA_VERSION } from './definitions';
import { WR20_ABILITIES, WR20_ATTRIBUTES } from './rules';
import {
  wr20DefaultLayout,
  type Wr20Character,
  type Wr20Shadow,
  type Wr20Trait,
} from './schema';
import { wr20Sources } from './sources';
const trait = (
  name: string,
  category: string,
  rating: number,
  definitionId: string | null,
  sourceId = 'wr20.core',
  page: number | null = 111,
): Wr20Trait => ({
  id: crypto.randomUUID(),
  definitionId,
  name,
  category,
  rating,
  notes: '',
  sourceId,
  page,
  origin: 'creator',
});
export function createWr20Character(options?: {
  characterType?: Wr20Character['characterType'];
  status?: Wr20Character['creation']['status'];
  mode?: Wr20Character['mode'];
}): Wr20Character {
  const characterType = options?.characterType ?? 'wraith';
  const defaults =
    typeof localStorage === 'undefined'
      ? ['wr20.core']
      : readSourceDefaults('wraith20', wr20Sources);
  const required =
    characterType === 'medium'
      ? ['wr20.mediums']
      : characterType === 'spectre'
        ? ['wr20.book-of-oblivion']
        : [];
  return {
    schemaVersion: WR20_SCHEMA_VERSION,
    characterType,
    name: '',
    player: '',
    chronicle: '',
    concept: '',
    nature: '',
    demeanor: '',
    life: '',
    death: '',
    regret: '',
    appearance: '',
    history: '',
    notes: '',
    mode: options?.mode ?? 'build',
    layout: structuredClone(wr20DefaultLayout),
    enabledSources: [...new Set([...defaults, ...required])],
    showUnavailableSources: false,
    creation: {
      status: options?.status ?? 'draft',
      step: 1,
      attributePriorities: ['physical', 'social', 'mental'],
      abilityPriorities: ['talents', 'skills', 'knowledges'],
      freebieSpent: 0,
      shadowFreebieAdjustment: 0,
      matureContent: false,
      storytellerApproved: false,
      approvalReason: '',
      finalizedAt: null,
      baseline: null,
      rebuildDraft: null,
    },
    attributes: WR20_ATTRIBUTES.map((name, i) =>
      trait(
        name,
        i < 3 ? 'physical' : i < 6 ? 'social' : 'mental',
        1,
        `wr20.core.attribute.${name.toLowerCase()}`,
      ),
    ),
    abilities: WR20_ABILITIES.map((name, i) =>
      trait(
        name,
        i < 10 ? 'talents' : i < 20 ? 'skills' : 'knowledges',
        0,
        `wr20.core.ability.${name.toLowerCase().replaceAll(' ', '-')}`,
        'wr20.core',
        126,
      ),
    ),
    backgrounds: wr20Backgrounds.map((x) =>
      trait(x.name, 'background', 0, x.id, x.sourceId, x.page),
    ),
    arcanoi: wr20Arcanoi.map((x) =>
      trait(x.name, 'arcanos', 0, x.id, x.sourceId, x.page),
    ),
    passions: [],
    fetters: [],
    merits: [],
    flaws: [],
    corpus: { maximum: 10, current: 10, damage: [] },
    pathos: { maximum: 5, current: 5 },
    willpower: { permanent: 5, current: 5 },
    shadow: { kind: 'none' },
    risen: {
      active: false,
      sourceEnabled: false,
      bodyCondition: '',
      overridingBehavior: '',
      notes: '',
    },
    circleName: '',
    faction: '',
    guild: '',
    legion: '',
    haunts: [],
    possessions: [],
    conditions: [],
    temporaryEffects: '',
    experienceLedger: [],
    rollHistory: [],
    sessionNotes: '',
  };
}
export function createWr20Shadow(): Wr20Shadow {
  return {
    schemaVersion: WR20_SHADOW_SCHEMA_VERSION,
    name: '',
    psycheCharacterId: null,
    psycheName: '',
    shadowguidePlayer: '',
    archetype: '',
    mode: 'build',
    layout: {
      build: ['shadow', 'play', 'advancement', 'records'],
      play: ['play', 'shadow', 'advancement', 'records'],
    },
    permanentAngst: 1,
    temporaryAngst: 1,
    darkPassions: [],
    thorns: [],
    catharsisActive: false,
    catharsisHistory: [],
    harrowingNotes: '',
    boundaries: '',
    notes: '',
    experienceLedger: [],
  };
}
