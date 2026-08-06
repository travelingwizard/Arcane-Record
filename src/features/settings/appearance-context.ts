import { createContext, useContext } from 'react';
import type {
  AppearancePreferences,
  BaseThemeId,
  IdentityOverlayId,
} from './appearance-preferences';

export interface AppearanceContextValue {
  preferences: AppearancePreferences;
  setBaseTheme: (theme: BaseThemeId) => void;
  setIdentityOverlay: (overlay: IdentityOverlayId) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
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
