import { createContext, useContext } from 'react';
import type {
  AppearancePreferenceStore,
  AppearancePreferences,
  BaseThemeId,
  IdentityOverlayId,
} from './appearance-preferences';

export interface AppearanceContextValue {
  store: AppearancePreferenceStore;
  activeCharacterId: string | null;
  preferences: AppearancePreferences;
  setActiveCharacterId: (characterId: string | null) => void;
  setBaseTheme: (theme: BaseThemeId) => void;
  setIdentityOverlay: (overlay: IdentityOverlayId) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  setCustomBackground: (color: string) => void;
  setCurrentAsDefault: () => void;
  applyCurrentUniversally: () => void;
  removeCharacterOverride: (characterId: string) => void;
  resetAppearance: () => void;
}

export const AppearanceContext = createContext<AppearanceContextValue | null>(
  null,
);

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used inside AppearanceProvider');
  }
  return context;
}
