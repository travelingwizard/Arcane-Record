import { describe, expect, it } from 'vitest';
import {
  torchbearerClasses,
  torchbearerHomes,
  torchbearerNatureAnswers,
  torchbearerSkills,
  torchbearerStartingMagicSchools,
  torchbearerStartingRelicResults,
} from '../../src/games/torchbearer2e/catalog';
import { createBlankTorchbearer2eCharacter } from '../../src/games/torchbearer2e/create-character';
import {
  calculateTorchbearerCreation,
  finalizeTorchbearerCreation,
  magicSelectionIds,
  previewTorchbearerRebuild,
  rollStartingMagic,
} from '../../src/games/torchbearer2e/creator';
import type { Torchbearer2eCharacter } from '../../src/games/torchbearer2e/schema';

function completeCharacter(
  classId: Torchbearer2eCharacter['creation']['classId'],
) {
  const character = createBlankTorchbearer2eCharacter();
  const classDefinition = torchbearerClasses.find(
    (entry) => entry.classId === classId,
  )!;
  const home = torchbearerHomes.find(
    ({ id, allowedStocks }) =>
      allowedStocks.includes(classDefinition.stockId) &&
      (!classDefinition.allowedHomeIds ||
        classDefinition.allowedHomeIds.includes(id)),
  )!;
  const natureAnswerIds = [1, 2, 3].map(
    (question) =>
      torchbearerNatureAnswers.find(
        (answer) =>
          answer.stockId === classDefinition.stockId &&
          answer.question === question,
      )!.id,
  );
  character.identity.name = `${classDefinition.name} Test`;
  character.identity.age =
    classDefinition.stockId === 'dwarf'
      ? '40'
      : classDefinition.stockId === 'elf'
        ? '80'
        : classDefinition.stockId === 'halfling'
          ? '28'
          : '18';
  character.identity.friend = 'Karolina';
  character.identity.raiment = 'Travel-stained cloak';
  character.drives.belief = 'No companion is left behind.';
  character.drives.instinct = 'Always check the way out.';
  character.creation = {
    ...character.creation,
    classId,
    classOption:
      classDefinition.classId === 'dreamwalker'
        ? {
            type: 'dreamwalker-skill',
            skillId: Object.keys(classDefinition.skillRatings)[0]!,
          }
        : { type: 'none', skillId: null },
    will:
      classDefinition.fixedWill ??
      (classDefinition.stockId === 'human' ? 4 : 0),
    health:
      classDefinition.fixedHealth ??
      (classDefinition.stockId === 'human' ? 4 : 0),
    upbringingSkillId:
      classDefinition.stockId === 'human' ? 'tb2.core.skill.laborer' : null,
    homeId: home.id,
    homeSkillId: home.skillIds[0]!,
    homeTraitId: home.traitIds[0]!,
    socialSkillId: 'tb2.core.skill.haggler',
    specialtySkillId: 'tb2.core.skill.cook',
    wiseNames: classDefinition.wiseSuggestions
      ? [
          classDefinition.wiseSuggestions[0]!,
          ...(classDefinition.wiseCount === 2 ? ['Dungeons-wise'] : []),
        ]
      : classDefinition.stockId === 'dwarf'
        ? ['Dwarven Chronicles-wise', 'Dungeons-wise']
        : classDefinition.stockId === 'elf'
          ? ['Elven Lore-wise', 'Dungeons-wise']
          : classDefinition.stockId === 'halfling'
            ? ['Home-wise', 'Dungeons-wise']
            : ['Dungeons-wise'],
    natureAnswerIds,
    relationshipChoices: {
      loner: false,
      friend: true,
      parents: classDefinition.requiredParents ?? false,
      mentor: classDefinition.requiresMentor,
      enemy: false,
    },
    resources: classDefinition.startingResources ?? 0,
    containerDefinitionIds: ['tb2.core.gear.backpack'],
    gearDefinitionIds: ['tb2.core.gear.tinderbox'],
    weaponDefinitionId:
      classDefinition.requiredWeaponId ?? classDefinition.allowedWeaponIds[0]!,
    armorDefinitionId: classDefinition.startingArmorId,
    takeHelmet: classDefinition.requiredHelmet ?? false,
  };
  if (classDefinition.requiredParents) character.identity.parents = 'Family';
  if (classDefinition.requiresMentor) character.identity.mentor = 'Old Gannet';
  if (classDefinition.classId === 'magician') {
    const result = torchbearerStartingMagicSchools[0]!;
    character.creation.magic = {
      method: 'manual',
      selectedResultId: result.id,
      selectedDefinitionIds: result.spellIds,
      rollHistory: [],
    };
  } else if (classDefinition.classId === 'theurge') {
    const result = torchbearerStartingRelicResults[0]!;
    character.creation.magic = {
      method: 'manual',
      selectedResultId: result.id,
      selectedDefinitionIds: magicSelectionIds('theurge', result.id),
      rollHistory: [],
    };
  }
  return character;
}

