import type { Exalted1eCharacter } from '../../schema';
import type { DragonBloodedCharmDefinition } from '../../reference/dragonblooded-powers';
import type {
  ComboAnalysis,
  ComboCostSummary,
  ComboValidationIssue,
} from './types';

export interface ExaltTypeComboRules {
  validateCombo(
    character: Exalted1eCharacter,
    charms: DragonBloodedCharmDefinition[],
  ): { errors: ComboValidationIssue[]; warnings: ComboValidationIssue[] };
  calculateActivationCost(
    character: Exalted1eCharacter,
    charms: DragonBloodedCharmDefinition[],
  ): Pick<ComboCostSummary, 'exaltTypeSurcharge' | 'notes'>;
}

function emptyCost(): ComboCostSummary {
  return {
    activationWillpower: 1,
    fixedMotes: 0,
    variableMotes: [],
    healthCosts: [],
    otherCosts: [],
    exaltTypeSurcharge: 0,
    notes: [],
  };
}

export function calculateCharmCosts(
  charms: DragonBloodedCharmDefinition[],
): ComboCostSummary {
  const cost = emptyCost();
  for (const charm of charms) {
    if (!charm.cost) continue;
    const normalized = charm.cost.toLocaleLowerCase();
    const mote = normalized.match(/(\d+)\s*motes?/);
    const willpower = normalized.match(/(\d+)\s*willpower/);
    const health = normalized.match(/(\d+)\s*health/);
    const variable = /\b(per|variable|varies|up to|each|any number)\b/.test(
      normalized,
    );
    if (mote && !variable) cost.fixedMotes += Number(mote[1]);
    if (mote && variable)
      cost.variableMotes.push(`${charm.name}: ${charm.cost}`);
    if (willpower) {
      cost.activationWillpower += Number(willpower[1]);
    }
    if (health) cost.healthCosts.push(`${charm.name}: ${charm.cost}`);
    if (!mote && !willpower && !health) {
      cost.otherCosts.push(`${charm.name}: ${charm.cost}`);
    }
    if (charm.comboRules.repeatsOtherCharmCosts) {
      cost.notes.push(
        `${charm.name} can require the other incorporated Charm costs to be paid again.`,
      );
    }
  }
  return cost;
}

export function analyzeCombo(
  character: Exalted1eCharacter,
  charms: DragonBloodedCharmDefinition[],
  extension?: ExaltTypeComboRules,
): ComboAnalysis {
  const errors: ComboValidationIssue[] = [];
  const warnings: ComboValidationIssue[] = [];
  if (!charms.length) {
    errors.push({ code: 'empty', message: 'Add at least one known Charm.' });
  }
  for (const charm of charms) {
    if (!charm.comboRules.eligible) {
      errors.push({
        code: 'ineligible',
        message: `${charm.name} cannot be included in a Combo.`,
      });
    }
    for (const requirement of charm.minimumRequirements) {
      const ability = requirement.trait
        .replace(/\s+/g, '')
        .replace(/^./, (letter) => letter.toLocaleLowerCase());
      const rating =
        character.abilities[ability as keyof typeof character.abilities];
      if (rating !== undefined && rating < requirement.rating) {
        errors.push({
          code: 'requirement',
          message: `${charm.name} requires ${requirement.trait} ${requirement.rating}.`,
        });
      }
    }
    if (
      charm.minimumEssence !== null &&
      character.essence.rating < charm.minimumEssence
    ) {
      errors.push({
        code: 'essence-requirement',
        message: `${charm.name} requires Essence ${charm.minimumEssence}.`,
      });
    }
  }
  const abilities = new Set(charms.map(({ ability }) => ability));
  if (
    abilities.size > 1 &&
    !charms.some(({ comboRules }) => comboRules.crossAbilityAllowed)
  ) {
    errors.push({
      code: 'cross-ability',
      message:
        'These Charms span multiple Abilities without an explicit cross-Ability exception.',
    });
  }
  const extensionValidation = extension?.validateCombo(character, charms);
  if (extensionValidation) {
    errors.push(...extensionValidation.errors);
    warnings.push(...extensionValidation.warnings);
  }
  const activationCost = calculateCharmCosts(charms);
  const extensionCost = extension?.calculateActivationCost(character, charms);
  if (extensionCost) {
    activationCost.exaltTypeSurcharge = extensionCost.exaltTypeSurcharge;
    activationCost.notes.push(...extensionCost.notes);
  }
  const actionSets = charms
    .flatMap(({ comboRules }) => comboRules.actionContexts ?? [])
    .filter((value, index, values) => values.indexOf(value) === index);
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    charmTypes: [...new Set(charms.map(({ type }) => type ?? 'Unlisted'))],
    activationCost,
    applicableActions: actionSets,
    dynamicCosts:
      activationCost.variableMotes.length > 0 ||
      activationCost.healthCosts.length > 0 ||
      activationCost.otherCosts.length > 0,
  };
}
