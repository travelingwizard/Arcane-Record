import {
  TORCHBEARER_CORE_SOURCE,
  TORCHBEARER_CORE_SOURCE_ID,
  humanUpbringingSkillIds,
  socialGraceSkillIds,
  specialtySkillIds,
  torchbearerClasses,
  torchbearerGear,
  torchbearerHomes,
  torchbearerNatureAnswers,
  torchbearerReferenceById,
  torchbearerSkills,
  torchbearerStartingMagicSchools,
  torchbearerStartingRelicResults,
  torchbearerTraits,
  type TorchbearerClassDefinition,
  type TorchbearerStockId,
} from './catalog';
import type {
  Torchbearer2eCharacter,
  TorchbearerCreationState,
} from './schema';

export interface TorchbearerCreationIssue {
  code: string;
  step: number;
  severity: 'error' | 'warning';
  message: string;
  sourcePage: number;
}

export interface TorchbearerCreationPreview {
  classDefinition: TorchbearerClassDefinition | null;
  stockId: TorchbearerStockId | null;
  will: number;
  health: number;
  nature: number;
  natureDescriptors: [string, string, string];
  resources: number;
  circles: number;
  skillRatings: Record<string, number>;
  traitLevels: Record<string, number>;
  wiseNames: string[];
  issues: TorchbearerCreationIssue[];
  blockingIssues: TorchbearerCreationIssue[];
  completedSteps: boolean[];
}

const stockNatureDescriptors: Record<
  TorchbearerStockId,
  [string, string, string]
> = {
  human: ['Boasting', 'Demanding', 'Running'],
  elf: ['Singing', 'Remembering', 'Hiding'],
  dwarf: ['Delving', 'Crafting', 'Avenging Grudges'],
  halfling: ['Sneaking', 'Riddling', 'Merrymaking'],
};

const issue = (
  code: string,
  step: number,
  message: string,
  sourcePage: number,
  severity: TorchbearerCreationIssue['severity'] = 'error',
): TorchbearerCreationIssue => ({
  code,
  step,
  severity,
  message,
  sourcePage,
});

function addSkill(
  ratings: Record<string, number>,
  definitionId: string | null,
  openingRating = 2,
) {
  if (!definitionId) return;
  ratings[definitionId] = ratings[definitionId]
    ? Math.min(4, ratings[definitionId] + 1)
    : openingRating;
}

function selectedNatureAnswers(creation: TorchbearerCreationState) {
  return creation.natureAnswerIds
    .map((id) => torchbearerNatureAnswers.find((answer) => answer.id === id))
    .filter((answer) => answer !== undefined);
}

