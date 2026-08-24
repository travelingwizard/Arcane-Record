import { useSyncExternalStore } from 'react';

const eventName = 'arcane-record:view-preference-change';

export function notifyLocalViewPreferenceChanged(key: string) {
  window.dispatchEvent(new CustomEvent(eventName, { detail: key }));
}

function subscribe(key: string, listener: () => void) {
  const handle = (event: Event) => {
    if ((event as CustomEvent<string>).detail === key) listener();
  };
  window.addEventListener(eventName, handle);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(eventName, handle);
    window.removeEventListener('storage', listener);
  };
}

export function useLocalBooleanPreference(key: string, fallback = false) {
  return useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value === 'true';
      } catch {
        return fallback;
      }
    },
    () => fallback,
  );
}

export function useLocalEnumPreference<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
) {
  return useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => {
      try {
        const value = localStorage.getItem(key);
        return allowed.includes(value as T) ? (value as T) : fallback;
      } catch {
        return fallback;
      }
    },
    () => fallback,
  );
}
