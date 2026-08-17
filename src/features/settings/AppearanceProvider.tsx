import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  applyAppearancePreferences,
  type AppearancePreferences,
  defaultAppearancePreferences,
  getEffectiveAppearance,
  readAppearancePreferences,
  writeAppearancePreferences,
} from './appearance-preferences';
import {
  AppearanceContext,
  type AppearanceContextValue,
} from './appearance-context';

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState(readAppearancePreferences);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(
    null,
  );
  const preferences = getEffectiveAppearance(store, activeCharacterId);

  useEffect(() => {
    applyAppearancePreferences(preferences);
    try {
      writeAppearancePreferences(store);
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
  }, [preferences, store]);

  const updateCurrent = useCallback(
    (updater: (current: AppearancePreferences) => AppearancePreferences) => {
      setStore((current) => {
        const effective = getEffectiveAppearance(current, activeCharacterId);
        if (!activeCharacterId) {
          return { ...current, defaultAppearance: updater(effective) };
        }
        return {
          ...current,
          characterAppearances: {
            ...current.characterAppearances,
            [activeCharacterId]: updater(effective),
          },
        };
      });
    },
    [activeCharacterId],
  );

  const value = useMemo<AppearanceContextValue>(
    () => ({
      store,
      activeCharacterId,
      preferences,
      setActiveCharacterId,
      setBaseTheme: (baseTheme) =>
        updateCurrent((current) => ({ ...current, baseTheme })),
      setIdentityOverlay: (identityOverlay) =>
        updateCurrent((current) => ({ ...current, identityOverlay })),
      setReduceMotion: (reduceMotion) =>
        updateCurrent((current) => ({ ...current, reduceMotion })),
      setCustomBackground: (customBackground) =>
        updateCurrent((current) => ({
          ...current,
          baseTheme: 'custom-background',
          customBackground,
        })),
      setCurrentAsDefault: () =>
        setStore((current) => ({
          ...current,
          defaultAppearance: getEffectiveAppearance(current, activeCharacterId),
        })),
      applyCurrentUniversally: () =>
        setStore((current) => ({
          ...current,
          defaultAppearance: getEffectiveAppearance(current, activeCharacterId),
          characterAppearances: {},
        })),
      removeCharacterOverride: (characterId) =>
        setStore((current) => {
          const characterAppearances = { ...current.characterAppearances };
          delete characterAppearances[characterId];
          return { ...current, characterAppearances };
        }),
      resetAppearance: () => {
        if (!activeCharacterId) {
          updateCurrent(() => ({ ...defaultAppearancePreferences }));
          return;
        }
        setStore((current) => {
          const characterAppearances = { ...current.characterAppearances };
          delete characterAppearances[activeCharacterId];
          return { ...current, characterAppearances };
        });
      },
    }),
    [activeCharacterId, preferences, store, updateCurrent],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}
