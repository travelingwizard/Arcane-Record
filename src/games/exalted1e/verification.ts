import type { ExaltedCharacterType } from './profiles';

export interface ExaltedFamilyVerification {
  family: ExaltedCharacterType;
  sourceInventory: 'passed' | 'blocked';
  creationRules: 'passed' | 'blocked';
  familyCalculations: 'passed' | 'blocked';
  advancementRules: 'passed' | 'blocked';
  guidedCreator: 'passed' | 'blocked';
  blockers: readonly string[];
}

const passed = (family: ExaltedCharacterType): ExaltedFamilyVerification => ({
  family,
  sourceInventory: 'passed',
  creationRules: 'passed',
  familyCalculations: 'passed',
  advancementRules: 'passed',
  guidedCreator: 'passed',
  blockers: [],
});

/**
 * Production certification is deliberately explicit. OCR output, a populated
 * catalog, or a passing typecheck can never promote a family implicitly.
 */
export const exaltedFamilyVerification: Record<
  ExaltedCharacterType,
  ExaltedFamilyVerification
> = {
  solar: passed('solar'),
  'dragon-blooded': passed('dragon-blooded'),
  lunar: {
    family: 'lunar',
    sourceInventory: 'blocked',
    creationRules: 'passed',
    familyCalculations: 'passed',
    advancementRules: 'passed',
    guidedCreator: 'blocked',
    blockers: [
      'The OCR Charm inventory still contains unresolved or misidentified headings.',
      'Tell, tattoo, and Heart’s Blood creation choices are not yet validated by the creator.',
    ],
  },
  abyssal: {
    family: 'abyssal',
    sourceInventory: 'blocked',
    creationRules: 'passed',
    familyCalculations: 'passed',
    advancementRules: 'passed',
    guidedCreator: 'blocked',
    blockers: [
      'The OCR Charm inventory contains incomplete minimum and prerequisite headers.',
      'Liege, Resonance, Whispers, and necromancy creation requirements are not fully validated.',
    ],
  },
  sidereal: {
    family: 'sidereal',
    sourceInventory: 'blocked',
    creationRules: 'passed',
    familyCalculations: 'passed',
    advancementRules: 'passed',
    guidedCreator: 'blocked',
    blockers: [
      'The OCR Charm inventory has not completed line-by-line source review.',
      'Colleges, astrology, and resplendent-destiny creation requirements are not fully validated.',
    ],
  },
  alchemical: {
    family: 'alchemical',
    sourceInventory: 'passed',
    creationRules: 'passed',
    familyCalculations: 'passed',
    advancementRules: 'passed',
    guidedCreator: 'blocked',
    blockers: [
      'The creator does not yet validate installation costs, Charm slots, and starting installation state.',
    ],
  },
  'fair-folk': {
    family: 'fair-folk',
    sourceInventory: 'passed',
    creationRules: 'passed',
    familyCalculations: 'blocked',
    advancementRules: 'passed',
    guidedCreator: 'blocked',
    blockers: [
      'Grace allocation, feeding, assumptions, and shaping-derived values are not fully validated.',
      'The creator does not yet enforce family-specific Grace and shaping selections.',
    ],
  },
};

export function canCreateProductionExaltedCharacter(
  family: ExaltedCharacterType,
) {
  const verification = exaltedFamilyVerification[family];
  return (
    verification.sourceInventory === 'passed' &&
    verification.creationRules === 'passed' &&
    verification.familyCalculations === 'passed' &&
    verification.advancementRules === 'passed' &&
    verification.guidedCreator === 'passed'
  );
}

export function getExaltedVerificationRequirement(
  family: ExaltedCharacterType,
) {
  const verification = exaltedFamilyVerification[family];
  if (canCreateProductionExaltedCharacter(family)) return undefined;
  return `Source verification required: ${verification.blockers.join(' ')}`;
}
