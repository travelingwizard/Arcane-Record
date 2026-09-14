import { abilityCatalog, houseCatalog, virtueFlawCatalog } from './catalog';
import { isCharacterCreationCertified } from './certification';
import {
  characteristicCost,
  creationBudgets,
  houseBenefit,
  olderMagusYearBudget,
  startingAbilityCap,
  startingSpellLimit,
} from './creation-rules';
import { scoreFromExperience } from './experience';
import type { ArsCharacter } from './schema';

export interface ValidationIssue {
  id: string;
  message: string;
  kind: 'error' | 'guidance';
  citation: string;
}
export function validateCharacter(character: ArsCharacter): ValidationIssue[] {
  const c = character.definition;
  const issues: ValidationIssue[] = [];
  const error = (id: string, message: string, citation: string) =>
    issues.push({ id, message, kind: 'error', citation });
  const guidance = (id: string, message: string, citation: string) =>
    issues.push({ id, message, kind: 'guidance', citation });
  if (!c.name.trim())
    error('identity.name', 'Enter a character name.', 'p. 44');
  const characteristicPoints = Object.values(c.characteristics).reduce(
    (sum, n) => sum + characteristicCost(n),
    0,
  );
  if (
    character.creation.status === 'manual'
      ? characteristicPoints > 7
      : characteristicPoints !== 7
  )
    error(
      'characteristics.budget',
      character.creation.status === 'manual'
        ? 'Characteristics exceed the seven-point budget.'
        : `Spend exactly seven Characteristic points; currently ${characteristicPoints}.`,
      'p. 48',
    );
  if (c.role === 'magus' && !houseCatalog.some((h) => h.id === c.houseId))
    error('magus.house', 'Select one of the twelve Houses.', 'pp. 13–24, 46');
  if (c.role !== 'magus' && c.houseId)
    error('role.house', 'Only a Hermetic magus selects a House.', 'p. 45');
  const virtuePoints = c.virtuesFlaws
    .filter((x) => x.kind === 'virtue')
    .reduce((n, x) => n + x.points, 0);
  const flawPoints = c.virtuesFlaws
    .filter((x) => x.kind === 'flaw')
    .reduce((n, x) => n + x.points, 0);
  const budget = creationBudgets(c.role, c.age, c.apprenticeshipAge).flawPoints;
  if (virtuePoints > flawPoints || flawPoints > budget)
    error(
      'virtues.budget',
      `Virtues (${virtuePoints}) must not exceed Flaws (${flawPoints}); Flaws are capped at ${budget}.`,
      'pp. 45, 61–63',
    );
  if (c.role === 'grog' && c.virtuesFlaws.some((x) => x.points > 1))
    error(
      'grog.major',
      'Grogs may take only Minor Virtues and Flaws.',
      'p. 45',
    );
  if (!c.socialStatus.trim())
    error(
      'identity.social-status',
      'Select or record a Social Status.',
      'p. 45',
    );
  for (const selected of c.virtuesFlaws) {
    const definition = selected.definitionId
      ? virtueFlawCatalog.find((entry) => entry.id === selected.definitionId)
      : null;
    if (!definition || selected.status !== 'verified')
      error(
        `virtue-flaw.custom.${selected.id}`,
        `${selected.name || 'This custom entry'} needs a specific Storyguide approval because it is not a verified catalog selection.`,
        'pp. 61–154',
      );
    else {
      if (definition.kind !== selected.kind)
        error(
          `virtue-flaw.kind.${selected.id}`,
          `${selected.name} must remain a ${definition.kind}.`,
          `p. ${definition.printedPage}`,
        );
      if (
        definition.magnitude !== 'variable' &&
        selected.points !== definition.points &&
        selected.points !== 0
      )
        error(
          `virtue-flaw.points.${selected.id}`,
          `${selected.name} has an invalid creation cost.`,
          `p. ${definition.printedPage}`,
        );
      if (
        definition.magnitude === 'variable' &&
        ![1, 3].includes(selected.points)
      )
        error(
          `virtue-flaw.points.${selected.id}`,
          `${selected.name} must be selected as Minor or Major.`,
          `p. ${definition.printedPage}`,
        );
      if (
        c.role === 'grog' &&
        (definition.category === 'story' ||
          definition.category === 'hermetic' ||
          definition.category === 'mythic-companion' ||
          definition.name === 'The Gift')
      )
        error(
          `grog.ineligible.${selected.id}`,
          `${selected.name} is not available to a standard Grog.`,
          'p. 45',
        );
      if (
        c.role === 'companion' &&
        definition.category === 'hermetic' &&
        !c.virtuesFlaws.some((entry) => entry.name === 'The Gift')
      )
        error(
          `companion.ineligible.${selected.id}`,
          `${selected.name} needs the Gift or a specific Storyguide-approved Hermetic framework.`,
          'pp. 45, 62',
        );
      if (c.role === 'magus' && definition.category === 'mythic-companion')
        error(
          `magus.ineligible.${selected.id}`,
          `${selected.name} does not combine with standard Magus creation.`,
          'pp. 45, 62',
        );
    }
  }
  const cap = startingAbilityCap(c.age);
  for (const t of c.traits.filter((t) => t.scale === 'ability')) {
    if (scoreFromExperience(t.experience, 'ability') > cap)
      error(
        `ability.cap.${t.id}`,
        `${t.name} exceeds the starting age cap of ${cap}.`,
        'p. 48',
      );
    if (t.experience > 0 && !t.specialty.trim())
      error(
        `ability.specialty.${t.id}`,
        `${t.name} needs a specialty.`,
        'p. 157',
      );
  }
  if (c.role === 'magus') {
    const score = (id: string) =>
      scoreFromExperience(
        c.traits.find((t) => t.definitionId === `ars.ability.${id}`)
          ?.experience ?? 0,
        'ability',
      );
    for (const [id, name] of [
      ['latin', 'Latin'],
      ['magic-theory', 'Magic Theory'],
      ['parma-magica', 'Parma Magica'],
    ] as const)
      if (score(id) < 1)
        error(`magus.minimum.${id}`, `${name} must be at least 1.`, 'p. 49');
    if (
      score('magic-theory') < 3 ||
      score('latin') < 4 ||
      score('artes-liberales') < 1
    )
      guidance(
        'magus.recommended',
        'The core recommends Latin 4, Magic Theory 3, and Artes Liberales 1 for access to Order books and an effective laboratory.',
        'p. 50',
      );
    const normalizedNames = c.virtuesFlaws.map((entry) =>
      `${entry.name} ${entry.choice}`
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, ' ')
        .trim(),
    );
    if (!normalizedNames.some((name) => name === 'the gift'))
      error('magus.gift', 'Hermetic magi must have The Gift.', 'p. 45');
    if (
      !c.virtuesFlaws.some((selected) => {
        const definition = selected.definitionId
          ? virtueFlawCatalog.find(
              (entry) => entry.id === selected.definitionId,
            )
          : null;
        return selected.kind === 'flaw' && definition?.category === 'hermetic';
      })
    )
      error(
        'magus.hermetic-flaw',
        'A Hermetic magus must select a Hermetic Flaw.',
        'p. 45',
      );
    if (c.houseId) {
      const benefit = houseBenefit(c.houseId);
      for (const requirement of benefit.required) {
        const requiredScore = Number(requirement.match(/\s+(\d+)$/)?.[1] ?? 0);
        const normalized = requirement
          .replace(/\s+\d+$/, '')
          .toLowerCase()
          .replaceAll(/[^a-z0-9]+/g, ' ')
          .trim();
        const traitSatisfied = c.traits.some(
          (trait) =>
            trait.name.toLowerCase() === normalized &&
            scoreFromExperience(trait.experience, trait.scale) >= requiredScore,
        );
        if (
          requiredScore > 0
            ? !traitSatisfied
            : !normalizedNames.some((name) => name.startsWith(normalized)) &&
              !traitSatisfied
        )
          error(
            `house-benefit.${c.houseId}.${normalized.replaceAll(' ', '-')}`,
            `Record the ${requirement} House benefit.`,
            'pp. 13-24, 46',
          );
      }
      const choiceSatisfied =
        c.houseId === 'ars.house.bonisagus'
          ? normalizedNames.some(
              (name) =>
                name.includes('puissant ability') &&
                (name.includes('magic theory') || name.includes('intrigue')),
            )
          : c.houseId === 'ars.house.flambeau'
            ? normalizedNames.some(
                (name) =>
                  name.includes('puissant art') &&
                  (name.includes('perdo') || name.includes('ignem')),
              )
            : c.houseId === 'ars.house.mercere'
              ? normalizedNames.some(
                  (name) =>
                    name.includes('puissant art') &&
                    (name.includes('creo') || name.includes('muto')),
                )
              : c.houseId === 'ars.house.jerbiton'
                ? c.virtuesFlaws.some(
                    (entry) => entry.kind === 'virtue' && entry.points === 0,
                  )
                : true;
      if (benefit.choice && !choiceSatisfied)
        error(
          `house-benefit.${c.houseId}.choice`,
          `Choose and record the House benefit: ${benefit.choice}.`,
          'pp. 13-24, 46',
        );
    }
  }
  for (const spell of c.spells)
    if (spell.status !== 'verified')
      error(
        `spell.unverified.${spell.id}`,
        `${spell.name} is not verified for automatic creation.`,
        `p. ${spell.citation?.printedPage ?? 'unresolved'}`,
      );
  if (character.creation.status !== 'manual') {
    const budgets = creationBudgets(
      c.role,
      c.age,
      c.apprenticeshipAge,
      character.creation.wealth,
    );
    const phaseTotal = (
      phase: ArsCharacter['creation']['experienceAllocations'][number]['phase'],
    ) =>
      character.creation.experienceAllocations
        .filter((allocation) => allocation.phase === phase)
        .reduce((sum, allocation) => sum + allocation.experience, 0);
    const childhoodIds = new Set([
      'ars.ability.area-lore',
      'ars.ability.athletics',
      'ars.ability.awareness',
      'ars.ability.brawl',
      'ars.ability.charm',
      'ars.ability.folk-ken',
      'ars.ability.guile',
      'ars.ability.living-language',
      'ars.ability.stealth',
      'ars.ability.survival',
      'ars.ability.swim',
    ]);
    const selectedOptionText = c.virtuesFlaws
      .map((entry) => `${entry.name} ${entry.choice}`.toLowerCase())
      .join(' | ');
    const supernaturalAllocations =
      character.creation.experienceAllocations.filter((allocation) => {
        const trait = c.traits.find((entry) => entry.id === allocation.traitId);
        return (
          abilityCatalog.find((ability) => ability.id === trait?.definitionId)
            ?.category === 'supernatural'
        );
      });
    for (const allocation of character.creation.experienceAllocations) {
      const trait = c.traits.find((entry) => entry.id === allocation.traitId);
      if (!trait) {
        error(
          `allocation.missing-trait.${allocation.id}`,
          'A creation allocation points to a missing Trait.',
          'pp. 44, 48-50',
        );
        continue;
      }
      if (
        allocation.phase === 'native-language' &&
        trait.definitionId !== 'ars.ability.living-language'
      )
        error(
          `allocation.native-language.trait.${allocation.id}`,
          'Native-language experience must be assigned to Living Language.',
          'p. 44',
        );
      if (
        allocation.phase === 'childhood' &&
        (!trait.definitionId || !childhoodIds.has(trait.definitionId))
      )
        error(
          `allocation.childhood.trait.${allocation.id}`,
          `${trait.name} is not an early-childhood Ability.`,
          'p. 44',
        );
      if (
        !['apprenticeship', 'post-apprenticeship'].includes(allocation.phase) &&
        trait.scale === 'art'
      )
        error(
          `allocation.art-phase.${allocation.id}`,
          'Hermetic Arts may only receive apprenticeship or post-apprenticeship experience.',
          'pp. 49-51',
        );
      const ability = abilityCatalog.find(
        (definition) => definition.id === trait.definitionId,
      );
      if (ability && ability.category !== 'general') {
        const hermeticStudy =
          c.role === 'magus' &&
          ['apprenticeship', 'post-apprenticeship'].includes(allocation.phase);
        const access =
          ability.category === 'academic'
            ? hermeticStudy ||
              /educated|clerk|priest|rabbi|scholar|university|magister|doctor/.test(
                selectedOptionText,
              )
            : ability.category === 'arcane'
              ? hermeticStudy ||
                /arcane lore|wise one|failed apprentice/.test(
                  selectedOptionText,
                )
              : ability.category === 'martial'
                ? /warrior|knight|mercenary|almogavar|mamluk|trained assassin/.test(
                    selectedOptionText,
                  )
                : selectedOptionText.includes(ability.name.toLowerCase()) ||
                  (selectedOptionText.includes('the gift') &&
                    c.role !== 'magus' &&
                    new Set(
                      supernaturalAllocations.map((entry) => entry.traitId),
                    ).size <= 1);
        if (!access)
          error(
            `allocation.access.${allocation.id}`,
            `${ability.name} is a ${ability.category} Ability and needs a granting Virtue or applicable Hermetic training.`,
            'pp. 45, 158–159',
          );
      }
    }
    for (const trait of c.traits) {
      const allocated = character.creation.experienceAllocations
        .filter((allocation) => allocation.traitId === trait.id)
        .reduce((sum, allocation) => sum + allocation.experience, 0);
      if (trait.experience !== allocated)
        error(
          `allocation.trait-total.${trait.id}`,
          `${trait.name} records ${trait.experience} XP but its creation ledger records ${allocated}.`,
          'pp. 44, 48–51',
        );
    }
    for (const [phase, expected, label] of [
      ['native-language', budgets.nativeLanguage, 'native language'],
      ['childhood', budgets.childhood, 'early childhood'],
      ['later-life', budgets.laterLife, 'later life'],
    ] as const)
      if (phaseTotal(phase) !== expected)
        error(
          `allocation.${phase}`,
          `Allocate exactly ${expected} experience points for ${label}; currently ${phaseTotal(phase)}.`,
          'pp. 44, 48-50',
        );
    if (c.role === 'magus') {
      if (phaseTotal('apprenticeship') !== budgets.apprenticeship)
        error(
          'allocation.apprenticeship',
          `Allocate exactly ${budgets.apprenticeship} apprenticeship experience points; currently ${phaseTotal('apprenticeship')}.`,
          'p. 49',
        );
      const spellLevels = character.creation.spellAllocations
        .filter((allocation) => allocation.phase === 'apprenticeship')
        .reduce((sum, allocation) => sum + allocation.levels, 0);
      if (spellLevels !== budgets.spellLevels)
        error(
          'allocation.starting-spells',
          `Select exactly ${budgets.spellLevels} starting spell levels; currently ${spellLevels}.`,
          'pp. 49-50',
        );
      const artScore = (id: string) =>
        scoreFromExperience(
          c.traits.find((trait) => trait.definitionId === id)?.experience ?? 0,
          'art',
        );
      for (const allocation of character.creation.spellAllocations) {
        const allocatedSpell = c.spells.find(
          (spell) => spell.id === allocation.spellId,
        );
        if (!allocatedSpell) {
          error(
            `spell-allocation.missing.${allocation.id}`,
            'A spell allocation points to a missing spell.',
            'pp. 49–51',
          );
          continue;
        }
        if (allocatedSpell.level !== allocation.levels)
          error(
            `spell-allocation.level.${allocation.id}`,
            `${allocatedSpell.name} does not match its recorded spell-level allocation.`,
            'pp. 49–51',
          );
        if (allocation.phase === 'post-apprenticeship')
          error(
            `spell-allocation.older-resource.${allocation.id}`,
            `Record Storyguide approval for the source, laboratory access, and season used to learn or invent ${allocatedSpell.name} at age ${allocation.year}.`,
            'p. 51',
          );
      }
      const startingSpellIds = new Set(
        character.creation.spellAllocations
          .filter((allocation) => allocation.phase === 'apprenticeship')
          .map((allocation) => allocation.spellId),
      );
      for (const spell of c.spells.filter((entry) =>
        startingSpellIds.has(entry.id),
      )) {
        const limit = startingSpellLimit({
          technique: artScore(spell.techniqueId),
          form: artScore(spell.formId),
          intelligence: c.characteristics.intelligence,
          magicTheory: scoreFromExperience(
            c.traits.find(
              (trait) => trait.definitionId === 'ars.ability.magic-theory',
            )?.experience ?? 0,
            'ability',
          ),
          techniqueRequisites: spell.requisiteIds
            .filter(
              (id) =>
                id.startsWith('ars.art.') &&
                ['creo', 'intellego', 'muto', 'perdo', 'rego'].includes(
                  id.slice(8),
                ),
            )
            .map(artScore),
          formRequisites: spell.requisiteIds
            .filter(
              (id) =>
                id.startsWith('ars.art.') &&
                !['creo', 'intellego', 'muto', 'perdo', 'rego'].includes(
                  id.slice(8),
                ),
            )
            .map(artScore),
        });
        if (spell.level > limit)
          error(
            `spell.limit.${spell.id}`,
            `${spell.name} level ${spell.level} exceeds its current learning limit of ${limit}.`,
            `p. ${spell.citation?.printedPage ?? 50}`,
          );
      }
      const years = new Map(
        character.creation.allocations.postApprenticeshipYears.map((year) => [
          year.year,
          year,
        ]),
      );
      for (let offset = 0; offset < budgets.postApprenticeshipYears; offset++) {
        const age = c.apprenticeshipAge + 15 + offset;
        const year = years.get(age);
        if (!year) {
          error(
            `older-year.${age}`,
            `Complete the advancement record for age ${age}.`,
            'pp. 50-51',
          );
          continue;
        }
        const expected = olderMagusYearBudget(year.laboratorySeasons);
        const recordedStudy = character.creation.experienceAllocations
          .filter(
            (allocation) =>
              allocation.phase === 'post-apprenticeship' &&
              allocation.year === age,
          )
          .reduce((sum, allocation) => sum + allocation.experience, 0);
        const recordedSpells = character.creation.spellAllocations
          .filter(
            (allocation) =>
              allocation.phase === 'post-apprenticeship' &&
              allocation.year === age,
          )
          .reduce((sum, allocation) => sum + allocation.levels, 0);
        if (
          recordedStudy !== year.studyPointsSpent ||
          recordedSpells !== year.spellLevelsSpent
        )
          error(
            `older-year.${age}.ledger`,
            `Age ${age} summary must match its recorded study and spell allocations.`,
            'p. 51',
          );
        if (year.studyPointsSpent + year.spellLevelsSpent !== expected)
          error(
            `older-year.${age}.budget`,
            `Age ${age} must allocate ${expected} study/spell points after ${year.laboratorySeasons} laboratory seasons.`,
            'p. 51',
          );
        if (age >= 35 && !year.agingResolved)
          error(
            `older-year.${age}.aging`,
            `Resolve and record the aging roll for age ${age}.`,
            'pp. 51, 391',
          );
      }
    }
  }
  const approved = new Set(character.creation.approvals.map((x) => x.ruleId));
  return issues.filter((i) => i.kind === 'guidance' || !approved.has(i.id));
}

export function canFinalize(character: ArsCharacter) {
  return (
    isCharacterCreationCertified() &&
    validateCharacter(character).every((x) => x.kind !== 'error')
  );
}
