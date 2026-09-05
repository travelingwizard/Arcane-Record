import { useState } from 'react';
import { TextField } from '../shared/LocalSheet';
import type { CityCharacter } from './schema';

const momentOptions = [
  ['broad-tag', 'Choose another broad power tag'],
  ['extra-ally', 'Gain an extra Ally theme'],
  ['extra-base', 'Gain an extra Base of Operations theme'],
  ['extra-ride', 'Gain an extra Ride theme'],
  ['closure', 'Get Closure from a Nemesis'],
  ['transformation', 'Go through a transformation'],
  ['leave-city', 'Leave the City'],
  ['dynamite-core', 'Make one core move permanently Dynamite!'],
  ['see-through-mist', 'See through the Mist'],
] as const;

export function CityStorySection({
  character: c,
  onChange,
}: {
  character: CityCharacter;
  onChange: (character: CityCharacter) => void;
}) {
  const [moment, setMoment] = useState<string>(momentOptions[0][0]);
  const [notes, setNotes] = useState('');
  const selected = momentOptions.find(([id]) => id === moment)!;
  return (
    <div className="city-story-layout">
      <section className="city-sheet-panel">
        <h3>Story Tags</h3>
        {c.playRecords.tags.length === 0 ? (
          <p>No structured Story Tags.</p>
        ) : (
          c.playRecords.tags.map((tag) => (
            <div className="city-ruled-row" key={tag.id}>
              <strong>{tag.name}</strong>
              <span>
                {tag.duration} · {tag.state}
              </span>
            </div>
          ))
        )}
      </section>
      <section className="city-sheet-panel city-build-up-panel">
        <h3>Build-Up</h3>
        <label>
          Build-Up points
          <input
            type="number"
            min={0}
            max={5}
            value={c.playState.buildUp}
            onChange={(e) =>
              onChange({
                ...c,
                playState: {
                  ...c.playState,
                  buildUp: Math.max(
                    0,
                    Math.min(5, Math.trunc(Number(e.target.value))),
                  ),
                },
              })
            }
          />
        </label>
        <p>Pending Moments of Evolution: {c.development.pendingMoments}</p>
      </section>
      <section className="city-sheet-panel city-moments-panel">
        <h3>Moments of Evolution</h3>
        <label>
          Benefit
          <select value={moment} onChange={(e) => setMoment(e.target.value)}>
            {momentOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <TextField
          label="Moment details and table ruling"
          value={notes}
          onChange={setNotes}
        />
        <button
          disabled={c.development.pendingMoments < 1 || !notes.trim()}
          onClick={() => {
            if (
              !window.confirm(
                `Claim “${selected[1]}” and spend one pending Moment?`,
              )
            )
              return;
            onChange({
              ...c,
              development: {
                ...c.development,
                pendingMoments: c.development.pendingMoments - 1,
                claimedMoments: [
                  ...c.development.claimedMoments,
                  {
                    id: crypto.randomUUID(),
                    definitionId: selected[0],
                    name: selected[1],
                    notes: notes.trim(),
                    claimedAt: new Date().toISOString(),
                  },
                ],
              },
            });
            setNotes('');
          }}
        >
          Claim reviewed Moment
        </button>
        {c.development.claimedMoments.map((entry) => (
          <div className="city-ruled-row" key={entry.id}>
            <strong>{entry.name}</strong>
            <span>
              {entry.claimedAt.slice(0, 10)} · {entry.notes}
            </span>
          </div>
        ))}
      </section>
      <section className="city-sheet-panel">
        <h3>Nemeses</h3>
        {c.development.nemeses.length === 0 ? (
          <p>No Nemeses recorded.</p>
        ) : (
          c.development.nemeses.map((entry) => (
            <div className="city-ruled-row" key={entry.id}>
              {entry.description}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
