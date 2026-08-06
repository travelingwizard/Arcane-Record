import { z } from 'zod';

export const globalPreferencesStorageKey = 'arcane-record:global-preferences';
const schema = z.object({
  appearance: z.enum(['system', 'light', 'dark']),
  reduceMotion: z.boolean(),
});
export type GlobalPreferences = z.infer<typeof schema>;
export const defaultGlobalPreferences: GlobalPreferences = {
  appearance: 'system',
  reduceMotion: false,
};

export function readGlobalPreferences(): GlobalPreferences {
  try {
    const value = localStorage.getItem(globalPreferencesStorageKey);
    const parsed = schema.safeParse(value ? JSON.parse(value) : null);
    return parsed.success ? parsed.data : defaultGlobalPreferences;
  } catch {
    return defaultGlobalPreferences;
  }
}

export function writeGlobalPreferences(preferences: GlobalPreferences) {
  localStorage.setItem(
    globalPreferencesStorageKey,
    JSON.stringify(preferences),
  );
  document.documentElement.dataset.globalTheme = preferences.appearance;
  document.documentElement.dataset.globalReduceMotion = String(
    preferences.reduceMotion,
  );
}
