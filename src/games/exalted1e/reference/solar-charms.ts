import charmData from './solar-charms.json';
import type { DragonBloodedCharmDefinition } from './dragonblooded-powers';
import type { CharmComboRules } from '../shared/combos/types';

const defaultComboRules: CharmComboRules = {
  eligible: true,
  restrictions: [],
  specialRules: [
    'The supplied handbook does not include complete Combo eligibility text; verify against the cited source.',
  ],
};

const explicitComboRules: Record<string, Partial<CharmComboRules>> = {
  'solar-circle-sorcery': {
    eligible: false,
    restrictions: ['Sorcery-enabling Charms cannot be placed in a Combo.'],
  },
  'celestial-circle-sorcery': {
    eligible: false,
    restrictions: ['Sorcery-enabling Charms cannot be placed in a Combo.'],
  },
  'terrestrial-circle-sorcery': {
    eligible: false,
    restrictions: ['Sorcery-enabling Charms cannot be placed in a Combo.'],
  },
};

export const solarCharms = charmData.map((definition) => ({
  ...definition,
  comboRules: {
    ...defaultComboRules,
    ...explicitComboRules[definition.id],
  },
})) as DragonBloodedCharmDefinition[];

export const solarCharmById = new Map(
  solarCharms.map((definition) => [definition.id, definition]),
);

export const solarCharmIds = new Set(solarCharmById.keys());
