import { useState } from 'react';
import type { MageCharacter } from '../../../types/character';
import { useEditorStore } from '../../../state/editor-store';
import {
  SheetField,
  SheetNotice,
} from '../../../components/layout/SheetPrimitives';
import {
  advancementQuote,
  developmentFor,
  experienceTotals,
  mageTraits,
  purchaseTrait,
  recordExperience,
  refundPurchase,
} from './rules';

export function MageAdvancement() {
  const c = useEditorStore((s) => s.character)!;
  const update = useEditorStore((s) => s.updateMage);
  const [target, setTarget] = useState('');
  const [description, setDescription] = useState('');
  const [approved, setApproved] = useState(false);
  const [amount, setAmount] = useState(0);
  const [kind, setKind] = useState<'award' | 'adjustment'>('award');
  const [error, setError] = useState('');
  const dev = developmentFor(c),
    totals = experienceTotals(dev.ledger);
  const traits = mageTraits(c),
    selected = traits.find((t) => t.key === target),
    quote = advancementQuote(c, target);
  const perform = (fn: (character: MageCharacter) => MageCharacter) => {
    try {
      update(fn);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <div className="mage-advancement">
      <p>
        <strong>Total Experience: {totals.total}</strong> ·{' '}
        <strong>Current Experience: {totals.current}</strong>
      </p>
      <p className="section-note">
        M20, pp. 253, 335–338. Storyteller approval and training are required;
        Arete increases require a Seeking.
      </p>
      <details className="sheet-card sheet-card--compact mage-advancement-panel">
        <summary>Award or adjust XP</summary>
        <SheetField label="XP entry type">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option value="award">Award earned XP</option>
            <option value="adjustment">Adjust available XP only</option>
          </select>
        </SheetField>
        <SheetField label="XP amount">
          <input
            type="number"
            step="1"
            value={amount}
            onChange={(e) => setAmount(Math.trunc(Number(e.target.value)))}
          />
        </SheetField>
        <SheetField label="XP entry explanation">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </SheetField>
        <button
          className="primary-button"
          disabled={!description.trim()}
          onClick={() =>
            perform((current) =>
              recordExperience(current, kind, amount, description),
            )
          }
        >
          Record XP entry
        </button>
      </details>
      <details className="sheet-card sheet-card--compact mage-advancement-panel">
        <summary>Spend Experience</summary>
        <SheetField label="Advancement Trait">
          <select
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setApproved(false);
            }}
          >
            <option value="">Choose a Trait</option>
            {traits.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label} ({t.rating})
              </option>
            ))}
          </select>
        </SheetField>
        {selected && (
          <>
            <p>
              {selected.label}: {selected.rating} → {selected.rating + 1}
            </p>
            <p>
              {quote.explanation}{' '}
              {quote.cost !== null && <strong>Cost: {quote.cost} XP</strong>}
            </p>
            {quote.issue && (
              <SheetNotice tone="warning">{quote.issue}</SheetNotice>
            )}
            <SheetField label="Training, Seeking or story justification">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </SheetField>
            <label>
              <input
                type="checkbox"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
              />
              GM Approved this advancement and its narrative prerequisites
            </label>
            <div className="button-row">
              <button
                className="primary-button"
                disabled={
                  !approved ||
                  !description.trim() ||
                  !!quote.issue ||
                  quote.cost === null ||
                  totals.current < (quote.cost ?? 0)
                }
                onClick={() =>
                  perform((current) =>
                    purchaseTrait(current, target, description, approved),
                  )
                }
              >
                Confirm XP purchase
              </button>
              <button
                className="secondary-button"
                disabled={!approved || !description.trim()}
                onClick={() =>
                  perform((current) =>
                    purchaseTrait(current, target, description, approved, true),
                  )
                }
              >
                Add Without Spending XP
              </button>
            </div>
            {quote.cost !== null && quote.cost > totals.current && (
              <p>Insufficient XP for this purchase.</p>
            )}
          </>
        )}
      </details>
      {error && (
        <SheetNotice tone="danger" role="alert">
          {error}
        </SheetNotice>
      )}
      <details className="sheet-card sheet-card--compact mage-advancement-panel">
        <summary>Experience History ({dev.ledger.length})</summary>
        {dev.ledger.map((e) => (
          <article className="sheet-card sheet-card--compact" key={e.id}>
            <strong>
              {e.date} · {e.kind} · {e.amount > 0 ? '+' : ''}
              {e.amount} XP
            </strong>
            <p>{e.description}</p>
            {e.target && (
              <p>
                {traits.find((t) => t.key === e.target)?.label ?? e.target}:{' '}
                {e.previous} → {e.next} · {e.approved ? 'GM Approved' : ''}
              </p>
            )}
            {e.kind === 'purchase' &&
              !dev.ledger.some((r) => r.reverses === e.id) && (
                <button
                  className="secondary-button"
                  onClick={() =>
                    perform((current) => refundPurchase(current, e.id))
                  }
                >
                  Refund purchase and restore rating
                </button>
              )}
          </article>
        ))}
      </details>
      <details className="sheet-card sheet-card--compact mage-advancement-panel">
        <summary>Creation record and personal history</summary>
        <p>
          {dev.status} · {dev.finalizedAt ?? 'No recorded finalization'}
        </p>
        {Object.entries(dev.details).map(([key, value]) => (
          <SheetField key={key} label={key}>
            <textarea
              readOnly={c.sheetLayout.mode === 'play'}
              value={value}
              onChange={(e) =>
                update((current) => ({
                  ...current,
                  development: {
                    ...developmentFor(current),
                    details: {
                      ...developmentFor(current).details,
                      [key]: e.target.value,
                    },
                  },
                }))
              }
            />
          </SheetField>
        ))}
        {dev.baseline && (
          <ul>
            {Object.entries(dev.baseline.approvals).map(([key, approval]) => (
              <li key={key}>
                GM Approved {key}: {approval.reason} ({approval.at})
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}
