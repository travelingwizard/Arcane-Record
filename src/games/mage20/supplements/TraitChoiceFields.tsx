import { useState } from 'react';
import { spheres } from '../../../systems/mage-m20/definitions';
import { useEditorStore } from '../../../state/editor-store';
import type { MageTraitChoice } from './trait-choice';

export function TraitChoiceFields({
  definitionId,
  choice,
  onChange,
}: {
  definitionId: string;
  choice?: MageTraitChoice;
  onChange: (choice: MageTraitChoice) => void;
}) {
  const locked = useEditorStore(
    (s) => s.character?.sheetLayout.mode === 'play',
  );
  const [sphere, setSphere] = useState(choice?.sphere ?? 'forces');
  const [pricing, setPricing] = useState(choice?.pricing ?? 'printed-table');
  const [reason, setReason] = useState(choice?.reason ?? '');
  const [approved, setApproved] = useState(false);
  if (!['sphere-natural', 'sphere-inept'].includes(definitionId)) return null;
  return (
    <fieldset>
      <legend>Sphere Trait choice</legend>
      <p>
        Book of Secrets, pp. 79, 94: the printed tables and percentage wording
        do not agree in every cell. Confirm which interpretation your table
        uses. No history is repriced.
      </p>
      {choice && (
        <p>
          Recorded: {choice.sphere} · {choice.pricing} · {choice.reason}
        </p>
      )}
      <label>
        Affected Sphere
        <select
          disabled={locked}
          value={sphere}
          onChange={(e) =>
            setSphere(e.target.value as MageTraitChoice['sphere'])
          }
        >
          {spheres.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        GM pricing interpretation
        <select
          disabled={locked}
          value={pricing}
          onChange={(e) =>
            setPricing(e.target.value as MageTraitChoice['pricing'])
          }
        >
          <option value="printed-table">Use printed cost table</option>
          <option value="percentage">
            Use 70% / 130% of base cost, rounded up
          </option>
        </select>
      </label>
      <label>
        Ruling and story justification
        <input
          disabled={locked}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setApproved(false);
          }}
        />
      </label>
      <label>
        <input
          type="checkbox"
          disabled={locked}
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
        />
        GM Approved this interpretation
      </label>
      <button
        disabled={locked || !approved || !reason.trim()}
        onClick={() => {
          onChange({
            sphere,
            pricing,
            reason: reason.trim(),
            approvedAt: new Date().toISOString(),
          });
          setApproved(false);
        }}
      >
        Confirm Sphere Trait choice
      </button>
      {locked && <p>Switch to Build mode to edit this permanent choice.</p>}
    </fieldset>
  );
}
