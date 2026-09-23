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
  installationCost?: string | null;
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

/**
 * Sorcery-spell shape. Originally modeled as Terrestrial-only (fixed
 * `circle`/`alternateCircleName` literals), since this file only ever held
 * Terrestrial Circle Sorcery spells; broadened to a union when Celestial
 * Circle Sorcery spells were added (Abyssals get both Circles, per Exalted:
 * The Abyssals' Daybreak Caste Occult tree, while Dragon-Blooded remain
 * Terrestrial-only). Kept named `TerrestrialSpellDefinition` rather than
 * renamed, since it is imported by several existing consumers
 * (`shared/advancement/rules.ts`, `ModuleExaltedSection.tsx`,
 * `DragonBloodedPowersSection.tsx`); `SorcerySpellDefinition` is exported
 * below as a same-shape alias for new code that shouldn't imply
 * Terrestrial/Dragon-Blooded-only.
 */
export interface TerrestrialSpellDefinition extends DragonBloodedPowerDefinition {
  kind: 'spell';
  circle: 'terrestrial' | 'celestial';
  alternateCircleName: 'Emerald Circle' | 'Sapphire Circle';
  castingTime: string | null;
  target: string | null;
}

/** Splat-agnostic alias; see the doc comment on `TerrestrialSpellDefinition`. */
export type SorcerySpellDefinition = TerrestrialSpellDefinition;

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
/**
 * Every Sorcery spell in the file, both Terrestrial and Celestial Circle.
 * Not exported directly under a Dragon-Blooded-implying name -- see
 * `dragonBloodedSpells` (Terrestrial-only, for Dragon-Blooded's own use)
 * and `sharedSorcerySpellIds` (both circles, for Abyssal's use) below.
 */
const allSorcerySpells = spellData as SorcerySpellDefinition[];

export const dragonBloodedCharmById = new Map(
  dragonBloodedCharms.map((definition) => [definition.id, definition]),
);
export const dragonBloodedCharmIds = new Set(dragonBloodedCharmById.keys());

/**
 * Dragon-Blooded may normally learn only Terrestrial/Emerald Circle
 * sorcery (Celestial/Sapphire and Solar/Adamant Circle sorcery are outside
 * standard Dragon-Blooded access), so this stays filtered to `'terrestrial'`
 * even though the underlying JSON file now also holds Celestial spells --
 * this preserves the exact pre-existing behavior/count (99) for every
 * existing Dragon-Blooded consumer (the DB Powers section UI, the phase-3
 * module bundle, `schema.ts`'s Dragon-Blooded spell validation branch).
 */
export const dragonBloodedSpells = allSorcerySpells.filter(
  (definition) => definition.circle === 'terrestrial',
);
export const dragonBloodedSpellById = new Map(
  dragonBloodedSpells.map((definition) => [definition.id, definition]),
);
export const dragonBloodedSpellIds = new Set(dragonBloodedSpellById.keys());

/**
 * Splat-agnostic alias covering *both* Sorcery Circles in this file
 * (Terrestrial and Celestial), for consumers (like Abyssal's schema
 * validation) that need the full set without implying Dragon-Blooded --
 * Abyssal can legally reach both Circles via its own Terrestrial/Celestial
 * Circle Sorcery Charms, unlike Dragon-Blooded. Mirrors the `sharedTraitById`
 * alias pattern in `dragonblooded-merits-flaws.ts`, though unlike that file
 * this one draws the shared set from the *superset* of the DB-scoped
 * export rather than being identical to it, since Dragon-Blooded's own
 * export must stay Terrestrial-only (see `dragonBloodedSpells` above).
 */
export const sharedSorcerySpellById = new Map(
  allSorcerySpells.map((definition) => [definition.id, definition]),
);
export const sharedSorcerySpellIds = new Set(sharedSorcerySpellById.keys());
