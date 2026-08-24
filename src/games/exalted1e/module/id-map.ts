export const EXALTED1E_MODULE_ID =
  'org.travelingwizard.arcane-record.exalted1e' as const;
export const EXALTED1E_MODULE_VERSION = '1.0.0' as const;
export const EXALTED1E_ROOT_NODE_ID = 'exalted-first-edition' as const;
export const EXALTED1E_SOLAR_NODE_ID = 'solar' as const;
export const EXALTED1E_DRAGON_BLOODED_NODE_ID = 'dragon-blooded' as const;
export const EXALTED1E_SOLAR_SHEET_ID = 'solar-character' as const;
export const EXALTED1E_DRAGON_BLOODED_SHEET_ID =
  'dragon-blooded-character' as const;
export const EXALTED1E_SHEET_VERSION = 1 as const;

export const exalted1eDefinitionRefs = {
  shared: [
    'catalog/languages/shared-languages',
    'catalog/backgrounds/shared-backgrounds',
    'catalog/equipment/shared-equipment',
    'catalog/derangements/shared-derangements',
    'catalog/advancement/shared-advancement',
  ],
  solar: [
    'catalog/backgrounds/solar-backgrounds',
    'catalog/variant-rules/solar-limit',
  ],
  dragonBlooded: [
    'catalog/backgrounds/dragon-blooded-backgrounds',
    'catalog/dragon-blooded-traits/dragon-blooded-merits-flaws',
    'catalog/dragon-blooded-powers/dragon-blooded-charms-sorcery',
    'catalog/variant-rules/dragon-blooded-advancement',
  ],
} as const;
