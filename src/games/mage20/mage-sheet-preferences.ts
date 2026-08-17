import { useSyncExternalStore } from 'react';
import type { SphereSortMode } from '../../systems/mage-m20/definitions';

const SORT_PREFERENCE_KEY = 'arcane-ledger:sphere-sort';
const WHEEL_PREFERENCE_KEY = 'arcane-ledger:desktop-sphere-wheel';

export const sphereSortModes: Array<{
  value: SphereSortMode;
  label: string;
}> = [
  { value: 'name-asc', label: 'Name: A–Z' },
  { value: 'name-desc', label: 'Name: Z–A' },
  { value: 'rating-desc', label: 'Rating: Highest to Lowest' },
  { value: 'rating-asc', label: 'Rating: Lowest to Highest' },
];

export interface MageSheetPreferences {
  sphereSortMode: SphereSortMode;
  desktopSphereWheel: boolean;
}

const listeners = new Set<() => void>();
let current = readPreferences();

function readPreferences(): MageSheetPreferences {
  try {
    const storedSort = window.localStorage.getItem(SORT_PREFERENCE_KEY);
    const sphereSortMode = sphereSortModes.some(
      ({ value }) => value === storedSort,
    )
      ? (storedSort as SphereSortMode)
      : 'name-asc';
    return {
      sphereSortMode,
      desktopSphereWheel:
        window.localStorage.getItem(WHEEL_PREFERENCE_KEY) === 'true',
    };
  } catch {
    return { sphereSortMode: 'name-asc', desktopSphereWheel: false };
  }
}

function writePreferences(next: MageSheetPreferences) {
  current = next;
  try {
    window.localStorage.setItem(SORT_PREFERENCE_KEY, next.sphereSortMode);
    window.localStorage.setItem(
      WHEEL_PREFERENCE_KEY,
      String(next.desktopSphereWheel),
    );
  } catch {
    // The settings remain active for this session if storage is unavailable.
  }
  listeners.forEach((listener) => listener());
}

export function setSphereSortMode(sphereSortMode: SphereSortMode) {
  writePreferences({ ...current, sphereSortMode });
}

export function setDesktopSphereWheel(desktopSphereWheel: boolean) {
  writePreferences({ ...current, desktopSphereWheel });
}

export function useMageSheetPreferences() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => current,
  );
}
