import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyAppearancePreferences,
  defaultAppearancePreferences,
  readAppearancePreferences,
  writeAppearancePreferences,
} from './appearance-preferences';
import {
  AppearanceContext,
  type AppearanceContextValue,
} from './appearance-context';

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(readAppearancePreferences);

  useEffect(() => {
    applyAppearancePreferences(preferences);
    try {
      writeAppearancePreferences(preferences);
    } catch {
      // Appearance remains active for this session if storage is unavailable.
    }

    if (
      preferences.baseTheme !== 'system' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () =>
      applyAppearancePreferences(
        preferences,
        document.documentElement,
        query.matches,
      );
    query.addEventListener('change', updateSystemTheme);
    return () => query.removeEventListener('change', updateSystemTheme);
  }, [preferences]);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      preferences,
      setBaseTheme: (baseTheme) =>
        setPreferences((current) => ({ ...current, baseTheme })),
      setIdentityOverlay: (identityOverlay) =>
        setPreferences((current) => ({ ...current, identityOverlay })),
      setReduceMotion: (reduceMotion) =>
        setPreferences((current) => ({ ...current, reduceMotion })),
      resetAppearance: () => setPreferences(defaultAppearancePreferences),
    }),
    [preferences],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}
