import { z } from 'zod';

export const characterLibraryPreferenceKey =
  'arcane-record:character-library-preferences';
export const characterLibraryPreferenceEvent =
  'arcane-record:character-library-preference-change';

const ids = z.array(z.string().min(1).max(500)).max(10_000);

const schema = z.object({
  version: z.literal(1),
  archivedIds: ids,
  favoriteIds: ids,
  favoriteOrderIds: ids,
  regularOrderIds: ids,
  archivedOrderIds: ids,
});

export type CharacterLibraryPreferences = z.infer<typeof schema>;

export const defaultCharacterLibraryPreferences: CharacterLibraryPreferences = {
  version: 1,
  archivedIds: [],
  favoriteIds: [],
  favoriteOrderIds: [],
  regularOrderIds: [],
  archivedOrderIds: [],
};

export function readCharacterLibraryPreferences(
  storage: Pick<Storage, 'getItem'> = window.localStorage,
): CharacterLibraryPreferences {
  try {
    const raw = storage.getItem(characterLibraryPreferenceKey);
    const parsed = schema.safeParse(raw ? JSON.parse(raw) : null);
    return parsed.success ? parsed.data : defaultCharacterLibraryPreferences;
  } catch {
    return defaultCharacterLibraryPreferences;
  }
}

export function writeCharacterLibraryPreferences(
  preferences: CharacterLibraryPreferences,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
) {
  const next = schema.parse(preferences);
  storage.setItem(characterLibraryPreferenceKey, JSON.stringify(next));
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event(characterLibraryPreferenceEvent));
  return next;
}

function uniqueKnown(order: readonly string[], eligible: ReadonlySet<string>) {
  const seen = new Set<string>();
  return order.filter((id) => {
    if (!eligible.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function reconcileOrder(order: readonly string[], eligible: readonly string[]) {
  const eligibleSet = new Set(eligible);
  const next = uniqueKnown(order, eligibleSet);
  const included = new Set(next);
  eligible.forEach((id) => {
    if (!included.has(id)) next.push(id);
  });
  return next;
}

export function reconcileCharacterLibraryPreferences(
  preferences: CharacterLibraryPreferences,
  recordIds: readonly string[],
): CharacterLibraryPreferences {
  const records = new Set(recordIds);
  const archivedIds = uniqueKnown(preferences.archivedIds, records);
  const archived = new Set(archivedIds);
  const favoriteIds = uniqueKnown(preferences.favoriteIds, records);
  const favorites = new Set(favoriteIds);
  const activeFavorites = recordIds.filter(
    (id) => !archived.has(id) && favorites.has(id),
  );
  const activeRegular = recordIds.filter(
    (id) => !archived.has(id) && !favorites.has(id),
  );
  const archivedRecords = recordIds.filter((id) => archived.has(id));
  return {
    version: 1,
    archivedIds,
    favoriteIds,
    favoriteOrderIds: reconcileOrder(
      preferences.favoriteOrderIds,
      activeFavorites,
    ),
    regularOrderIds: reconcileOrder(preferences.regularOrderIds, activeRegular),
    archivedOrderIds: reconcileOrder(
      preferences.archivedOrderIds,
      archivedRecords,
    ),
  };
}

export function removeCharacterLibraryPreference(
  preferences: CharacterLibraryPreferences,
  id: string,
) {
  return {
    ...preferences,
    archivedIds: preferences.archivedIds.filter((value) => value !== id),
    favoriteIds: preferences.favoriteIds.filter((value) => value !== id),
    favoriteOrderIds: preferences.favoriteOrderIds.filter(
      (value) => value !== id,
    ),
    regularOrderIds: preferences.regularOrderIds.filter(
      (value) => value !== id,
    ),
    archivedOrderIds: preferences.archivedOrderIds.filter(
      (value) => value !== id,
    ),
  };
}
