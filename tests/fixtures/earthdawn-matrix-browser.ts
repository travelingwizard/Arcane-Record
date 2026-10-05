import {
  earthdawnKnacks,
  earthdawnSpells,
} from '../../src/games/earthdawn4e/catalog';
import {
  matrixSharingRules,
  spellFormOptions,
} from '../../src/games/earthdawn4e/matrix-sharing';
import { matrixDeathRating } from '../../src/games/earthdawn4e/rules';
import type { Earthdawn4eCharacter } from '../../src/games/earthdawn4e/schema';
import { createHighCircleMatrixFixture } from './earthdawn-high-circle';

const normalize = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLocaleLowerCase();

const catalogNameForMember: Record<string, string> = {
  'flash flame': 'Flame Flash',
  missiles: 'Illusory Missiles',
};

export type MatrixBrowserCase = {
  id: string;
  spellName: string | null;
  members: readonly string[];
  forms: readonly (readonly [string, string])[];
  requiredKnacks: readonly string[];
  bloodMagicDamage: number;
};

export const matrixBrowserCases: readonly MatrixBrowserCase[] = [
  ...matrixSharingRules.map((rule) => ({
    id: rule.id,
    spellName: null,
    members: rule.members,
    forms: [],
    requiredKnacks: rule.requiredKnacks ?? [],
    bloodMagicDamage:
      rule.kind === 'squeeze' ? (rule.bloodMagicDamage ?? 0) : 0,
  })),
  ...Object.entries(spellFormOptions).map(([spellName, forms]) => ({
    id: `forms:${spellName}`,
    spellName,
    members: [],
    forms,
    requiredKnacks: [],
    bloodMagicDamage: 0,
  })),
];

let sequence = 30_000;
const uuid = () =>
  `00000000-0000-4000-8000-${String(sequence++).padStart(12, '0')}`;

const spellDefinition = (name: string) => {
  const catalogName = catalogNameForMember[normalize(name)] ?? name;
  const normalized = normalize(catalogName);
  const definition = earthdawnSpells.find(
    (candidate) =>
      normalize(candidate.name) === normalized ||
      candidate.aliases.some((alias) => normalize(alias) === normalized),
  );
  if (!definition) throw new Error(`Missing spell fixture definition: ${name}`);
  return definition;
};

const knownSpell = (
  name: string,
  form?: readonly [string, string],
): Earthdawn4eCharacter['magic']['spells'][number] => {
  const definition = spellDefinition(name);
  const variant = definition.spellMetadata!.variants[0]!;
  return {
    id: uuid(),
    definitionId: definition.id,
    sourceId: variant.sourceId,
    source: definition.source,
    page: variant.pageStart,
    unresolved: false,
    name: definition.name,
    discipline: variant.discipline,
    circle: variant.circleMin,
    threads: definition.spellMetadata!.threadsValue ?? 0,
    weaving: definition.spellMetadata!.difficultyText,
    casting:
      definition.spellMetadata!.castingText ??
      definition.spellMetadata!.difficultyText,
    range: definition.spellMetadata!.rangeText ?? '',
    duration: definition.spellMetadata!.durationText ?? '',
    effect: definition.spellMetadata!.effectText,
    learned: true,
    notes: '',
    variantKey: `${variant.sourceId}|${variant.discipline}|${variant.circleMin}|${form?.[0] ?? ''}`,
    variantSourceId: variant.sourceId,
    variantPageEnd: variant.pageEnd,
    description: definition.spellMetadata!.description,
    threadsText: definition.spellMetadata!.threadsText,
    difficultyText: definition.spellMetadata!.difficultyText,
    weavingDifficulty: definition.spellMetadata!.weavingDifficulty ?? null,
    reattuningDifficulty:
      definition.spellMetadata!.reattuningDifficulty ?? null,
    castingDifficulty: definition.spellMetadata!.castingDifficulty ?? null,
    area: definition.spellMetadata!.area ?? '',
    keywords: [...(definition.spellMetadata!.keywords ?? [])],
    detailedEffects:
      definition.spellMetadata!.detailedEffects ??
      definition.spellMetadata!.description,
    successLevels: definition.spellMetadata!.successLevels ?? '',
    extraThreads: definition.spellMetadata!.extraThreads ?? '',
    formKey: form?.[0] ?? null,
    formLabel: form?.[1] ?? null,
  };
};

export function createMatrixBrowserFixture() {
  sequence = 30_000;
  const character = createHighCircleMatrixFixture();
  character.identity.name = 'Matrix Browser Coverage';
  character.magic.spells = [];
  character.magic.matrices = [];
  character.knacks = [];
  let expectedBloodMagicDamage = 0;

  const requiredKnacks = new Set(
    matrixBrowserCases.flatMap((testCase) => testCase.requiredKnacks),
  );
  for (const name of requiredKnacks) {
    const definition = earthdawnKnacks.find((knack) => knack.name === name)!;
    const variant = definition.knackMetadata!.variants[0]!;
    character.knacks.push({
      id: uuid(),
      definitionId: definition.id,
      sourceId: variant.sourceId,
      source: definition.source,
      page: variant.page,
      unresolved: false,
      name,
      talentId: character.talents[0]!.id,
      minimumRank: variant.minimumRank ?? 0,
      action: variant.actionText,
      strain: variant.strainValue ?? 0,
      notes: '',
      variantKey: variant.key,
      association: variant.association,
      description: variant.description,
      mechanicsText: variant.mechanicsText,
      actionText: variant.actionText,
      strainText: variant.strainText,
      minimumRankKnown: variant.minimumRank != null,
      knackCircle: variant.knackCircle ?? null,
      discipline: variant.discipline ?? '',
      disciplineCircle: variant.disciplineCircle ?? null,
      requiredSpells: [...(variant.requiredSpells ?? [])],
      requiredTalentRanks: [...(variant.requiredTalentRanks ?? [])],
      bloodMagicDamage: variant.bloodMagicDamage ?? 0,
      matrixRestriction: variant.matrixRestriction ?? null,
    });
  }

  for (const testCase of matrixBrowserCases) {
    const spells = testCase.spellName
      ? testCase.forms.map((form) => knownSpell(testCase.spellName!, form))
      : testCase.members.map((member) => knownSpell(member));
    character.magic.spells.push(...spells);
    character.magic.matrices.push({
      id: uuid(),
      name: `${testCase.id} Matrix`,
      type: 'standard',
      source: '',
      rank: Math.max(...spells.map(({ circle }) => circle)),
      spellId: spells[0]!.id,
      spellIds: [spells[0]!.id],
      prewovenThreads: 0,
      damage: 0,
      deathRating: matrixDeathRating('standard'),
      active: true,
      temporaryUntil: '',
      restriction: '',
      reattuning: { inProgress: false, difficulty: 0, strainPaid: 0 },
      used: false,
      notes: '',
      originType: 'custom',
      talentId: null,
      divided: false,
    });
    expectedBloodMagicDamage +=
      testCase.bloodMagicDamage * Math.max(0, spells.length - 1);
  }

  return { character, expectedBloodMagicDamage };
}
