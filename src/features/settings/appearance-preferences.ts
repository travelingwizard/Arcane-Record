import { z } from 'zod';

export const appearanceStorageKey = 'arcane-record:appearance-preferences';

export const baseThemeIds = [
  'system',
  'arcane-ledger',
  'midnight-quintessence',
  'hermetic-observatory',
  'technocratic-dossier',
  'umbral-dreamscape',
  'tradition-codex',
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

const appearancePreferencesSchema = z.object({
  baseTheme: z.enum(baseThemeIds),
  identityOverlay: z.enum(identityOverlayIds),
  reduceMotion: z.boolean(),
});

export type AppearancePreferences = z.infer<typeof appearancePreferencesSchema>;

export const defaultAppearancePreferences: AppearancePreferences = {
  baseTheme: 'arcane-ledger',
  identityOverlay: 'neutral',
  reduceMotion: false,
};

export interface BaseThemeOption {
  id: BaseThemeId;
  name: string;
  description: string;
}

export const baseThemeOptions: readonly BaseThemeOption[] = [
  {
    id: 'system',
    name: 'System Default',
    description: 'Uses your device appearance where applicable.',
  },
  {
    id: 'arcane-ledger',
    name: 'Arcane Ledger',
    description: 'Warm parchment, charcoal ink, burgundy, and antique gold.',
  },
  {
    id: 'midnight-quintessence',
    name: 'Midnight Quintessence',
    description: 'Midnight surfaces with luminous violet and pale-blue detail.',
  },
  {
    id: 'hermetic-observatory',
    name: 'Hermetic Observatory',
    description:
      'Green-black grounds, cream pages, brass, and sacred geometry.',
  },
  {
    id: 'technocratic-dossier',
    name: 'Technocratic Dossier',
    description:
      'Dark slate, precise cyan grids, white data, and warning amber.',
  },
  {
    id: 'umbral-dreamscape',
    name: 'Umbral Dreamscape',
    description: 'Indigo atmosphere, translucent cream, and spectral ornament.',
  },
  {
    id: 'tradition-codex',
    name: 'Tradition Codex',
    description: 'A neutral dark foundation shaped by the identity overlay.',
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

export function readAppearancePreferences(
  storage: Pick<Storage, 'getItem'> = window.localStorage,
): AppearancePreferences {
  try {
    const stored = storage.getItem(appearanceStorageKey);
    if (!stored) {
      return defaultAppearancePreferences;
    }
    const parsed = appearancePreferencesSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : defaultAppearancePreferences;
  } catch {
    return defaultAppearancePreferences;
  }
}

export function writeAppearancePreferences(
  preferences: AppearancePreferences,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
) {
  storage.setItem(appearanceStorageKey, JSON.stringify(preferences));
}

export function resolveBaseTheme(
  baseTheme: BaseThemeId,
  prefersDark = typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches,
): ResolvedThemeId {
  if (baseTheme !== 'system') {
    return baseTheme;
  }
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
  root.style.colorScheme =
    resolvedTheme === 'arcane-ledger' ||
    resolvedTheme === 'hermetic-observatory' ||
    resolvedTheme === 'umbral-dreamscape'
      ? 'light'
      : 'dark';
}
