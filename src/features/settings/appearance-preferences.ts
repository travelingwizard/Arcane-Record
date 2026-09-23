import { z } from 'zod';

export const appearanceStorageKey = 'arcane-record:appearance-preferences';
export const appearanceStorageVersion = 2 as const;

export const baseThemeIds = [
  'system',
  'arcane-ledger',
  'midnight-quintessence',
  'hermetic-observatory',
  'technocratic-dossier',
  'umbral-dreamscape',
  'tradition-codex',
  'exalted-vermilion',
  'barsaive-twilight',
  'dragons-horn',
  'blood-wood',
  'horror-taint',
  'astral-thread',
  'simple-crimson',
  'simple-navy',
  'simple-forest',
  'simple-plum',
  'simple-charcoal',
  'custom-background',
] as const;

export type BaseThemeId = (typeof baseThemeIds)[number];
export type ResolvedThemeId = Exclude<BaseThemeId, 'system'>;

export const identityOverlayIds = [
  'neutral',
  'akashayana',
  'order-of-hermes',
  'virtual-adepts',
  'verbena',
  'cult-of-ecstasy',
  'sons-of-ether',
  'technocracy',
  'nephandic',
] as const;

export type IdentityOverlayId = (typeof identityOverlayIds)[number];

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const appearancePreferencesSchema = z.object({
  baseTheme: z.enum(baseThemeIds),
  identityOverlay: z.enum(identityOverlayIds),
  reduceMotion: z.boolean(),
  customBackground: hexColorSchema.nullable(),
});

const legacyBaseThemeIds = baseThemeIds.slice(0, 7) as unknown as readonly [
  BaseThemeId,
  ...BaseThemeId[],
];
const legacyAppearancePreferencesSchema = z.object({
  baseTheme: z.enum(legacyBaseThemeIds),
  identityOverlay: z.enum(identityOverlayIds),
  reduceMotion: z.boolean(),
});

export type AppearancePreferences = z.infer<typeof appearancePreferencesSchema>;

export const appearancePreferenceStoreSchema = z.object({
  version: z.literal(appearanceStorageVersion),
  defaultAppearance: appearancePreferencesSchema,
  characterAppearances: z.record(z.string(), appearancePreferencesSchema),
});

export type AppearancePreferenceStore = z.infer<
  typeof appearancePreferenceStoreSchema
>;

export const defaultAppearancePreferences: AppearancePreferences = {
  baseTheme: 'arcane-ledger',
  identityOverlay: 'neutral',
  reduceMotion: false,
  customBackground: null,
};

export const defaultAppearancePreferenceStore: AppearancePreferenceStore = {
  version: appearanceStorageVersion,
  defaultAppearance: defaultAppearancePreferences,
  characterAppearances: {},
};

export type ThemeCategory =
  'general' | 'mage' | 'exalted' | 'earthdawn' | 'simple';

export interface BaseThemeOption {
  id: BaseThemeId;
  name: string;
  description: string;
  category: ThemeCategory;
}

export const themeCategoryLabels: Record<ThemeCategory, string> = {
  general: 'General',
  mage: 'Suggested for Mage',
  exalted: 'Suggested for Exalted',
  earthdawn: 'Inspired by Earthdawn',
  simple: 'Simple backgrounds',
};

export const baseThemeOptions: readonly BaseThemeOption[] = [
  {
    id: 'system',
    name: 'System Default',
    description: 'Uses your device appearance where applicable.',
    category: 'general',
  },
  {
    id: 'arcane-ledger',
    name: 'Arcane Ledger',
    description: 'Warm parchment, charcoal ink, burgundy, and antique gold.',
    category: 'mage',
  },
  {
    id: 'midnight-quintessence',
    name: 'Midnight Quintessence',
    description: 'Midnight surfaces with luminous violet and pale-blue detail.',
    category: 'mage',
  },
  {
    id: 'hermetic-observatory',
    name: 'Hermetic Observatory',
    description:
      'Green-black grounds, cream pages, brass, and sacred geometry.',
    category: 'mage',
  },
  {
    id: 'technocratic-dossier',
    name: 'Technocratic Dossier',
    description:
      'Dark slate, precise cyan grids, white data, and warning amber.',
    category: 'mage',
  },
  {
    id: 'umbral-dreamscape',
    name: 'Umbral Dreamscape',
    description: 'Indigo atmosphere, translucent cream, and spectral ornament.',
    category: 'mage',
  },
  {
    id: 'tradition-codex',
    name: 'Tradition Codex',
    description: 'A neutral dark foundation shaped by the identity overlay.',
    category: 'mage',
  },
  {
    id: 'exalted-vermilion',
    name: 'Exalted Vermilion',
    description: 'Ivory pages, vermilion selections, and ceremonial gold.',
    category: 'exalted',
  },
  {
    id: 'barsaive-twilight',
    name: 'Barsaive Twilight',
    description: 'Bruised violet, twilight slate, heroic gold, and warm ivory.',
    category: 'earthdawn',
  },
  {
    id: 'dragons-horn',
    name: 'Dragon’s Horn',
    description: 'Charcoal, antique gold, and restrained emerald detail.',
    category: 'earthdawn',
  },
  {
    id: 'blood-wood',
    name: 'Blood Wood',
    description: 'Wine red, black bark, thorn blue, and resin amber.',
    category: 'earthdawn',
  },
  {
    id: 'horror-taint',
    name: 'Horror Taint',
    description: 'Sickly astral green, bruised purple, and oxidized metal.',
    category: 'earthdawn',
  },
  {
    id: 'astral-thread',
    name: 'Astral Thread',
    description:
      'Astral midnight, luminous thread, moon silver, and violet fire.',
    category: 'earthdawn',
  },
  {
    id: 'simple-crimson',
    name: 'Crimson',
    description: 'A crisp white sheet on a deep crimson background.',
    category: 'simple',
  },
  {
    id: 'simple-navy',
    name: 'Navy',
    description: 'A crisp white sheet on a deep navy background.',
    category: 'simple',
  },
  {
    id: 'simple-forest',
    name: 'Forest',
    description: 'A crisp white sheet on a forest-green background.',
    category: 'simple',
  },
  {
    id: 'simple-plum',
    name: 'Plum',
    description: 'A crisp white sheet on a dark plum background.',
    category: 'simple',
  },
  {
    id: 'simple-charcoal',
    name: 'Charcoal',
    description: 'A crisp white sheet on a charcoal background.',
    category: 'simple',
  },
  {
    id: 'custom-background',
    name: 'Custom Background',
    description: 'Choose the color behind a crisp white character sheet.',
    category: 'simple',
  },
];

