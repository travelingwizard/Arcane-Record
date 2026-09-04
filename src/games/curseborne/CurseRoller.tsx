import { useState } from 'react';
import { TextField } from '../shared/LocalSheet';
import { curseDiceLimit, rollCurseDice, type CurseRollInput } from './dice';
import type { CurseCharacter } from './schema';

export function CurseRoller({
  character: c,
  onChange,
}: {
  character: CurseCharacter;
  onChange: (c: CurseCharacter) => void;
}) {
  const [input, setInput] = useState<Omit<CurseRollInput, 'held'>>({
    pool: 5,
    difficulty: 1,
    enhancement: 0,
    stackingEnhancement: 0,
    preRollHits: 0,
    doubleNines: false,
    checkAltered: false,
    context: '',
  });
  const limit = curseDiceLimit(c.entanglement);
  return (
    <>
      <h3>Dice roller</h3>
      <p>
        Core pp. 178–179, 243–245. Held curse dice replace ordinary dice. Roll
        before paying a spell’s bleed cost; rolling does not spend resources.
      </p>
      {limit === null ? (
        <p role="status">
          No verified curse-dice cap for this Entanglement is available in the
          core book.
        </p>
      ) : (
        c.curseDice + c.temporaryCurseDice > limit && (
          <p role="status">
            Held curse dice exceed the normal limit of {limit}. Review the
            effect granting extra dice.
          </p>
        )
      )}
      {(
        [
          ['pool', 'Total dice pool', 1, 10],
          ['difficulty', 'Difficulty', 0, 100],
          ['enhancement', 'Highest non-stacking Enhancement', 0, 3],
          ['stackingEnhancement', 'Total stacking Enhancement', 0, 5],
          ['preRollHits', 'Hits explicitly granted before the roll', 0, 100],
        ] as const
      ).map(([key, label, min, max]) => (
        <label key={key}>
          {label}
          <input
            type="number"
            min={min}
            max={max}
            value={input[key]}
            onChange={(e) =>
              setInput({
                ...input,
                [key]: Math.max(
                  min,
                  Math.min(max, Math.trunc(Number(e.target.value))),
                ),
              })
            }
          />
        </label>
      ))}
      <p>
        Each Enhancement source is normally capped at +3, with +5 combined.
        Apply only sources relevant to this action. Advantage and opposed-roll
        adjudication remain with the table.
      </p>
      <label>
        <input
          type="checkbox"
          checked={input.doubleNines}
          onChange={(e) =>
            setInput({ ...input, doubleNines: e.target.checked })
          }
        />
        An effect grants double 9s
      </label>
      <label>
        <input
          type="checkbox"
          checked={input.checkAltered}
          onChange={(e) =>
            setInput({ ...input, checkAltered: e.target.checked })
          }
        />
        Check altered outcomes (spell, ritual, liminality, or Storyguide ruling)
      </label>
      <TextField
        label="Roll context"
        value={input.context}
        onChange={(context) => setInput({ ...input, context })}
      />
      <button
        onClick={() =>
          onChange({
            ...c,
            rolls: [
              ...c.rolls,
              rollCurseDice({
                ...input,
                held: c.curseDice + c.temporaryCurseDice,
              }),
            ],
          })
        }
      >
        Roll ordinary and curse dice
      </button>
      <details open>
        <summary>Roll history ({c.rolls.length})</summary>
        {[...c.rolls].reverse().map((roll) => (
          <article key={roll.id}>
            <h4>
              {roll.input.context || 'Action'} ·{' '}
              {roll.success ? 'Success' : 'Failure'} · {roll.total} hits
            </h4>
            <p>
              {roll.date.slice(0, 19)} · Difficulty {roll.input.difficulty} ·
              Remaining hits {roll.remainingHits}
            </p>
            <p>
              {roll.dice.map((d, i) => (
                <span key={i}>
                  {d.curse ? 'Curse' : 'Ordinary'}: {d.face}
                  {i < roll.dice.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </p>
            <p>
              Rolled hits {roll.rolledHits}; curse hits {roll.curseHits};
              pre-roll hits {roll.input.preRollHits}; applied Enhancement{' '}
              {roll.appliedEnhancement}.
            </p>
            {roll.input.checkAltered && roll.curseHits > 0 && (
              <p role="status">
                {roll.success
                  ? 'Check for wicked success if this becomes a success with consequences or an exceptional success.'
                  : 'Cruel failure: discuss the consequence with the Storyguide.'}{' '}
                Narrative consequences are not applied automatically.
              </p>
            )}
          </article>
        ))}
        {c.rolls.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Clear this character’s saved roll history?'))
                onChange({ ...c, rolls: [] });
            }}
          >
            Clear roll history
          </button>
        )}
      </details>
    </>
  );
}
