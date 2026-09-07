import { useState } from 'react';
import { writeSourceDefaults, type CatalogSource } from './catalog-sources';

export function CatalogSourceSettings({
  gameId,
  sources,
  enabled,
  onChange,
}: {
  gameId: string;
  sources: readonly CatalogSource[];
  enabled: string[];
  onChange: (ids: string[]) => void;
}) {
  const [message, setMessage] = useState('');
  return (
    <fieldset>
      <legend>Sources</legend>
      <p>
        Choose books for this sheet. Turning a book off never removes existing
        selections or their effects. New catalog choices use enabled sources.
      </p>
      {sources.map((s) => (
        <label key={s.id} className="field">
          <span>
            <input
              type="checkbox"
              checked={s.required || enabled.includes(s.id)}
              disabled={s.required}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...new Set([...enabled, s.id])]
                    : enabled.filter((id) => id !== s.id),
                )
              }
            />{' '}
            {s.title}
            {s.required ? ' — required' : ''}
          </span>
          <small>
            {s.classification === 'official'
              ? 'Official source'
              : 'Community source'}
          </small>
        </label>
      ))}
      {enabled
        .filter((id) => !sources.some((s) => s.id === id))
        .map((id) => (
          <p key={id}>Unresolved source preserved: {id}</p>
        ))}
      <button
        className="secondary-button"
        type="button"
        onClick={() => {
          try {
            writeSourceDefaults(gameId, sources, enabled);
            setMessage(
              'Source defaults saved in this browser. Existing sheets are unchanged.',
            );
          } catch {
            setMessage(
              'Could not save browser defaults. This sheet’s selections remain unchanged.',
            );
          }
        }}
      >
        Use these sources for new sheets
      </button>
      <p role="status">{message}</p>
    </fieldset>
  );
}
