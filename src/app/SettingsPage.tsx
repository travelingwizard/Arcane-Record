import { useState } from 'react';
import { AppearancePanel } from '../features/settings/AppearanceSettings';
import {
  defaultGlobalPreferences,
  readGlobalPreferences,
  writeGlobalPreferences,
} from '../features/settings/global-preferences';

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const [global, setGlobal] = useState(readGlobalPreferences);
  const update = (next: typeof global) => {
    setGlobal(next);
    writeGlobalPreferences(next);
  };
  return (
    <main className="app-shell neutral-shell settings-page">
      <button className="text-button" onClick={onBack}>
        ← Character library
      </button>
      <p className="eyebrow">Application preferences</p>
      <h1>Settings</h1>
      <section
        className="global-settings"
        aria-labelledby="global-appearance-title"
      >
        <h2 id="global-appearance-title">Global appearance</h2>
        <p>
          Controls the neutral library, creation flow, and shared app pages.
        </p>
        <label>
          <span>Color appearance</span>
          <select
            value={global.appearance}
            onChange={(event) =>
              update({
                ...global,
                appearance: event.target.value as typeof global.appearance,
              })
            }
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="appearance-switch">
          <input
            type="checkbox"
            role="switch"
            checked={global.reduceMotion}
            onChange={(event) =>
              update({ ...global, reduceMotion: event.target.checked })
            }
          />
          <span>
            <strong>Reduce global motion</strong>
            <small>Limits decorative transitions outside game sheets.</small>
          </span>
        </label>
        <button
          className="small-button small-button--quiet"
          onClick={() => update(defaultGlobalPreferences)}
        >
          Reset global preferences
        </button>
      </section>
      <AppearancePanel gameLabel="all character sheets" />
    </main>
  );
}
