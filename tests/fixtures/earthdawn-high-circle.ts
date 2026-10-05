import {
  earthdawnKnacks,
  earthdawnSpells,
} from '../../src/games/earthdawn4e/catalog';
import { createBlankEarthdawn4eCharacter } from '../../src/games/earthdawn4e/create-character';
import { matrixDeathRating } from '../../src/games/earthdawn4e/rules';
import type { Earthdawn4eCharacter } from '../../src/games/earthdawn4e/schema';

let sequence = 1;
const uuid = () =>
  `00000000-0000-4000-8000-${String(sequence++).padStart(12, '0')}`;

export function createHighCircleMatrixFixture(): Earthdawn4eCharacter {
  sequence = 1;
  const character = createBlankEarthdawn4eCharacter({
    status: 'finalized',
    mode: 'edit',
  });
  character.identity.name = 'Matrix Verification Adept';
  character.disciplines = ['Illusionist', 'Nethermancer', 'Shaman'].map(
    (name) => ({
      id: uuid(),
      definitionId: null,
      sourceId: 'ed4.players-guide',
      source: 'Earthdawn Fourth Edition Player’s Guide',
      page: null,
      unresolved: false,
      disciplineId: name.toLowerCase(),
      name,
      circle: 15,
      startedAtCircle: 1,
      questor: false,
      custom: false,
    }),
  );
  character.talents = ['Patterncraft', 'Messenger'].map((name, index) => ({
    id: uuid(),
    definitionId: null,
    sourceId: 'ed4.players-guide',
    source: 'Earthdawn Fourth Edition Player’s Guide',
    page: null,
    unresolved: false,
    name,
    rank: index ? 3 : 10,
    freeRank: 0,
    bonus: 0,
    attribute: 'perception',
    action: '',
    strain: 0,
    attributeText: 'Perception',
    effectText: '',
    descriptionText: '',
    actionText: '',
    strainText: '',
    citationText: '',
    metadataOverrides: [],
    disciplineSources: [character.disciplines[0]!.id],
    optional: false,
    originCircle: 1,
    originDisciplineId: character.disciplines[0]!.id,
    creationOwned: false,
    notes: '',
  }));
  for (const knackName of ['Squeeze Switch', 'Squeeze True Switch']) {
    const definition = earthdawnKnacks.find(({ name }) => name === knackName)!;
    const variant = definition.knackMetadata!.variants[0]!;
    character.knacks.push({
      id: uuid(),
      definitionId: definition.id,
      sourceId: variant.sourceId,
      source: definition.source,
      page: variant.page,
      unresolved: false,
      name: definition.name,
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
      minimumRankKnown: true,
      knackCircle: variant.knackCircle ?? null,
      discipline: variant.discipline ?? '',
      disciplineCircle: variant.disciplineCircle ?? null,
      requiredSpells: [...(variant.requiredSpells ?? [])],
      requiredTalentRanks: [...(variant.requiredTalentRanks ?? [])],
      bloodMagicDamage: variant.bloodMagicDamage ?? 0,
      matrixRestriction: variant.matrixRestriction ?? null,
    });
  }

  const addSpell = (name: string, formKey?: string, formLabel?: string) => {
    const definition = earthdawnSpells.find(({ name: item }) => item === name)!;
    const variant = definition.spellMetadata!.variants[0]!;
    const spell = {
      id: uuid(),
      definitionId: definition.id,
      sourceId: variant.sourceId,
      source: definition.source,
      page: variant.pageStart,
      unresolved: false,
      name,
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
      variantKey: `${variant.sourceId}|${variant.discipline}|${variant.circleMin}|${formKey ?? ''}`,
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
      formKey: formKey ?? null,
      formLabel: formLabel ?? null,
    };
    character.magic.spells.push(spell);
    return spell;
  };
  const switchSpell = addSpell('Switch');
  const trueSwitch = addSpell('True Switch');
  const formExchange = addSpell('Form Exchange');
  const fogAspect = addSpell('Aspect of the Fog Ghost');
  const fogSummon = addSpell('Summon Fog Ghost');
  const shadowAspect = addSpell('Aspect of the Shadow Hunter');
  const shadowSummon = addSpell('Summon Shadow Hunter');
  const otterSwim = addSpell('Otter Swim');
  const gills = addSpell('Gills');
  const legacyResist = addSpell('Resist Element');
  addSpell('Resist Element', 'air', 'Air');
  addSpell('Resist Element', 'fire', 'Fire');

  const matrix = (
    name: string,
    type: Earthdawn4eCharacter['magic']['matrices'][number]['type'],
    spellIds: string[],
    divided = false,
  ) => ({
    id: uuid(),
    name,
    type,
    source: '',
    rank: 15,
    spellId: spellIds[0] ?? null,
    spellIds,
    prewovenThreads: 0,
    damage: 0,
    deathRating: matrixDeathRating(type),
    active: true,
    temporaryUntil: '',
    restriction: '',
    reattuning: { inProgress: false, difficulty: 0, strainPaid: 0 },
    used: false,
    notes: '',
    originType: type === 'object' ? ('item' as const) : ('custom' as const),
    talentId: null,
    divided,
  });
  character.magic.matrices = [
    matrix('Squeezed Switch Matrix', 'standard', [
      switchSpell.id,
      trueSwitch.id,
      formExchange.id,
    ]),
    matrix('Mixed Shared Matrix', 'shared', [
      fogAspect.id,
      fogSummon.id,
      shadowAspect.id,
      shadowSummon.id,
      otterSwim.id,
      gills.id,
      legacyResist.id,
    ]),
    matrix('External Matrix', 'object', []),
    matrix('Divided Matrix', 'standard', [], true),
  ];
  return character;
}
