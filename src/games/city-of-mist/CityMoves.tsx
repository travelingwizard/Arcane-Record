import { useState } from 'react';
import { TextField } from '../shared/LocalSheet';
import { cityMoves } from './moves';
import type { CityPlayRecords } from './play';

export function CityMoves({
  records,
  onChange,
}: {
  records: CityPlayRecords;
  onChange: (records: CityPlayRecords) => void;
}) {
  const [id, setId] = useState<string>(cityMoves[0].id),
    [selected, setSelected] = useState<string[]>([]),
    [notes, setNotes] = useState('');
  const move = cityMoves.find((m) => m.id === id)!;
  return (
    <details>
      <summary>Player move references — no dice roller</summary>
      <label>
        Move
        <select
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setSelected([]);
          }}
        >
          {cityMoves.map((m) => (
            <option value={m.id} key={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <p>{move.summary}</p>
      <p>
        City of Mist Player Moves (2019), p. {move.page}. These references do
        not include every theme improvement or Gatekeeper exception.
      </p>
      <p>
        Select only outcomes allowed by the result and the table’s ruling. MC
        choices are recorded, not decided here. Recording does not automatically
        modify tags, statuses or resources.
      </p>
      {move.options.map((option) => (
        <label key={option}>
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={(e) =>
              setSelected(
                e.target.checked
                  ? [...selected, option]
                  : selected.filter((v) => v !== option),
              )
            }
          />
          {option}
        </label>
      ))}
      <TextField
        label="Move result and table ruling"
        value={notes}
        onChange={setNotes}
      />
      <button
        disabled={!notes.trim()}
        onClick={() => {
          onChange({
            ...records,
            events: [
              ...records.events,
              {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                description: `${move.name}: ${selected.join('; ')}. ${notes.trim()}`,
              },
            ],
          });
          setNotes('');
          setSelected([]);
        }}
      >
        Record reviewed move outcome
      </button>
    </details>
  );
}
