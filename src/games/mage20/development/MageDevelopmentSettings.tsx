import { useState } from 'react';
import { useEditorStore } from '../../../state/editor-store';
import { developmentFor, newCreationDraft } from './rules';

export function MageDevelopmentSettings() {
  const c = useEditorStore((s) => s.character);
  const update = useEditorStore((s) => s.updateMage);
  const [confirm, setConfirm] = useState(false);
  if (!c) return null;
  const dev = developmentFor(c);
  return (
    <fieldset className="appearance-group">
      <legend>Mage creation and advancement</legend>
      <label>
        <input
          type="checkbox"
          role="switch"
          checked={dev.backgroundXp}
          onChange={(e) =>
            update((current) => ({
              ...current,
              development: {
                ...developmentFor(current),
                backgroundXp: e.target.checked,
              },
            }))
          }
        />
        Allow eligible Background XP purchases with GM approval
      </label>
      <button
        disabled={c.sheetLayout.mode === 'play' || !!dev.draft}
        onClick={() => setConfirm(true)}
      >
        {dev.baseline ? 'Reopen Character Creator' : 'Start guided creation'}
      </button>
      {c.sheetLayout.mode === 'play' && (
        <p>Switch to Build mode to reopen creation.</p>
      )}
      {confirm && (
        <div>
          <p>
            This opens a separate creation draft. Existing ratings and play
            state are retained until you review and confirm changes. Manual
            sheets have no reconstructed creation history; draft allocations are
            additions to the existing baseline.
          </p>
          <button
            onClick={() => {
              update((current) => ({
                ...current,
                development: {
                  ...developmentFor(current),
                  draft: newCreationDraft(current),
                },
              }));
              setConfirm(false);
            }}
          >
            Confirm open creation draft
          </button>
          <button onClick={() => setConfirm(false)}>Cancel</button>
        </div>
      )}
      {dev.draft && (
        <button
          onClick={() =>
            update((current) => ({
              ...current,
              development: {
                ...developmentFor(current),
                draft: null,
                status: developmentFor(current).baseline
                  ? 'finalized'
                  : 'manual',
              },
            }))
          }
        >
          Discard creation draft (keep sheet)
        </button>
      )}
    </fieldset>
  );
}
