import { useState } from 'react';
import type { Exalted1eCharacter } from '../../schema';
import {
  getDragonBloodedEssenceExperienceCost,
  getExperienceTotals,
} from './rules';

interface Props {
  character: Exalted1eCharacter;
  onChange: (character: Exalted1eCharacter) => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ExperienceSection({ character, onChange }: Props) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [entryType, setEntryType] = useState<'award' | 'refund' | 'adjustment'>(
    'award',
  );
  const [showSpend, setShowSpend] = useState(false);
  const [showDowntime, setShowDowntime] = useState(false);
  const totals = getExperienceTotals(character.experienceLedger);
  const essenceCost = getDragonBloodedEssenceExperienceCost(
    character.essence.rating,
  );

  const appendLedger = (
    type: 'award' | 'purchase' | 'refund' | 'adjustment',
    signedAmount: number,
    details: Partial<Exalted1eCharacter['experienceLedger'][number]> = {},
  ) => {
    const entry: Exalted1eCharacter['experienceLedger'][number] = {
      id: crypto.randomUUID(),
      date: today(),
      session: '',
      type,
      amount: signedAmount,
      category: details.category ?? 'General',
      targetId: details.targetId ?? null,
      targetName: details.targetName ?? '',
      previousRating: details.previousRating ?? null,
      newRating: details.newRating ?? null,
      description: details.description ?? description.trim(),
      notes: details.notes ?? '',
      createdAt: new Date().toISOString(),
    };
    onChange({
      ...character,
      experienceLedger: [...character.experienceLedger, entry],
    });
  };

  const addManual = () => {
    const parsed = Number.parseInt(amount, 10);
    if (!Number.isInteger(parsed) || parsed === 0) return;
    const signed =
      entryType === 'award' || entryType === 'refund'
        ? Math.abs(parsed)
        : parsed;
    appendLedger(entryType, signed);
    setAmount('');
    setDescription('');
  };

  const raiseEssence = (spendXp: boolean) => {
    if (spendXp && totals.available < essenceCost) return;
    const previous = character.essence.rating;
    onChange({
      ...character,
      essence: { ...character.essence, rating: previous + 1 },
      experienceLedger: spendXp
        ? [
            ...character.experienceLedger,
            {
              id: crypto.randomUUID(),
              date: today(),
              session: '',
              type: 'purchase',
              amount: -essenceCost,
              category: 'Essence',
              targetId: 'essence',
              targetName: 'Essence',
              previousRating: previous,
              newRating: previous + 1,
              description: `Raised Essence from ${previous} to ${previous + 1}`,
              notes: `Dragon-Blooded cost: current rating ${previous} × 10 XP.`,
              createdAt: new Date().toISOString(),
            },
          ]
        : character.experienceLedger,
    });
  };

  const addDowntime = () =>
    onChange({
      ...character,
      downtimeAdvancement: [
        ...character.downtimeAdvancement,
        {
          id: crypto.randomUUID(),
          startYear: '',
          endYear: '',
          yearsElapsed: 0,
          attributesWillpowerGained: '',
          abilitiesVirtuesGained: '',
          backgroundsGained: '',
          essenceIncrease: 0,
          charmsLearned: '',
          comboLearned: '',
          notes: '',
          createdAt: new Date().toISOString(),
        },
      ],
    });

  return (
    <>
      <div className="exalted-trait-totals" aria-label="Experience totals">
        <strong>Current Experience: {totals.available}</strong>
        <strong>Total Experience: {totals.lifetimeEarned}</strong>
        <strong>Lifetime spent: {totals.lifetimeSpent}</strong>
      </div>
      <div className="exalted-action-row">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setShowSpend((value) => !value)}
        >
          Spend Experience
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setShowDowntime((value) => !value)}
        >
          Downtime Advancement
        </button>
      </div>
      {showSpend ? (
        <div className="exalted-workflow-card">
          <h3>Raise Essence</h3>
          <p>
            Current {character.essence.rating} · Proposed{' '}
            {character.essence.rating + 1} · Cost {essenceCost} XP
          </p>
          <p className="section-note">
            Dragon-Blooded override: current Essence × 10 XP.
          </p>
          {totals.available < essenceCost ? (
            <p className="exalted-trait-warning">
              Insufficient XP. Add Without Spending XP remains available for
              awards and unusual cases.
            </p>
          ) : null}
          <div className="exalted-action-row">
            <button
              type="button"
              className="primary-button"
              disabled={
                totals.available < essenceCost || character.essence.rating >= 6
              }
              onClick={() => raiseEssence(true)}
            >
              Confirm purchase
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={character.essence.rating >= 6}
              onClick={() => raiseEssence(false)}
            >
              Add Without Spending XP
            </button>
          </div>
        </div>
      ) : null}
      <div className="exalted-workflow-card">
        <h3>Add Award or Manual Adjustment</h3>
        <div className="exalted-background-add">
          <label>
            <span>Type</span>
            <select
              value={entryType}
              onChange={(event) =>
                setEntryType(event.target.value as typeof entryType)
              }
            >
              <option value="award">Award</option>
              <option value="refund">Refund</option>
              <option value="adjustment">Manual adjustment</option>
            </select>
          </label>
          <label>
            <span>Signed amount</span>
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label>
            <span>Description</span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="secondary-button"
            onClick={addManual}
          >
            Add entry
          </button>
        </div>
      </div>
      {showDowntime ? (
        <div className="exalted-workflow-card">
          <h3>Downtime Advancement</h3>
          <p className="section-note">
            Downtime records are shown in history but never converted into fake
            XP transactions.
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={addDowntime}
          >
            Add downtime record
          </button>
        </div>
      ) : null}
      <h3>Experience History</h3>
      <div className="exalted-record-list">
        {[...character.experienceLedger].reverse().map((entry) => (
          <details className="exalted-compact-record" key={entry.id}>
            <summary>
              <strong>
                {entry.description || entry.targetName || entry.type}
              </strong>
              <span>
                {entry.amount > 0 ? '+' : ''}
                {entry.amount} XP · {entry.date}
              </span>
            </summary>
            <p>
              {entry.category}
              {entry.notes ? ` · ${entry.notes}` : ''}
            </p>
          </details>
        ))}
        {[...character.downtimeAdvancement].reverse().map((entry) => (
          <details className="exalted-compact-record" key={entry.id}>
            <summary>
              <strong>Downtime advancement</strong>
              <span>
                {entry.startYear || 'Start'}–{entry.endYear || 'End'} ·{' '}
                {entry.yearsElapsed} years
              </span>
            </summary>
            <div className="exalted-record-fields">
              {(
                [
                  'startYear',
                  'endYear',
                  'attributesWillpowerGained',
                  'abilitiesVirtuesGained',
                  'backgroundsGained',
                  'charmsLearned',
                  'comboLearned',
                  'notes',
                ] as const
              ).map((field) => (
                <label key={field}>
                  <span>{field.replace(/([A-Z])/g, ' $1')}</span>
                  <textarea
                    value={entry[field]}
                    onChange={(event) =>
                      onChange({
                        ...character,
                        downtimeAdvancement: character.downtimeAdvancement.map(
                          (item) =>
                            item.id === entry.id
                              ? { ...item, [field]: event.target.value }
                              : item,
                        ),
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </details>
        ))}
        {!character.experienceLedger.length &&
        !character.downtimeAdvancement.length ? (
          <p className="empty-inline">No experience history recorded.</p>
        ) : null}
      </div>
    </>
  );
}