export interface IdentityOverlayOption {
  id: IdentityOverlayId;
  name: string;
  glyph: string;
  description: string;
}

export const identityOverlayOptions: readonly IdentityOverlayOption[] = [
  {
    id: 'neutral',
    name: 'Neutral',
    glyph: '◇',
    description: 'Uses the base theme without affiliation ornament.',
  },
  {
    id: 'akashayana',
    name: 'Akashayana',
    glyph: '◉',
    description: 'Saffron, deep red, brush circles, and mandala forms.',
  },
  {
    id: 'order-of-hermes',
    name: 'Order of Hermes',
    glyph: '△',
    description: 'Burgundy, gold, seals, and formal ritual geometry.',
  },
  {
    id: 'virtual-adepts',
    name: 'Virtual Adepts',
    glyph: '⌘',
    description: 'Cyan and violet data fragments with digital occult grids.',
  },
  {
    id: 'verbena',
    name: 'Verbena',
    glyph: '❧',
    description: 'Moss, dark red, roots, botanical lines, and lunar forms.',
  },
  {
    id: 'cult-of-ecstasy',
    name: 'Cult of Ecstasy',
    glyph: '✦',
    description: 'Violet, rose, stars, and flowing rhythmic ornament.',
  },
  {
    id: 'sons-of-ether',
    name: 'Sons of Ether',
    glyph: '⚙',
    description: 'Navy, brass, coils, and invention-diagram details.',
  },
  {
    id: 'technocracy',
    name: 'Technocracy',
    glyph: '⌗',
    description: 'Slate, cyan, white, amber, and classification marks.',
  },
  {
    id: 'nephandic',
    name: 'Nephandic',
    glyph: '⟡',
    description: 'Charcoal, crimson, corroded gold, and fractured geometry.',
  },
];

function cloneDefaults(): AppearancePreferenceStore {
  return {
    version: appearanceStorageVersion,
    defaultAppearance: { ...defaultAppearancePreferences },
    characterAppearances: {},
  };
}

export function readAppearancePreferences(
  storage: Pick<Storage, 'getItem'> = window.localStorage,
): AppearancePreferenceStore {
  try {
    const stored = storage.getItem(appearanceStorageKey);
    if (!stored) return cloneDefaults();
    const value: unknown = JSON.parse(stored);
    const current = appearancePreferenceStoreSchema.safeParse(value);
    if (current.success) return current.data;

    const legacy = legacyAppearancePreferencesSchema.safeParse(value);
    if (legacy.success) {
      return {
        version: appearanceStorageVersion,
        defaultAppearance: { ...legacy.data, customBackground: null },
        characterAppearances: {},
      };
    }
    return cloneDefaults();
  } catch {
    return cloneDefaults();
  }
}

export function writeAppearancePreferences(
  preferences: AppearancePreferenceStore,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
) {
  storage.setItem(appearanceStorageKey, JSON.stringify(preferences));
}

export function getEffectiveAppearance(
  store: AppearancePreferenceStore,
  characterId: string | null,
) {
  return characterId
    ? (store.characterAppearances[characterId] ?? store.defaultAppearance)
    : store.defaultAppearance;
}

export function resolveBaseTheme(
  baseTheme: BaseThemeId,
  prefersDark = typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches,
): ResolvedThemeId {
  if (baseTheme !== 'system') return baseTheme;
  return prefersDark ? 'midnight-quintessence' : 'arcane-ledger';
}

export function applyAppearancePreferences(
  preferences: AppearancePreferences,
  root: HTMLElement = document.documentElement,
  prefersDark?: boolean,
) {
  const resolvedTheme = resolveBaseTheme(preferences.baseTheme, prefersDark);
  root.dataset.theme = resolvedTheme;
  root.dataset.themeChoice = preferences.baseTheme;
  root.dataset.overlay = preferences.identityOverlay;
  root.dataset.reduceMotion = String(preferences.reduceMotion);
  if (resolvedTheme === 'custom-background') {
    root.style.setProperty(
      '--custom-app-background',
      preferences.customBackground ?? '#38506b',
    );
  } else {
    root.style.removeProperty('--custom-app-background');
  }
  root.style.colorScheme = [
    'midnight-quintessence',
    'technocratic-dossier',
    'tradition-codex',
    'barsaive-twilight',
    'dragons-horn',
    'blood-wood',
    'horror-taint',
    'astral-thread',
  ].includes(resolvedTheme)
    ? 'dark'
    : 'light';
}