export function calculateTorchbearerCreation(
  character: Torchbearer2eCharacter,
): TorchbearerCreationPreview {
  const creation = character.creation;
  const classDefinition =
    torchbearerClasses.find((entry) => entry.classId === creation.classId) ??
    null;
  const stockId = classDefinition?.stockId ?? null;
  const issues: TorchbearerCreationIssue[] = [];
  const skillRatings: Record<string, number> = {
    ...(classDefinition?.skillRatings ?? {}),
  };
  const traitLevels: Record<string, number> = {};
  const wiseNames = [...creation.wiseNames.filter((name) => name.trim())];

  if (!classDefinition) {
    issues.push(
      issue('class-required', 0, 'Choose one of the six core classes.', 26),
    );
  } else {
    traitLevels[classDefinition.traitId] = 1;
  }

  const will = classDefinition?.fixedWill ?? creation.will;
  const health = classDefinition?.fixedHealth ?? creation.health;
  if (classDefinition?.stockId === 'human') {
    if (
      will + health !== 8 ||
      will < 2 ||
      health < 2 ||
      will > 6 ||
      health > 6
    ) {
      issues.push(
        issue(
          'human-ability-allocation',
          1,
          'Human Will and Health must total 8, with each rating between 2 and 6.',
          28,
        ),
      );
    }
    if (!creation.upbringingSkillId) {
      issues.push(
        issue('upbringing-required', 1, 'Choose a human upbringing Skill.', 29),
      );
    } else if (!humanUpbringingSkillIds.includes(creation.upbringingSkillId)) {
      issues.push(
        issue(
          'upbringing-invalid',
          1,
          'That Skill is not a core upbringing option.',
          29,
        ),
      );
    } else {
      addSkill(skillRatings, creation.upbringingSkillId, 3);
    }
  }

  const home = torchbearerHomes.find((entry) => entry.id === creation.homeId);
  if (!home) {
    issues.push(issue('home-required', 2, 'Choose a home settlement.', 30));
  } else if (stockId && !home.allowedStocks.includes(stockId)) {
    issues.push(
      issue(
        'home-stock',
        2,
        `${home.name} is not available to ${stockId} characters.`,
        30,
      ),
    );
  } else {
    if (
      !creation.homeSkillId ||
      !home.skillIds.includes(creation.homeSkillId)
    ) {
      issues.push(
        issue(
          'home-skill',
          2,
          'Choose one Skill offered by the selected home.',
          30,
        ),
      );
    } else {
      addSkill(skillRatings, creation.homeSkillId);
    }
    if (
      !creation.homeTraitId ||
      !home.traitIds.includes(creation.homeTraitId)
    ) {
      issues.push(
        issue(
          'home-trait',
          2,
          'Choose one Trait offered by the selected home.',
          30,
        ),
      );
    } else {
      traitLevels[creation.homeTraitId] = Math.min(
        3,
        (traitLevels[creation.homeTraitId] ?? 0) + 1,
      );
    }
  }

  if (!creation.socialSkillId) {
    issues.push(
      issue('social-grace-required', 3, 'Choose a social grace Skill.', 31),
    );
  } else if (!socialGraceSkillIds.includes(creation.socialSkillId)) {
    issues.push(
      issue(
        'social-grace-invalid',
        3,
        'That Skill is not a social grace option.',
        31,
      ),
    );
  } else {
    addSkill(skillRatings, creation.socialSkillId);
  }

  if (!creation.specialtySkillId) {
    issues.push(
      issue(
        'specialty-required',
        4,
        'Choose an adventuring specialty Skill.',
        31,
      ),
    );
  } else if (!specialtySkillIds.includes(creation.specialtySkillId)) {
    issues.push(
      issue(
        'specialty-invalid',
        4,
        'That Skill is not a core specialty option.',
        31,
      ),
    );
  } else {
    addSkill(skillRatings, creation.specialtySkillId);
  }

  const stockWiseOptions: Partial<Record<TorchbearerStockId, string[]>> = {
    dwarf: ['Dwarven Chronicles-wise', 'Shrewd Appraisal-wise'],
    elf: ['Elven Lore-wise', 'Folly of Humanity-wise', 'Folly of Dwarves-wise'],
    halfling: ['Home-wise', 'Needs a Little Salt-wise'],
  };
  const requiredWiseCount = stockId === 'human' ? 1 : stockId ? 2 : 1;
  if (wiseNames.length < requiredWiseCount) {
    issues.push(
      issue(
        'wise-required',
        5,
        `${stockId ?? 'This stock'} begins with ${requiredWiseCount} Wise${requiredWiseCount === 1 ? '' : 's'}.`,
        31,
      ),
    );
  }
  const requiredStockWises = stockId ? stockWiseOptions[stockId] : undefined;
  if (
    requiredStockWises &&
    !wiseNames.some((name) => requiredStockWises.includes(name))
  ) {
    issues.push(
      issue(
        'stock-wise-required',
        5,
        `Choose one stock Wise: ${requiredStockWises.join(' or ')}.`,
        31,
      ),
    );
  }

  const answers = selectedNatureAnswers(creation);
  if (stockId) {
    for (let question = 1; question <= 3; question += 1) {
      const count = answers.filter(
        (answer) => answer.stockId === stockId && answer.question === question,
      ).length;
      if (count !== 1) {
        issues.push(
          issue(
            `nature-question-${question}`,
            6,
            `Choose exactly one answer for Nature question ${question}.`,
            stockId === 'dwarf'
              ? 33
              : stockId === 'elf'
                ? 34
                : stockId === 'halfling'
                  ? 35
                  : 36,
          ),
        );
      }
    }
  }
  let nature = 3;
  let natureResources = 0;
  const natureDescriptors: [string, string, string] = stockId
    ? [...stockNatureDescriptors[stockId]]
    : ['', '', ''];
  for (const answer of answers) {
    if (answer.stockId !== stockId) {
      issues.push(
        issue(
          'nature-stock',
          6,
          'A selected Nature answer belongs to another stock.',
          answer.page,
        ),
      );
      continue;
    }
    nature += answer.natureDelta;
    natureResources = Math.max(natureResources, answer.resourcesMinimum);
    if (answer.descriptorReplacement) {
      const [from, to] = answer.descriptorReplacement;
      const index = natureDescriptors.indexOf(from);
      if (index >= 0) natureDescriptors[index] = to;
    }
    if (answer.classTraitLevel2 && classDefinition) {
      traitLevels[classDefinition.traitId] = Math.max(
        2,
        traitLevels[classDefinition.traitId] ?? 0,
      );
    }
    if (answer.replacementHomeTraitId && creation.homeTraitId) {
      if (answer.replacementHomeTraitId === creation.homeTraitId) {
        traitLevels[creation.homeTraitId] = Math.min(
          3,
          (traitLevels[creation.homeTraitId] ?? 1) + 1,
        );
      } else {
        delete traitLevels[creation.homeTraitId];
        traitLevels[answer.replacementHomeTraitId] = Math.max(
          1,
          traitLevels[answer.replacementHomeTraitId] ?? 0,
        );
      }
    }
    if (answer.grantedWise && !wiseNames.includes(answer.grantedWise)) {
      wiseNames.push(answer.grantedWise);
    }
  }
  nature = Math.min(7, nature);

  const relationshipCount = Object.entries(creation.relationshipChoices).filter(
    ([key, selected]) => key !== 'loner' && selected,
  ).length;
  if (creation.relationshipChoices.loner) {
    if (relationshipCount > 0) {
      issues.push(
        issue(
          'loner-exclusive',
          7,
          'The loner path replaces friend, parents, mentor, and enemy choices.',
          39,
        ),
      );
    }
    const lonerTraitId = `tb2.core.trait.loner`;
    traitLevels[lonerTraitId] = Math.max(1, traitLevels[lonerTraitId] ?? 0);
    if (!character.identity.enemy.trim()) {
      issues.push(
        issue('loner-enemy', 7, 'The loner path requires a named enemy.', 36),
      );
    }
    if (classDefinition?.requiresMentor) {
      issues.push(
        issue(
          'magician-loner',
          7,
          'A magician must select a mentor and therefore cannot take the loner path.',
          37,
        ),
      );
    }
  } else {
    if (!creation.relationshipChoices.friend) {
      issues.push(
        issue(
          'friend-or-loner',
          7,
          'Choose a friend or take the loner path.',
          36,
        ),
      );
    }
    if (relationshipCount > 3) {
      issues.push(
        issue(
          'relationship-limit',
          7,
          'Choose at most three of friend, parents, mentor, and enemy.',
          36,
        ),
      );
    }
    if (
      classDefinition?.requiresMentor &&
      !creation.relationshipChoices.mentor
    ) {
      issues.push(
        issue(
          'magician-mentor',
          7,
          'A first-level magician must choose a mentor.',
          37,
        ),
      );
    }
  }
  for (const key of ['friend', 'parents', 'mentor', 'enemy'] as const) {
    if (
      !creation.relationshipChoices.loner &&
      creation.relationshipChoices[key] &&
      !character.identity[key].trim()
    ) {
      issues.push(
        issue(
          `relationship-name-${key}`,
          7,
          `Name the selected ${key} relationship.`,
          39,
        ),
      );
    }
  }
  const circles = creation.relationshipChoices.loner
    ? 1
    : Math.min(4, 1 + relationshipCount);

  const resources = natureResources;
  if (creation.resources !== 0) {
    issues.push(
      issue(
        'resources-fixed',
        8,
        'First-level characters start with Resources 0 unless a Nature answer sets it to 1.',
        38,
      ),
    );
  }

  const primaryContainerIds = [
    'tb2.core.gear.backpack',
    'tb2.core.gear.satchel',
  ];
  const selectedPrimaryContainers = creation.containerDefinitionIds.filter(
    (id) => primaryContainerIds.includes(id),
  );
  if (selectedPrimaryContainers.length !== 1) {
    issues.push(
      issue(
        'container-required',
        9,
        'Choose exactly one primary container: a satchel or a backpack.',
        38,
      ),
    );
  }
  const invalidGear = [
    ...creation.containerDefinitionIds,
    ...creation.gearDefinitionIds,
  ].filter((id) => !torchbearerGear.some((entry) => entry.id === id));
  if (invalidGear.length > 0) {
    issues.push(
      issue(
        'gear-invalid',
        9,
        'One or more selected gear definitions are unavailable.',
        40,
      ),
    );
  }
  const containerCapacity = creation.containerDefinitionIds.reduce(
    (total, id) =>
      total +
      (torchbearerGear.find((definition) => definition.id === id)?.capacity ??
        0),
    0,
  );
  const packedSlots = creation.gearDefinitionIds.reduce(
    (total, id) => total + slotCount(id),
    0,
  );
  if (packedSlots > containerCapacity) {
    issues.push(
      issue(
        'inventory-capacity',
        9,
        `Selected gear needs ${packedSlots} slots, but the selected containers hold ${containerCapacity}.`,
        40,
      ),
    );
  }

  if (!creation.weaponDefinitionId) {
    issues.push(issue('weapon-required', 10, 'Choose a starting weapon.', 41));
  } else if (
    !classDefinition?.allowedWeaponIds.includes(creation.weaponDefinitionId)
  ) {
    issues.push(
      issue(
        'weapon-class',
        10,
        'That weapon is not allowed for the selected class.',
        41,
      ),
    );
  }
  if (creation.takeShield && !classDefinition?.mayTakeShield) {
    issues.push(
      issue(
        'shield-class',
        10,
        'The selected class may not begin with a shield.',
        41,
      ),
    );
  }
  if (creation.takeHelmet && !classDefinition?.mayTakeHelmet) {
    issues.push(
      issue(
        'helmet-class',
        10,
        'The selected class may not begin with a helmet.',
        41,
      ),
    );
  }
  if (creation.takeHelmet && creation.takeShield) {
    issues.push(
      issue(
        'helmet-shield-exclusive',
        10,
        'Outcasts and warriors may take a helmet only when they do not take an additional shield.',
        40,
      ),
    );
  }
  const expectedArmorId = classDefinition?.startingArmorId ?? null;
  if (creation.armorDefinitionId !== expectedArmorId) {
    issues.push(
      issue(
        'starting-armor',
        10,
        expectedArmorId
          ? 'This class begins in leather armor.'
          : 'This class does not begin with armor.',
        40,
      ),
    );
  }

  if (classDefinition?.classId === 'magician') {
    if (creation.magic.selectedDefinitionIds.length !== 3) {
      issues.push(
        issue(
          'magician-spells',
          11,
          'A magician begins with exactly three spells from one starting school result.',
          43,
        ),
      );
    }
    if (creation.magic.method === 'none') {
      issues.push(
        issue(
          'magician-magic-method',
          11,
          'Roll or manually choose a starting spell school.',
          43,
        ),
      );
    }
    const school = torchbearerStartingMagicSchools.find(
      ({ id }) => id === creation.magic.selectedResultId,
    );
    if (
      !school ||
      school.id === 'choose' ||
      school.spellIds.some(
        (id) => !creation.magic.selectedDefinitionIds.includes(id),
      )
    ) {
      issues.push(
        issue(
          'magician-school-selection',
          11,
          'Select all three spells from one starting school.',
          41,
        ),
      );
    }
  } else if (classDefinition?.classId === 'theurge') {
    if (creation.magic.selectedDefinitionIds.length !== 2) {
      issues.push(
        issue(
          'theurge-relics',
          11,
          'A theurge begins with the two relics tied to one starting result.',
          42,
        ),
      );
    }
    if (creation.magic.method === 'none') {
      issues.push(
        issue(
          'theurge-magic-method',
          11,
          'Roll or manually choose a starting relic result.',
          42,
        ),
      );
    }
    const relicResult = torchbearerStartingRelicResults.find(
      ({ id }) => id === creation.magic.selectedResultId,
    );
    if (
      !relicResult ||
      magicSelectionIds('theurge', relicResult.id).some(
        (id) => !creation.magic.selectedDefinitionIds.includes(id),
      )
    ) {
      issues.push(
        issue(
          'theurge-relic-selection',
          11,
          'Select the paired relics from one starting result.',
          42,
        ),
      );
    }
  }

  if (!character.identity.name.trim()) {
    issues.push(issue('name-required', 12, 'Give the character a name.', 44));
  }
  if (!character.identity.age.trim()) {
    issues.push(issue('age-required', 12, 'Record the character’s age.', 44));
  } else if (stockId) {
    const age = Number.parseInt(character.identity.age, 10);
    const ageRanges: Record<TorchbearerStockId, [number, number]> = {
      dwarf: [30, 51],
      elf: [60, 101],
      halfling: [26, 31],
      human: [14, 21],
    };
    const [minimum, maximum] = ageRanges[stockId];
    if (!Number.isInteger(age) || age < minimum || age > maximum) {
      issues.push(
        issue(
          'age-range',
          12,
          `${stockId} characters begin between ages ${minimum} and ${maximum}.`,
          47,
        ),
      );
    }
  }
  if (!character.identity.raiment.trim()) {
    issues.push(
      issue('raiment-required', 12, 'Describe the character’s raiment.', 44),
    );
  }
  if (!character.drives.belief.trim()) {
    issues.push(issue('belief-required', 12, 'Write a Belief.', 45));
  }
  if (!character.drives.instinct.trim()) {
    issues.push(issue('instinct-required', 12, 'Write an Instinct.', 46));
  }
  if (character.drives.creed.trim()) {
    issues.push(
      issue(
        'creed-first-level',
        12,
        'Creed is not selected during first-level creation; it remains available on the normal sheet.',
        47,
        'warning',
      ),
    );
  }

  const overriddenCodes = new Set(creation.overrides.map(({ code }) => code));
  const blockingIssues = creation.enforceRules
    ? issues.filter(
        (entry) =>
          entry.severity === 'error' && !overriddenCodes.has(entry.code),
      )
    : [];
  const completedSteps = Array.from({ length: 14 }, (_, step) =>
    issues.every(
      (entry) =>
        entry.step !== step ||
        entry.severity === 'warning' ||
        overriddenCodes.has(entry.code) ||
        !creation.enforceRules,
    ),
  );

  return {
    classDefinition,
    stockId,
    will,
    health,
    nature,
    natureDescriptors,
    resources,
    circles,
    skillRatings,
    traitLevels,
    wiseNames,
    issues,
    blockingIssues,
    completedSteps,
  };
}

