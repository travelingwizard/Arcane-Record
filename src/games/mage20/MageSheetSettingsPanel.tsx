import {
  setDesktopSphereWheel,
  setSphereSortMode,
  sphereSortModes,
  useMageSheetPreferences,
} from './mage-sheet-preferences';
import type { SphereSortMode } from '../../systems/mage-m20/definitions';

export function MageSheetSettingsPanel() {
  const preferences = useMageSheetPreferences();

  return (
    <fieldset className="appearance-group mage-sheet-settings-panel">
      <legend>Spheres</legend>
      <label>
        <span>Sphere order</span>
        <select
          value={preferences.sphereSortMode}
          onChange={(event) =>
            setSphereSortMode(event.target.value as SphereSortMode)
          }
        >
          {sphereSortModes.map(({ value, label }) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="appearance-switch">
        <input
          type="checkbox"
          role="switch"
          checked={preferences.desktopSphereWheel}
          onChange={(event) => setDesktopSphereWheel(event.target.checked)}
        />
        <span>
          <strong>Desktop Sphere wheel</strong>
          <small>Mobile always uses the accessible vertical Sphere list.</small>
        </span>
      </label>
    </fieldset>
  );
}
