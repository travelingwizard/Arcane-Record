import { z } from 'zod';

export const gameChooserPreferenceKey =
  'arcane-record:game-chooser-preferences';
export const gameChooserPreferenceEvent =
  'arcane-record:game-chooser-preference-change';

export const gameChooserSorts = [
  'name-asc',
  'name-desc',
  'engine',
  'creation-support',
] as const;
export const gameChooserFilters = ['all', 'builder', 'sheet-only'] as const;

const schema = z.object({
  version: z.literal(1),
  sort: z.enum(gameChooserSorts),
  capability: z.enum(gameChooserFilters),
  hiddenIds: z.array(z.string().min(1).max(500)).max(1_000),
});

export type GameChooserPreferences = z.infer<typeof schema>;

export const defaultGameChooserPreferences: GameChooserPreferences = {
  version: 1,
  sort: 'name-asc',
  capability: 'all',
  hiddenIds: [],
};

export function readGameChooserPreferences(
  storage: Pick<Storage, 'getItem'> = window.localStorage,
): GameChooserPreferences {
  try {
    const raw = storage.getItem(gameChooserPreferenceKey);
    const parsed = schema.safeParse(raw ? JSON.parse(raw) : null);
    return parsed.success ? parsed.data : defaultGameChooserPreferences;
  } catch {
    return defaultGameChooserPreferences;
  }
}

export function writeGameChooserPreferences(
  preferences: GameChooserPreferences,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
) {
  const next = schema.parse(preferences);
  storage.setItem(gameChooserPreferenceKey, JSON.stringify(next));
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event(gameChooserPreferenceEvent));
  return next;
}
