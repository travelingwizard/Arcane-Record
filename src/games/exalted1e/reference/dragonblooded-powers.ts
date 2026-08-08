import charmData from './dragonblooded-charms.json';
import spellData from './dragonblooded-sorcery.json';
import type { CharmComboRules } from '../shared/combos/types';

export type PowerReviewStatus =
  'source-checked' | 'needs-review' | 'external-source';

export interface DragonBloodedPowerDefinition {
  id: string;
  name: string;
  kind: 'charm' | 'spell';
  summary: string;
  description: string;
  cost: string | null;
  duration: string | null;
  type: string | null;
  minimumRequirements: { trait: string; rating: number }[];
  minimumEssence: number | null;
  prerequisiteCharms: string[];
  prerequisiteText: string | null;
  sourceDisplay: string;
  reviewStatus: PowerReviewStatus;
  reviewFlags: string[];
}

export interface DragonBloodedCharmDefinition extends DragonBloodedPowerDefinition {
  kind: 'charm';
  category:
    'native' | 'spirit-mastery' | 'immaculate-martial-art' | 'aspect-book';
  element: 'Air' | 'Earth' | 'Fire' | 'Water' | 'Wood' | null;
  ability: string;
  style: string | null;
  comboRules: CharmComboRules;
}

export interface TerrestrialSpellDefinition extends DragonBloodedPowerDefinition {
  kind: 'spell';
  circle: 'terrestrial';
  alternateCircleName: 'Emerald Circle';
  castingTime: string | null;
  target: string | null;
}

const defaultComboRules: CharmComboRules = {
  eligible: true,
  restrictions: [],
  specialRules: [],
};

const explicitComboRules: Record<string, Partial<CharmComboRules>> = {
  'spirit-chaining-strike': {
    crossAbilityAllowed: true,
    specialRules: [
      'Explicitly permitted in Combos with Charms of other Abilities.',
    ],
  },
  'falling-star-maneuver': {
    crossAbilityAllowed: true,
    actionContexts: ['attack', 'movement'],
    specialRules: [
      'Explicitly permitted in Combos with Charms of other Abilities.',
    ],
  },
  'spring-follows-winter': {
    actionContexts: ['attack'],
    repeatsOtherCharmCosts: true,
    specialRules: [
      'When its reroll is used, the Essence cost of all other incorporated Charms must be paid again.',
    ],
  },
  'taint-cleansing-technique': {
    eligible: false,
    restrictions: ['Cannot be placed in a Combo.'],
    specialRules: [],
  },
  'terrestrial-circle-sorcery': {
    eligible: false,
    restrictions: ['Can never be part of a Combo.'],
    specialRules: [],
  },
};

export const dragonBloodedCharms = charmData.map((definition) => ({
  ...definition,
  comboRules: {
    ...defaultComboRules,
    ...explicitComboRules[definition.id],
  },
})) as DragonBloodedCharmDefinition[];
export const dragonBloodedSpells = spellData as TerrestrialSpellDefinition[];

export const dragonBloodedCharmById = new Map(
  dragonBloodedCharms.map((definition) => [definition.id, definition]),
);
export const dragonBloodedSpellById = new Map(
  dragonBloodedSpells.map((definition) => [definition.id, definition]),
);
export const dragonBloodedCharmIds = new Set(dragonBloodedCharmById.keys());
export const dragonBloodedSpellIds = new Set(dragonBloodedSpellById.keys());
