import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AppearanceProvider } from './features/settings/AppearanceProvider';
import {
  applyAppearancePreferences,
  getEffectiveAppearance,
  readAppearancePreferences,
} from './features/settings/appearance-preferences';
import './styles/index.css';
import {
  readGlobalPreferences,
  writeGlobalPreferences,
} from './features/settings/global-preferences';

applyAppearancePreferences(
  getEffectiveAppearance(readAppearancePreferences(), null),
);
writeGlobalPreferences(readGlobalPreferences());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppearanceProvider>
      <App />
    </AppearanceProvider>
  </StrictMode>,
);
