import { useState } from 'react';
import { TextField } from '../shared/LocalSheet';
import type { CurseCharacter } from './schema';
import {
  advanceEntanglement,
  bleedCurseDice,
  resetCurseScene,
  resetCurseStory,
} from './resources';

export function CurseResources({
  character: c,
  onChange,
}: {
  character: CurseCharacter;
  onChange: (c: CurseCharacter) => void;
}) {
  const [held, setHeld] = useState(0),
    [temporary, setTemporary] = useState(0),
    [reason, setReason] = useState(''),
    [approved, setApproved] = useState(false),
    [error, setError] = useState('');
  const perform = (operation: () => CurseCharacter) => {
    try {
      onChange(operation());
      setError('');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not apply resource change.',
      );
    }
  };
  return (
    <details>
      <summary>Spell costs, scene/story resets & story advancement</summary>
      <p>
        Core pp. 226, 240, 243–244. The held counter excludes the separately
        recorded temporary dice; both replace ordinary dice when rolling.
        Holding a minimum does not spend dice. Roll first, then confirm bleed
        costs.
      </p>
      {(['held', 'temporary'] as const).map((key) => (
        <label key={key}>
          {key === 'held'
            ? 'Non-temporary dice to bleed'
            : 'Temporary dice to bleed'}
          <input
            type="number"
            min={0}
            value={key === 'held' ? held : temporary}
            onChange={(e) =>
              (key === 'held' ? setHeld : setTemporary)(
                Math.max(0, Math.trunc(Number(e.target.value))),
              )
            }
          />
        </label>
      ))}
      <TextField
        label="Spell, effect, or completed-story explanation"
        value={reason}
        onChange={setReason}
      />
      <button
        disabled={
          !reason.trim() ||
          held + temporary === 0 ||
          held > c.curseDice ||
          temporary > c.temporaryCurseDice
        }
        onClick={() => {
          if (
            window.confirm(
              `Bleed ${held} held and ${temporary} temporary dice? This does not roll or decide the spell outcome.`,
            )
          )
            perform(() => bleedCurseDice(c, held, temporary, reason));
        }}
      >
        Confirm bleed cost
      </button>
      <label>
        <input
          type="checkbox"
          checked={c.temporaryDiceRisk}
          onChange={(e) =>
            onChange({ ...c, temporaryDiceRisk: e.target.checked })
          }
        />
        Temporary dice use the risky double-Entanglement torment option
      </label>
      <p>
        For that option, any unbled temporary dice at scene end remove all curse
        dice and trigger Damnation. Mark it only when the table selected that
        option.
      </p>
      <button
        onClick={() => {
          if (
            window.confirm(
              c.temporaryDiceRisk && c.temporaryCurseDice > 0
                ? 'End scene: unbled risky temporary dice will remove ALL curse dice. Resolve Damnation with the Storyguide. Continue?'
                : 'End scene and remove temporary curse dice? Other resources will not reset.',
            )
          )
            perform(() => resetCurseScene(c));
        }}
      >
        End scene — review and reset
      </button>
      <button
        onClick={() => {
          if (
            window.confirm(
              'Start a new story? Replace all held and temporary curse dice with one held die. Keep injuries, EXP, notes and history.',
            )
          )
            perform(() => resetCurseStory(c));
        }}
      >
        Start story — set curse dice to one
      </button>
      <h4>Story-based Entanglement</h4>
      <label>
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
        />
        Players and Storyguide agree that a completed story warrants an increase
      </label>
      {c.entanglement >= 4 && (
        <p>
          Core rules only detail Entanglement 1–4. Further progression requires
          additional rules; the sheet will not invent its benefits or dice caps.
        </p>
      )}
      <button
        disabled={
          c.mode === 'play' ||
          !approved ||
          !reason.trim() ||
          c.entanglement >= 10
        }
        onClick={() => {
          if (
            window.confirm(
              `Raise Entanglement ${c.entanglement} → ${c.entanglement + 1} without spending EXP?`,
            )
          )
            perform(() => advanceEntanglement(c, reason, approved));
        }}
      >
        Confirm story advancement
      </button>
      {error && <p role="alert">{error}</p>}
      <details>
        <summary>Resource history ({c.resourceHistory.length})</summary>
        {[...c.resourceHistory].reverse().map((e) => (
          <p key={e.id}>
            {e.date.slice(0, 19)} · {e.description}
          </p>
        ))}
      </details>
    </details>
  );
}
