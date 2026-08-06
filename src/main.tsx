import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AppearanceProvider } from './features/settings/AppearanceProvider';
import {
  applyAppearancePreferences,
  readAppearancePreferences,
} from './features/settings/appearance-preferences';
import './styles/index.css';

applyAppearancePreferences(readAppearancePreferences());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppearanceProvider>
      <App />
    </AppearanceProvider>
  </StrictMode>,
);
