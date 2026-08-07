import charmData from './dragonblooded-charms.json';
import spellData from './dragonblooded-sorcery.json';

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
}

export interface TerrestrialSpellDefinition extends DragonBloodedPowerDefinition {
  kind: 'spell';
  circle: 'terrestrial';
  alternateCircleName: 'Emerald Circle';
  castingTime: string | null;
  target: string | null;
}

export const dragonBloodedCharms = charmData as DragonBloodedCharmDefinition[];
export const dragonBloodedSpells = spellData as TerrestrialSpellDefinition[];

export const dragonBloodedCharmById = new Map(
  dragonBloodedCharms.map((definition) => [definition.id, definition]),
);
export const dragonBloodedSpellById = new Map(
  dragonBloodedSpells.map((definition) => [definition.id, definition]),
);
export const dragonBloodedCharmIds = new Set(dragonBloodedCharmById.keys());
export const dragonBloodedSpellIds = new Set(dragonBloodedSpellById.keys());
