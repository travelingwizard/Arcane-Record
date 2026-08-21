import type { BurningWheelCharacter } from './schema';

export function BurningWheelSettingsPanel({
  settings,
  onChange,
}: {
  settings: BurningWheelCharacter['burn']['settings'];
  onChange: (settings: BurningWheelCharacter['burn']['settings']) => void;
}) {
  return (
    <div className="burning-wheel-settings">
      <label className="appearance-switch">
        <input
          type="checkbox"
          role="switch"
          checked={settings.enforceLifepathRequirements}
          onChange={(event) =>
            onChange({
              ...settings,
              enforceLifepathRequirements: event.target.checked,
            })
          }
        />
        <span>
          <strong>Enforce lifepath requirements</strong>
          <small>Show only legal settings, leads, and lifepaths.</small>
        </span>
      </label>
      <label className="appearance-switch">
        <input
          type="checkbox"
          role="switch"
          checked={settings.enforcePointLimits}
          onChange={(event) =>
            onChange({ ...settings, enforcePointLimits: event.target.checked })
          }
        />
        <span>
          <strong>Enforce point limits</strong>
          <small>Block allocation changes that exceed available pools.</small>
        </span>
      </label>
      <p className="settings-help">
        Disabling enforcement leaves warnings visible and permits
        Storyteller-approved exceptions.
      </p>
      <details>
        <summary>Source and license</summary>
        <p>
          Catalogs and burner logic are adapted from Charred Black under
          GPL-3.0. Burning Wheel remains the property of its respective owners;
          Arcane Record is an unofficial fan utility.
        </p>
        <a
          href="https://github.com/modality/charred-black"
          target="_blank"
          rel="noreferrer"
        >
          View Charred Black source
        </a>
        <br />
        <a href="/licenses/charred-black/corresponding-source.json" download>
          Download this adapted module’s corresponding source
        </a>
      </details>
    </div>
  );
}
