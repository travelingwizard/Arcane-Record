import { useState } from 'react';
import { useEditorStore } from '../../../state/editor-store';
import { mageSources, saveMageSourceDefaults } from './sources';

export function MageSourceSettings() {
  const c = useEditorStore((s) => s.character);
  const update = useEditorStore((s) => s.updateMage);
  const [message, setMessage] = useState('');
  if (!c) return null;
  const preferences = c.sourcePreferences ?? {
    enabled: ['mage-20'],
    mature: false,
  };
  return (
    <fieldset className="appearance-group">
      <legend>Sources</legend>
      <p>
        Books control new catalog selections. Existing character records and
        rules are retained.
      </p>
      {mageSources.map((source) => (
        <label className="appearance-switch" key={source.id}>
          <input
            type="checkbox"
            checked={source.required || preferences.enabled.includes(source.id)}
            disabled={source.required}
            onChange={(e) =>
              update((current) => ({
                ...current,
                sourcePreferences: {
                  ...preferences,
                  enabled: e.target.checked
                    ? [...new Set([...preferences.enabled, source.id])]
                    : preferences.enabled.filter((id) => id !== source.id),
                },
              }))
            }
          />
          <span>
            {source.name} · {source.kind}
            {source.required ? ' · required' : ''}
          </span>
        </label>
      ))}
      <label className="appearance-switch">
        <input
          type="checkbox"
          checked={preferences.mature}
          onChange={(e) =>
            update((current) => ({
              ...current,
              sourcePreferences: { ...preferences, mature: e.target.checked },
            }))
          }
        />
        Allow mature catalog material
      </label>
      <button
        onClick={() => {
          try {
            saveMageSourceDefaults(preferences);
            setMessage('Saved in this browser');
          } catch {
            setMessage('Unable to save browser defaults.');
          }
        }}
      >
        Use these sources for new Mage characters
      </button>
      <p role="status">{message}</p>
    </fieldset>
  );
}
