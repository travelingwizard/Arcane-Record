import { useState } from 'react';
import { TextField } from '../shared/LocalSheet';
import { curseAttributes, curseSkills, type CurseCharacter } from './schema';
import {
  purchaseCurseAdvance,
  quoteCurseAdvance,
  refundCurseAdvance,
} from './advancement';

export function CurseAdvancement({
  character: c,
  onChange,
}: {
  character: CurseCharacter;
  onChange: (c: CurseCharacter) => void;
}) {
  const [category, setCategory] = useState<'attribute' | 'skill'>('skill');
  const [target, setTarget] = useState<string>(curseSkills[0]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const quote = quoteCurseAdvance(c, { category, id: target });
  const perform = (operation: () => CurseCharacter) => {
    try {
      onChange(operation());
      setError('');
      setReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not apply advancement.');
    }
  };
  return (
    <details>
      <summary>Spend Experience or refund a Trait increase</summary>
      <p>
        Core p. 240. Purchases increase one dot and create a linked ledger
        entry. Entanglement is story-based, not purchased. Catalog-dependent
        purchases remain unavailable until their prerequisites are verified.
      </p>
      <label>
        Trait type
        <select
          value={category}
          onChange={(e) => {
            const value = e.target.value as typeof category;
            setCategory(value);
            setTarget(
              value === 'attribute' ? curseAttributes[0] : curseSkills[0],
            );
          }}
        >
          <option value="skill">Skill</option>
          <option value="attribute">Attribute</option>
        </select>
      </label>
      <label>
        Trait
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          {(category === 'attribute' ? curseAttributes : curseSkills).map(
            (id) => (
              <option key={id}>{id}</option>
            ),
          )}
        </select>
      </label>
      <p>
        {target}: {quote.previous} → {quote.next}. Cost: {quote.cost} EXP.
      </p>
      <TextField
        label="Advancement or refund explanation"
        value={reason}
        onChange={setReason}
      />
      {quote.issues.map((issue) => (
        <p key={issue}>{issue}</p>
      ))}
      {c.mode === 'play' && (
        <p>Switch to Build mode to change permanent Traits.</p>
      )}
      <button
        disabled={
          c.mode === 'play' || quote.issues.length > 0 || !reason.trim()
        }
        onClick={() => {
          if (
            window.confirm(
              `Spend ${quote.cost} EXP to raise ${target} from ${quote.previous} to ${quote.next}?`,
            )
          )
            perform(() =>
              purchaseCurseAdvance(c, { category, id: target }, reason),
            );
        }}
      >
        Confirm Trait purchase
      </button>
      {c.experience
        .filter(
          (e) =>
            e.kind === 'purchase' &&
            e.target &&
            !c.experience.some((r) => r.refundOf === e.id),
        )
        .map((e) => (
          <p key={e.id}>
            {e.target!.id}: {e.target!.previous} → {e.target!.next} ·{' '}
            {-e.amount} EXP{' '}
            <button
              disabled={c.mode === 'play' || !reason.trim()}
              onClick={() => {
                if (
                  window.confirm(
                    'Reverse this Trait increase and return its recorded EXP cost? Later changes will block the refund.',
                  )
                )
                  perform(() => refundCurseAdvance(c, e.id, reason));
              }}
            >
              Refund {e.target!.id} purchase
            </button>
          </p>
        ))}
      {error && <p role="alert">{error}</p>}
    </details>
  );
}
