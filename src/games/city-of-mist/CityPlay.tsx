import { useState } from 'react';
import { TextField } from '../shared/LocalSheet';
import {
  cityStatusPower,
  spendCityBatch,
  stackCityStatus,
  type CityPlayRecords,
} from './play';

export function CityPlay({
  records: r,
  onChange,
}: {
  records: CityPlayRecords;
  onChange: (r: CityPlayRecords) => void;
}) {
  const [name, setName] = useState(''),
    [spectrum, setSpectrum] = useState(''),
    [tier, setTier] = useState(1);
  const [duration, setDuration] = useState<
    'temporary' | 'ongoing' | 'permanent'
  >('ongoing');
  const [kind, setKind] = useState<'clue' | 'juice'>('clue'),
    [method, setMethod] = useState(''),
    [amount, setAmount] = useState(1),
    [source, setSource] = useState(''),
    [spendOutcome, setSpendOutcome] = useState('');
  const power = cityStatusPower(r.statuses);
  const change = (next: CityPlayRecords, description: string) =>
    onChange({
      ...next,
      events: [
        ...r.events,
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          description,
        },
      ],
    });
  return (
    <>
      <h3>Statuses & story tags</h3>
      <p>
        Player’s Guide pp. 219, 223–224. Choose relevance for the current
        action: highest helpful {power.helpful} − highest hindering{' '}
        {power.hindering} = {power.modifier >= 0 ? '+' : ''}
        {power.modifier} Power. Tier 5/6 consequences require the MC’s ruling.
      </p>
      <TextField
        label="New status or story-tag name"
        value={name}
        onChange={setName}
      />
      <TextField
        label="Status spectrum (confirm with the MC)"
        value={spectrum}
        onChange={setSpectrum}
      />
      <label>
        Incoming status tier
        <input
          type="number"
          min={1}
          max={6}
          value={tier}
          onChange={(e) =>
            setTier(
              Math.max(1, Math.min(6, Math.trunc(Number(e.target.value)))),
            )
          }
        />
      </label>
      <label>
        Duration
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value as typeof duration)}
        >
          {['temporary', 'ongoing', 'permanent'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <button
        disabled={!name.trim() || !spectrum.trim()}
        onClick={() => {
          const match = r.statuses.find(
            (s) =>
              s.active &&
              s.spectrum.trim().toLowerCase() ===
                spectrum.trim().toLowerCase() &&
              s.duration === duration,
          );
          if (match) {
            const next = stackCityStatus(match, tier);
            if (
              !window.confirm(
                `Same spectrum and duration: ${match.name}-${match.tier} becomes ${name}-${next.tier} with ${next.pips} pips. Apply?`,
              )
            )
              return;
            change(
              {
                ...r,
                statuses: r.statuses.map((s) =>
                  s.id === match.id ? { ...next, name: name.trim() } : s,
                ),
              },
              `Stacked ${name}-${tier}: now tier ${next.tier}, ${next.pips} pips.`,
            );
          } else
            change(
              {
                ...r,
                statuses: [
                  ...r.statuses,
                  {
                    id: crypto.randomUUID(),
                    name: name.trim(),
                    spectrum: spectrum.trim(),
                    tier,
                    pips: 0,
                    duration,
                    relevance: 'neutral',
                    active: true,
                    notes: '',
                  },
                ],
              },
              `Added status ${name}-${tier}.`,
            );
          setName('');
        }}
      >
        Add or stack status
      </button>
      <button
        disabled={!name.trim()}
        onClick={() => {
          change(
            {
              ...r,
              tags: [
                ...r.tags,
                {
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  duration,
                  state: 'active',
                  notes: '',
                },
              ],
            },
            `Added ${duration} story tag ${name}.`,
          );
          setName('');
        }}
      >
        Add story tag
      </button>
      {r.statuses.map((s) => (
        <details key={s.id}>
          <summary>
            {s.name}-{s.tier} · {s.pips} pips ·{' '}
            {s.active ? s.duration : 'resolved'}
          </summary>
          {s.tier >= 5 && s.active && (
            <p role="status">
              {s.tier === 5
                ? 'OUT: related actions may be impossible.'
                : 'MC: lethal or permanent transformation; resolve with the MC.'}
            </p>
          )}
          <TextField
            label={`Name for ${s.name}`}
            value={s.name}
            onChange={(name) =>
              onChange({
                ...r,
                statuses: r.statuses.map((v) =>
                  v.id === s.id ? { ...v, name } : v,
                ),
              })
            }
          />
          <p>Spectrum: {s.spectrum}</p>
          <label>
            Relevance to current action
            <select
              value={s.relevance}
              onChange={(e) =>
                onChange({
                  ...r,
                  statuses: r.statuses.map((v) =>
                    v.id === s.id
                      ? {
                          ...v,
                          relevance: e.target.value as typeof s.relevance,
                        }
                      : v,
                  ),
                })
              }
            >
              {['neutral', 'helpful', 'hindering'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <TextField
            label={`Notes for ${s.name}`}
            value={s.notes}
            onChange={(notes) =>
              onChange({
                ...r,
                statuses: r.statuses.map((v) =>
                  v.id === s.id ? { ...v, notes } : v,
                ),
              })
            }
          />
          <button
            onClick={() =>
              change(
                {
                  ...r,
                  statuses: r.statuses.map((v) =>
                    v.id === s.id ? { ...v, active: !v.active } : v,
                  ),
                },
                `${s.active ? 'Resolved' : 'Reactivated'} status ${s.name}.`,
              )
            }
          >
            {s.active ? 'Resolve status' : 'Reactivate status'}
          </button>
        </details>
      ))}
      <p>
        Story tags: temporary tags expire after one invocation; ongoing tags
        last until burnt or no longer relevant. Permanent tags may be recovered
        (Player’s Guide p. 212).
      </p>
      {r.tags.map((t) => (
        <details key={t.id}>
          <summary>
            {t.name} · {t.duration} · {t.state}
          </summary>
          <TextField
            label={`Notes for tag ${t.name}`}
            value={t.notes}
            onChange={(notes) =>
              onChange({
                ...r,
                tags: r.tags.map((v) => (v.id === t.id ? { ...v, notes } : v)),
              })
            }
          />
          <label>
            Tag state
            <select
              value={t.state}
              onChange={(e) =>
                change(
                  {
                    ...r,
                    tags: r.tags.map((v) =>
                      v.id === t.id
                        ? { ...v, state: e.target.value as typeof t.state }
                        : v,
                    ),
                  },
                  `Changed story tag ${t.name} to ${e.target.value}.`,
                )
              }
            >
              {['active', 'burnt', 'expired'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          {t.duration === 'temporary' && (
            <button
              disabled={t.state !== 'active'}
              onClick={() =>
                change(
                  {
                    ...r,
                    tags: r.tags.map((v) =>
                      v.id === t.id ? { ...v, state: 'expired' } : v,
                    ),
                  },
                  `Invoked and expired temporary tag ${t.name}.`,
                )
              }
            >
              Invoke once and expire
            </button>
          )}
        </details>
      ))}
      <h3>Clues & Juice</h3>
      <p>
        Player’s Guide pp. 227–235. Keep batches separate. Spend a Clue only
        after receiving an answer or useful lead. Juice effects must fit their
        method; banked Juice locks its generating options until spent or
        discarded.
      </p>
      <label>
        Resource kind
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
        >
          <option value="clue">Clues</option>
          <option value="juice">Juice</option>
        </select>
      </label>
      <TextField label="New batch method" value={method} onChange={setMethod} />
      <TextField
        label="Information source or generating move"
        value={source}
        onChange={setSource}
      />
      <label>
        Batch amount
        <input
          type="number"
          min={1}
          max={100}
          value={amount}
          onChange={(e) =>
            setAmount(
              Math.max(1, Math.min(100, Math.trunc(Number(e.target.value)))),
            )
          }
        />
      </label>
      <button
        disabled={!method.trim()}
        onClick={() => {
          change(
            {
              ...r,
              batches: [
                ...r.batches,
                {
                  id: crypto.randomUUID(),
                  kind,
                  method: method.trim(),
                  source,
                  amount,
                  spent: 0,
                  expired: false,
                  expires: '',
                  notes: '',
                },
              ],
            },
            `Gained ${amount} ${kind}: ${method}.`,
          );
          setMethod('');
        }}
      >
        Add resource batch
      </button>
      {r.batches.map((b) => (
        <details key={b.id}>
          <summary>
            {b.kind}: {b.method} ·{' '}
            {b.expired ? 'expired' : `${b.amount - b.spent} remaining`}
          </summary>
          <p>
            {b.source} · Gained {b.amount} · Spent {b.spent}. Separate batch;
            cannot be pooled with other batches.
          </p>
          <TextField
            label={`Expiry for ${b.method}`}
            value={b.expires}
            onChange={(expires) =>
              onChange({
                ...r,
                batches: r.batches.map((v) =>
                  v.id === b.id ? { ...v, expires } : v,
                ),
              })
            }
          />
          <TextField
            label={`Questions, effects and notes for ${b.method}`}
            value={b.notes}
            onChange={(notes) =>
              onChange({
                ...r,
                batches: r.batches.map((v) =>
                  v.id === b.id ? { ...v, notes } : v,
                ),
              })
            }
          />
          <TextField
            label={
              b.kind === 'clue'
                ? 'Answer or useful lead received'
                : 'Created tag, removed status, or other confirmed effect'
            }
            value={spendOutcome}
            onChange={setSpendOutcome}
          />
          <button
            disabled={b.expired || b.spent >= b.amount || !spendOutcome.trim()}
            onClick={() => {
              if (
                window.confirm(
                  b.kind === 'clue'
                    ? 'Did the MC provide an answer or useful lead? Spend one Clue?'
                    : 'Has the table confirmed this effect and its cost? Spend one Juice?',
                )
              ) {
                change(
                  {
                    ...r,
                    batches: r.batches.map((v) =>
                      v.id === b.id ? spendCityBatch(v, 1) : v,
                    ),
                    spends: [
                      ...r.spends,
                      {
                        id: crypto.randomUUID(),
                        batchId: b.id,
                        kind: b.kind,
                        amount: 1,
                        outcome: spendOutcome.trim(),
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  },
                  `Spent one ${b.kind}: ${b.method}. ${spendOutcome.trim()}`,
                );
                setSpendOutcome('');
              }
            }}
          >
            Spend one {b.kind}
          </button>
          <button
            disabled={b.expired}
            onClick={() => {
              if (
                window.confirm(
                  'Mark this batch expired or discarded? Its history will remain.',
                )
              )
                change(
                  {
                    ...r,
                    batches: r.batches.map((v) =>
                      v.id === b.id ? { ...v, expired: true } : v,
                    ),
                  },
                  `Expired ${b.kind}: ${b.method}.`,
                );
            }}
          >
            Expire batch
          </button>
        </details>
      ))}
      <details>
        <summary>Play record history ({r.events.length})</summary>
        {[...r.events].reverse().map((e) => (
          <p key={e.id}>
            {e.date.slice(0, 19)} · {e.description}
          </p>
        ))}
      </details>
    </>
  );
}
