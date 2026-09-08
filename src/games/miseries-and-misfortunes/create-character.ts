import { abilities, coreSkills, mentalities } from './catalog';
import {
  MM_SCHEMA_VERSION,
  characterGroupIds,
  campaignGroupIds,
} from './definitions';
import { requiredMmSourceIds } from './sources';
import type { MmCharacter, MmCampaign } from './schema';
const rated = (x: {
  id: string;
  name: string;
  sourceId: string;
  page: number;
  summary: string;
}) => ({
  id: crypto.randomUUID(),
  definitionId: x.id,
  name: x.name,
  rating: { numerator: 1 as number, die: '6' as const },
  sourceId: x.sourceId,
  page: x.page,
  notes: x.summary,
});
export function createMmCharacter(
  status: MmCharacter['creation']['status'] = 'draft',
): MmCharacter {
  return {
    schemaVersion: MM_SCHEMA_VERSION,
    name: '',
    player: '',
    pronouns: '',
    appearance: '',
    experiences: '',
    mode: 'build',
    layout: {
      build: [...characterGroupIds],
      play: [
        'fortune',
        'combat',
        'sacred',
        'equipment',
        'skills',
        'mentalities',
        'reputation',
        'advancement',
        'character',
        'birth',
        'abilities',
        'lifepaths',
        'virtues',
        'records',
      ],
    },
    enabledSources: [...requiredMmSourceIds],
    creation: {
      status,
      step: 1,
      startingLevel: 3,
      approvals: [],
      baseline: null,
      rebuildDraft: null,
      finalizedAt: null,
    },
    birth: {
      quality: '',
      incomeSource: '',
      incomeRoll: 0,
      property: '',
      lifestyle: 'Respectable',
      dependents: [],
      debts: '',
      wealth: { numerator: 0, die: '6' },
      obligations: 0,
      assets: 0,
      station: '',
    },
    abilities: Object.fromEntries(abilities.map((x) => [x.name, 9])),
    skills: coreSkills.map(rated),
    mentalities: mentalities.map(rated),
    languages: [],
    lifepaths: [],
    age: 0,
    reputation: 0,
    precedence: 0,
    fortune: 0,
    mortalCoil: 0,
    will: 0,
    hitPoints: { current: 0, maximum: 0 },
    defense: 9,
    dodge: 9,
    morale: 7,
    saves: { terror: 16, poison: 16, magic: 16, fortune: 16 },
    virtues: [],
    flaws: [],
    gnosis: 0,
    practices: [],
    grimoires: [],
    spells: [],
    equipment: [],
    wounds: [],
    advancement: [],
    rollHistory: [],
    history: [],
    notes: '',
    campaign: { kind: 'none' },
  };
}
export function createMmCampaign(): MmCampaign {
  return {
    schemaVersion: MM_SCHEMA_VERSION,
    name: '',
    gm: '',
    year: 1648,
    location: 'France',
    mode: 'build',
    layout: {
      build: [...campaignGroupIds],
      play: [
        'moments',
        'factions',
        'favor',
        'campaign',
        'motif',
        'protagonists',
        'history',
        'records',
      ],
    },
    enabledSources: [...requiredMmSourceIds],
    revision: 0,
    motif: { name: '', purpose: '', values: '' },
    protagonists: [],
    moments: [],
    plots: [],
    factions: [],
    favor: [],
    patrons: [],
    history: [],
    notes: '',
  };
}