export interface TorchbearerRebuildDiff {
  added: string[];
  removed: string[];
  changed: string[];
}

function creationSource(page: number) {
  return {
    sourceId: TORCHBEARER_CORE_SOURCE_ID,
    source: TORCHBEARER_CORE_SOURCE,
    page,
  };
}

const creationOrigin = (choiceId: string) => ({
  type: 'creation' as const,
  choiceId,
});

function slotCount(definitionId: string) {
  const definition = torchbearerGear.find((entry) => entry.id === definitionId);
  if (!definition) return 1;
  const match = definition.slotText.match(
    /(?:pack|carried|torso|belt)\s+(\d+)/i,
  );
  return match ? Number(match[1]) : 1;
}

function buildFinalizedCharacter(
  character: Torchbearer2eCharacter,
  now: string,
): Torchbearer2eCharacter {
  const preview = calculateTorchbearerCreation(character);
  if (!preview.classDefinition) return character;
  const creatorOwnedIds = new Set(
    character.creation.baseline?.creatorRecordIds ??
      [
        ...character.skills,
        ...character.traits,
        ...character.wises,
        ...character.inventory,
        ...character.magic.spells,
        ...character.magic.relics,
      ]
        .filter(({ origin }) => origin.type === 'creation')
        .map(({ id }) => id),
  );
  const manualSkills = character.skills.filter(
    ({ id, origin }) => !creatorOwnedIds.has(id) && origin.type !== 'creation',
  );
  const priorSkills = new Map(
    character.skills
      .filter(({ definitionId }) => definitionId)
      .map((record) => [record.definitionId!, record]),
  );
  const skills = torchbearerSkills.map((definition) => {
    const definitionId = definition.id;
    const startingRating = preview.skillRatings[definitionId] ?? 0;
    const prior = priorSkills.get(definitionId);
    const advancementDelta = prior
      ? Math.max(0, prior.rating - prior.startingRating)
      : 0;
    return {
      id: prior?.id ?? crypto.randomUUID(),
      definitionId,
      name: definition.name,
      beginnersLuckRoot: definition.beginnersLuckRoot,
      rating: Math.min(6, startingRating + advancementDelta),
      startingRating,
      passed: prior?.passed ?? 0,
      failed: prior?.failed ?? 0,
      notes: prior?.notes ?? '',
      source: creationSource(definition.page),
      origin: creationOrigin(definitionId),
    };
  });
  const manualTraits = character.traits.filter(
    ({ id, origin }) => !creatorOwnedIds.has(id) && origin.type !== 'creation',
  );
  const priorTraits = new Map(
    character.traits
      .filter(({ definitionId }) => definitionId)
      .map((record) => [record.definitionId!, record]),
  );
  const traits = Object.entries(preview.traitLevels).map(
    ([definitionId, startingLevel]) => {
      const definition = torchbearerTraits.find(
        (entry) => entry.id === definitionId,
      )!;
      const prior = priorTraits.get(definitionId);
      const advancementDelta = prior
        ? Math.max(0, prior.level - prior.startingLevel)
        : 0;
      return {
        id: prior?.id ?? crypto.randomUUID(),
        definitionId,
        name: definition.name,
        level: Math.min(3, startingLevel + advancementDelta),
        startingLevel,
        beneficialUses: prior?.beneficialUses ?? 0,
        checks: prior?.checks ?? 0,
        notes: prior?.notes ?? '',
        source: creationSource(definition.page),
        origin: creationOrigin(definitionId),
      };
    },
  );
  const manualWises = character.wises.filter(
    ({ id, origin }) => !creatorOwnedIds.has(id) && origin.type !== 'creation',
  );
  const wises = preview.wiseNames.map((name) => {
    const prior = character.wises.find(
      (record) => record.origin.type === 'creation' && record.name === name,
    );
    return {
      id: prior?.id ?? crypto.randomUUID(),
      definitionId: `tb2.core.wise.${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      uses: prior?.uses ?? {
        pass: false,
        fail: false,
        fate: false,
        persona: false,
      },
      notes: prior?.notes ?? '',
      source: creationSource(32),
      origin: creationOrigin(`wise:${name}`),
    };
  });
  const classDefinition = preview.classDefinition;
  const selectedItemIds = new Set(
    [
      ...character.creation.containerDefinitionIds,
      ...character.creation.gearDefinitionIds,
      character.creation.weaponDefinitionId,
      character.creation.armorDefinitionId,
      character.creation.takeHelmet ? 'tb2.core.gear.helmet' : null,
      character.creation.takeShield ? 'tb2.core.weapon.shield' : null,
      !character.creation.relationshipChoices.loner &&
      !character.creation.relationshipChoices.parents
        ? 'tb2.core.gear.parents-keepsake'
        : null,
      !character.creation.relationshipChoices.loner &&
      !character.creation.relationshipChoices.mentor
        ? 'tb2.core.gear.pouch-of-gold-coins'
        : null,
      classDefinition.classId === 'magician'
        ? 'tb2.core.gear.spell-book'
        : null,
    ].filter((id): id is string => Boolean(id)),
  );
  const manualInventory = character.inventory.filter(
    ({ id, origin }) => !creatorOwnedIds.has(id) && origin.type !== 'creation',
  );
  const inventory = [...selectedItemIds].map((definitionId) => {
    const definition = torchbearerReferenceById.get(definitionId)!;
    const gearDefinition = torchbearerGear.find(
      (entry) => entry.id === definitionId,
    );
    const prior = character.inventory.find(
      (record) =>
        record.definitionId === definitionId &&
        record.origin.type === 'creation',
    );
    return {
      id: prior?.id ?? crypto.randomUUID(),
      definitionId,
      name: definition.name,
      location:
        prior?.location ??
        (definition.name === 'Helmet'
          ? ('head' as const)
          : definition.name === 'Parents’ Keepsake'
            ? ('neck' as const)
            : definition.name === 'Pouch of Gold Coins'
              ? ('belt' as const)
              : definition.category === 'armor' ||
                  definition.category === 'container'
                ? ('torso' as const)
                : definition.kind === 'weapon'
                  ? ('belt' as const)
                  : ('satchel-backpack' as const)),
      slots: prior?.slots ?? slotCount(definitionId),
      quantity: prior?.quantity ?? gearDefinition?.startingQuantity ?? 1,
      status: prior?.status ?? ('carried' as const),
      damaged: prior?.damaged ?? false,
      weariness: prior?.weariness ?? false,
      notes: prior?.notes ?? '',
      source: creationSource(definition.page),
      origin: creationOrigin(definitionId),
    };
  });

  const selectedMagic = character.creation.magic.selectedDefinitionIds;
  const manualSpells = character.magic.spells.filter(
    ({ id, origin }) => !creatorOwnedIds.has(id) && origin.type !== 'creation',
  );
  const manualRelics = character.magic.relics.filter(
    ({ id, origin }) => !creatorOwnedIds.has(id) && origin.type !== 'creation',
  );
  const spells =
    classDefinition.classId === 'magician'
      ? selectedMagic.map((definitionId) => {
          const definition = torchbearerReferenceById.get(definitionId)!;
          const circle = Number(definition.category.replace(/\D/g, '')) || 1;
          return {
            id: crypto.randomUUID(),
            definitionId,
            name: definition.name,
            obstacle: circle,
            library: false,
            spellBook: true,
            memorized: false,
            cast: false,
            scroll: false,
            supplies: false,
            effect: definition.summary,
            source: creationSource(definition.page),
            origin: creationOrigin(definitionId),
          };
        })
      : [];
  const relics =
    classDefinition.classId === 'theurge'
      ? selectedMagic.map((definitionId) => {
          const [relicName, invocationName = ''] = definitionId.split('::');
          const invocation = [...torchbearerReferenceById.values()].find(
            (entry) =>
              entry.kind === 'invocation' && entry.name === invocationName,
          );
          return {
            id: crypto.randomUUID(),
            definitionId: invocation?.id ?? null,
            name: relicName,
            inventory: relicName,
            invocationName,
            circle: invocation
              ? Number(invocation.category.replace(/\D/g, '')) || 1
              : 1,
            notes: '',
            source: creationSource(invocation?.page ?? 42),
            origin: creationOrigin(definitionId),
          };
        })
      : [];

  const creatorRecordIds = [
    ...skills,
    ...traits,
    ...wises,
    ...inventory,
    ...spells,
    ...relics,
  ].map(({ id }) => id);

  return {
    ...character,
    identity: {
      ...character.identity,
      stock:
        classDefinition.stockId[0]!.toUpperCase() +
        classDefinition.stockId.slice(1),
      class: classDefinition.name,
      home:
        torchbearerHomes.find(({ id }) => id === character.creation.homeId)
          ?.name ?? character.identity.home,
      level: 1,
    },
    drives: { ...character.drives, creed: '' },
    creation: {
      ...character.creation,
      status: 'finalized',
      finalizedAt: now,
      baseline: {
        abilityRatings: {
          will: preview.will,
          health: preview.health,
          nature: preview.nature,
          resources: preview.resources,
          circles: preview.circles,
        },
        skillRatings: preview.skillRatings,
        traitLevels: preview.traitLevels,
        creatorRecordIds,
      },
    },
    abilities: {
      ...character.abilities,
      will: { ...character.abilities.will, rating: preview.will },
      health: { ...character.abilities.health, rating: preview.health },
      nature: {
        ...character.abilities.nature,
        rating: preview.nature,
        current: preview.nature,
        descriptors: preview.natureDescriptors,
      },
      resources: {
        ...character.abilities.resources,
        rating: preview.resources,
      },
      circles: { ...character.abilities.circles, rating: preview.circles },
    },
    skills: [...manualSkills, ...skills],
    traits: [...manualTraits, ...traits],
    wises: [...manualWises, ...wises],
    inventory: [...manualInventory, ...inventory],
    magic: {
      ...character.magic,
      memoryPalace: classDefinition.startingMemoryPalace,
      urdr: classDefinition.startingUrdr,
      spells: [...manualSpells, ...spells],
      relics: [...manualRelics, ...relics],
    },
  };
}

export function previewTorchbearerRebuild(
  character: Torchbearer2eCharacter,
): TorchbearerRebuildDiff {
  const next = buildFinalizedCharacter(character, new Date().toISOString());
  const before = new Map([
    ...character.skills.map(
      (record) => [`Skill: ${record.name}`, record.rating] as const,
    ),
    ...character.traits.map(
      (record) => [`Trait: ${record.name}`, record.level] as const,
    ),
    ...character.inventory.map(
      (record) => [`Item: ${record.name}`, record.quantity] as const,
    ),
  ]);
  const after = new Map([
    ...next.skills.map(
      (record) => [`Skill: ${record.name}`, record.rating] as const,
    ),
    ...next.traits.map(
      (record) => [`Trait: ${record.name}`, record.level] as const,
    ),
    ...next.inventory.map(
      (record) => [`Item: ${record.name}`, record.quantity] as const,
    ),
  ]);
  return {
    added: [...after.keys()].filter((key) => !before.has(key)),
    removed: [...before.keys()].filter((key) => !after.has(key)),
    changed: [...after.keys()].filter(
      (key) => before.has(key) && before.get(key) !== after.get(key),
    ),
  };
}

export function finalizeTorchbearerCreation(
  character: Torchbearer2eCharacter,
  now = new Date().toISOString(),
) {
  const preview = calculateTorchbearerCreation(character);
  if (preview.blockingIssues.length > 0) {
    return { character, preview, finalized: false as const };
  }
  return {
    character: buildFinalizedCharacter(character, now),
    preview,
    finalized: true as const,
  };
}

function secureDie(): number {
  const bucket = new Uint32Array(1);
  const maximum = Math.floor(0x1_0000_0000 / 6) * 6;
  do {
    crypto.getRandomValues(bucket);
  } while (bucket[0]! >= maximum);
  return (bucket[0]! % 6) + 1;
}

export function rollStartingMagic(
  classId: 'magician' | 'theurge',
  die: () => number = secureDie,
) {
  const dice = Array.from({ length: classId === 'magician' ? 2 : 3 }, () =>
    die(),
  );
  const total = dice.reduce((sum, value) => sum + value, 0);
  const table =
    classId === 'magician'
      ? torchbearerStartingMagicSchools
      : torchbearerStartingRelicResults;
  const result = table.find(
    ({ range }) => total >= range[0] && total <= range[1],
  );
  if (!result)
    throw new Error('Starting magic roll did not match a table result.');
  return { dice, total, resultId: result.id };
}

export function magicSelectionIds(
  classId: 'magician' | 'theurge',
  resultId: string,
) {
  if (classId === 'magician') {
    return (
      torchbearerStartingMagicSchools.find(({ id }) => id === resultId)
        ?.spellIds ?? []
    );
  }
  const result = torchbearerStartingRelicResults.find(
    ({ id }) => id === resultId,
  );
  return result
    ? result.relicNames.map(
        (name, index) => `${name}::${result.invocationNames[index]}`,
      )
    : [];
}