describe('Torchbearer 2e guided creation engine', () => {
  it.each([
    'burglar',
    'magician',
    'outcast',
    'ranger',
    'theurge',
    'warrior',
  ] as const)('finalizes a valid %s character', (classId) => {
    const character = completeCharacter(classId);
    const preview = calculateTorchbearerCreation(character);
    expect(preview.blockingIssues).toEqual([]);
    const result = finalizeTorchbearerCreation(
      character,
      '2026-09-01T12:00:00.000Z',
    );
    expect(result.finalized).toBe(true);
    expect(result.character.creation.status).toBe('finalized');
    expect(result.character.creation.baseline).not.toBeNull();
    expect(result.character.skills).toHaveLength(torchbearerSkills.length);
    expect(result.character.identity.class.toLowerCase()).toBe(classId);
  });

  it.each([
    'bounder',
    'dreamwalker',
    'guide',
    'noble-scion',
    'sorcerer',
    'stoneteller',
  ] as const)(
    'finalizes a valid Scavenger’s Supplement %s character',
    (classId) => {
      const character = completeCharacter(classId);
      const preview = calculateTorchbearerCreation(character);
      expect(preview.blockingIssues).toEqual([]);
      const result = finalizeTorchbearerCreation(character);
      expect(result.finalized).toBe(true);
      expect(result.character.identity.class).toBe(
        preview.classDefinition?.name,
      );
    },
  );

  it('blocks invalid human allocation and a missing magician mentor', () => {
    const character = completeCharacter('magician');
    character.creation.will = 6;
    character.creation.health = 6;
    character.creation.relationshipChoices.mentor = false;
    character.identity.mentor = '';
    const codes = calculateTorchbearerCreation(character).blockingIssues.map(
      ({ code }) => code,
    );
    expect(codes).toContain('human-ability-allocation');
    expect(codes).toContain('magician-mentor');
  });

  it('stacks repeated creation Skills but caps them at rating 4', () => {
    const character = completeCharacter('burglar');
    const busyCrossroads = torchbearerHomes.find(
      ({ name }) => name === 'Busy Crossroads',
    )!;
    character.creation.homeId = busyCrossroads.id;
    character.creation.homeSkillId = 'tb2.core.skill.cook';
    character.creation.homeTraitId = busyCrossroads.traitIds[0]!;
    character.creation.specialtySkillId = 'tb2.core.skill.cook';
    expect(
      calculateTorchbearerCreation(character).skillRatings[
        'tb2.core.skill.cook'
      ],
    ).toBe(4);
  });

  it('enforces settlement restrictions and inventory capacity', () => {
    const character = completeCharacter('warrior');
    const elfhome = torchbearerHomes.find(({ name }) => name === 'Elfhome')!;
    character.creation.homeId = elfhome.id;
    character.creation.homeSkillId = elfhome.skillIds[0]!;
    character.creation.homeTraitId = elfhome.traitIds[0]!;
    character.creation.gearDefinitionIds = Array(8).fill(
      'tb2.core.gear.tinderbox',
    );
    const codes = calculateTorchbearerCreation(character).blockingIssues.map(
      ({ code }) => code,
    );
    expect(codes).toContain('home-stock');
    expect(codes).toContain('inventory-capacity');
  });

  it('applies every stock Nature branch without changing its descriptors', () => {
    for (const classId of [
      'burglar',
      'outcast',
      'ranger',
      'warrior',
    ] as const) {
      const character = completeCharacter(classId);
      const classDefinition = torchbearerClasses.find(
        (entry) => entry.classId === classId,
      )!;
      const secondAnswers = [1, 2, 3].map(
        (question) =>
          torchbearerNatureAnswers.filter(
            (answer) =>
              answer.stockId === classDefinition.stockId &&
              answer.question === question,
          )[1]!.id,
      );
      character.creation.natureAnswerIds = secondAnswers;
      const preview = calculateTorchbearerCreation(character);
      expect(preview.natureDescriptors.every(Boolean)).toBe(true);
      expect(preview.nature).toBeGreaterThanOrEqual(3);
    }
  });

  it('supports the loner flow and records its Trait', () => {
    const character = completeCharacter('warrior');
    character.creation.relationshipChoices = {
      loner: true,
      friend: false,
      parents: false,
      mentor: false,
      enemy: false,
    };
    character.identity.enemy = 'Grimkell';
    const preview = calculateTorchbearerCreation(character);
    expect(preview.circles).toBe(1);
    expect(preview.traitLevels['tb2.core.trait.loner']).toBe(1);
  });

  it('uses injected dice for deterministic and auditable magic rolls', () => {
    const magicianRoll = rollStartingMagic('magician', () => 1);
    expect(magicianRoll).toEqual({
      dice: [1, 1],
      total: 2,
      resultId: 'necromancy',
    });
    const theurgeRoll = rollStartingMagic('theurge', () => 6);
    expect(theurgeRoll.dice).toEqual([6, 6, 6]);
    expect(theurgeRoll.resultId).toBe('fate');
  });

  it('records explicit overrides without hiding validation issues', () => {
    const character = completeCharacter('magician');
    character.creation.weaponDefinitionId = 'tb2.core.weapon.battle-axe';
    let preview = calculateTorchbearerCreation(character);
    expect(
      preview.blockingIssues.some(({ code }) => code === 'weapon-class'),
    ).toBe(true);
    character.creation.overrides.push({
      id: crypto.randomUUID(),
      code: 'weapon-class',
      reason: 'Storyteller campaign exception',
      createdAt: '2026-09-01T12:00:00.000Z',
    });
    preview = calculateTorchbearerCreation(character);
    expect(preview.issues.some(({ code }) => code === 'weapon-class')).toBe(
      true,
    );
    expect(
      preview.blockingIssues.some(({ code }) => code === 'weapon-class'),
    ).toBe(false);
  });

  it('preserves manual records and post-creation advancement during rebuild', () => {
    const first = finalizeTorchbearerCreation(completeCharacter('warrior'));
    expect(first.finalized).toBe(true);
    const character = structuredClone(first.character);
    const fighter = character.skills.find(
      ({ definitionId }) => definitionId === 'tb2.core.skill.fighter',
    )!;
    fighter.rating += 1;
    character.traits.push({
      id: crypto.randomUUID(),
      definitionId: null,
      name: 'Campaign Gift',
      level: 1,
      startingLevel: 0,
      beneficialUses: 0,
      checks: 0,
      notes: '',
      source: null,
      origin: { type: 'manual', choiceId: null },
    });
    character.creation.status = 'draft';
    const diff = previewTorchbearerRebuild(character);
    expect(diff).toHaveProperty('added');
    const rebuilt = finalizeTorchbearerCreation(character);
    expect(rebuilt.finalized).toBe(true);
    expect(
      rebuilt.character.skills.find(
        ({ definitionId }) => definitionId === 'tb2.core.skill.fighter',
      )!.rating,
    ).toBe(fighter.rating);
    expect(
      rebuilt.character.traits.some(({ name }) => name === 'Campaign Gift'),
    ).toBe(true);
  });
});
