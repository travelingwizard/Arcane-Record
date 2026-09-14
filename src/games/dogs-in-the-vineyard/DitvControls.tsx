import { useId, useState } from 'react';
import {
  SheetCard,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import { TextField } from '../shared/LocalSheet';
import { DITV_SOURCE_ID } from './definitions';
import {
  arenaStats,
  emptyDice,
  formatDice,
  newConflict,
  rollPool,
  singleSize,
} from './rules';
import type { DicePool, DitvCharacter, DitvConflict } from './schema';

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  locked = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  locked?: boolean;
}) {
  const id = useId();
  return (
    <label className="sheet-field field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        readOnly={locked}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function DiceEditor({
  value,
  onChange,
  locked = false,
  label = 'Dice',
}: {
  value: DicePool;
  onChange: (p: DicePool) => void;
  locked?: boolean;
  label?: string;
}) {
  return (
    <fieldset className="sheet-card sheet-card--compact">
      <legend>
        {label}: {formatDice(value)}
      </legend>
      <div className="sheet-field-grid sheet-field-grid--four">
        {(['d4', 'd6', 'd8', 'd10'] as const).map((key) => (
          <NumberField
            key={key}
            label={key}
            value={value[key]}
            min={0}
            max={30}
            locked={locked}
            onChange={(n) => onChange({ ...value, [key]: n })}
          />
        ))}
      </div>
    </fieldset>
  );
}

type Trait = DitvCharacter['traits'][number];
export function RatedList({
  title,
  records,
  onChange,
  locked = false,
  relationship = false,
}: {
  title: string;
  records: Trait[] | DitvCharacter['relationships'];
  onChange: (records: Trait[] | DitvCharacter['relationships']) => void;
  locked?: boolean;
  relationship?: boolean;
}) {
  const update = (index: number, next: Trait) =>
    onChange(records.map((x, i) => (i === index ? next : x)) as Trait[]);
  return (
    <div className="sheet-stack">
      <SheetToolbar>
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() =>
            onChange([
              ...records,
              {
                id: crypto.randomUUID(),
                name: '',
                dice: { d4: 0, d6: 1, d8: 0, d10: 0 },
                notes: '',
                origin: 'custom',
                temporaryUntilConflict: false,
                sourceId: DITV_SOURCE_ID,
                page: relationship ? 26 : 24,
                ...(relationship ? { kind: 'person' as const } : {}),
              },
            ] as Trait[])
          }
        >
          Add {title}
        </button>
      </SheetToolbar>
      {records.length === 0 && (
        <div className="sheet-empty-state">
          No {title.toLowerCase()} recorded.
        </div>
      )}
      {records.map((record, i) => (
        <SheetCard key={record.id} density="compact">
          <SheetFieldGrid columns={relationship ? 3 : 2}>
            <TextField
              label="Name"
              value={record.name}
              multiline={false}
              locked={locked}
              onChange={(name) => update(i, { ...record, name })}
            />
            {relationship && (
              <label className="sheet-field field">
                <span>Kind</span>
                <select
                  disabled={locked}
                  value={
                    (record as DitvCharacter['relationships'][number]).kind
                  }
                  onChange={(e) =>
                    update(i, {
                      ...record,
                      kind: e.target.value,
                    } as unknown as Trait)
                  }
                >
                  {[
                    'person',
                    'blood',
                    'institution',
                    'place',
                    'sin',
                    'demon',
                  ].map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <DiceEditor
              value={record.dice}
              locked={locked}
              onChange={(dice) => update(i, { ...record, dice })}
            />
          </SheetFieldGrid>
          {!singleSize(record.dice) && (
            <SheetNotice tone="warning">
              Use only one die size for this record.
            </SheetNotice>
          )}
          <TextField
            label="Notes"
            value={record.notes}
            onChange={(notes) => update(i, { ...record, notes })}
          />
          <button
            className="secondary-button"
            disabled={locked}
            onClick={() =>
              onChange(records.filter((_, n) => n !== i) as Trait[])
            }
          >
            Remove
          </button>
        </SheetCard>
      ))}
    </div>
  );
}

export function ConflictList({
  conflicts,
  onChange,
  character,
}: {
  conflicts: DitvConflict[];
  onChange: (x: DitvConflict[]) => void;
  character?: DitvCharacter;
}) {
  const update = (i: number, c: DitvConflict) =>
    onChange(conflicts.map((x, n) => (n === i ? c : x)));
  const [pool, setPool] = useState<DicePool>(emptyDice());
  return (
    <div className="sheet-stack">
      <button
        className="secondary-button"
        onClick={() => onChange([...conflicts, newConflict()])}
      >
        Start conflict
      </button>
      {conflicts.map((c, i) => (
        <SheetCard key={c.id}>
          <SheetFieldGrid columns={2}>
            <TextField
              label="Conflict"
              value={c.title}
              multiline={false}
              onChange={(title) => update(i, { ...c, title })}
            />
            <label className="sheet-field field">
              <span>Arena</span>
              <select
                value={c.activeArena}
                onChange={(e) =>
                  update(i, {
                    ...c,
                    activeArena: e.target.value as DitvConflict['activeArena'],
                    status: 'active',
                  })
                }
              >
                {['talking', 'physical', 'fighting', 'gunfighting'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <TextField
              label="Stakes"
              value={c.stakes}
              onChange={(stakes) => update(i, { ...c, stakes })}
            />
            <TextField
              label="Stage"
              value={c.stage}
              onChange={(stage) => update(i, { ...c, stage })}
            />
          </SheetFieldGrid>
          <SheetToolbar>
            <button
              className="secondary-button"
              onClick={() =>
                update(i, {
                  ...c,
                  participants: [
                    ...c.participants,
                    {
                      id: crypto.randomUUID(),
                      name: character?.name ?? '',
                      side: '',
                      statKeysRolled: [],
                      usedTraitIds: [],
                      usedRelationshipIds: [],
                      usedBelongingIds: [],
                      helpedSinceGo: false,
                      gave: false,
                      fallout: emptyDice(),
                    },
                  ],
                })
              }
            >
              Add participant
            </button>
            {character && (
              <button
                className="secondary-button"
                onClick={() => {
                  const existing = c.participants[0] ?? {
                    id: crypto.randomUUID(),
                    name: character.name,
                    side: 'Dogs',
                    statKeysRolled: [],
                    usedTraitIds: [],
                    usedRelationshipIds: [],
                    usedBelongingIds: [],
                    helpedSinceGo: false,
                    gave: false,
                    fallout: emptyDice(),
                  };
                  const keys = arenaStats[c.activeArena].filter(
                    (key) => !existing.statKeysRolled.includes(key),
                  );
                  const dice = keys.flatMap((key) =>
                    Array.from(
                      {
                        length: Math.max(
                          0,
                          character.stats[key] -
                            character.temporaryStatPenalties[key],
                        ),
                      },
                      () => ({
                        id: crypto.randomUUID(),
                        size: 6 as const,
                        value: Math.floor(Math.random() * 6) + 1,
                        sourceType: 'stat' as const,
                        sourceId: key,
                        state: 'available' as const,
                      }),
                    ),
                  );
                  const participant = {
                    ...existing,
                    statKeysRolled: [...existing.statKeysRolled, ...keys],
                  };
                  update(i, {
                    ...c,
                    status: 'active',
                    participants: c.participants.length
                      ? [participant, ...c.participants.slice(1)]
                      : [participant],
                    dice: [...c.dice, ...dice],
                  });
                }}
              >
                Roll unintroduced arena Stats
              </button>
            )}
            <button
              className="secondary-button"
              onClick={() =>
                update(i, {
                  ...c,
                  status: 'active',
                  events: [
                    ...c.events,
                    {
                      id: crypto.randomUUID(),
                      kind: 'escalate',
                      actorId: c.activeParticipantId ?? 'local',
                      affectedIds: [],
                      diceIds: [],
                      narration: `Escalated to ${c.activeArena}`,
                      falloutSize: null,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                })
              }
            >
              Record escalation
            </button>
          </SheetToolbar>
          {c.participants.map((participant, pIndex) => (
            <SheetCard key={participant.id} density="compact">
              <SheetFieldGrid columns={2}>
                <TextField
                  label="Participant"
                  value={participant.name}
                  multiline={false}
                  onChange={(name) =>
                    update(i, {
                      ...c,
                      participants: c.participants.map((x, n) =>
                        n === pIndex ? { ...x, name } : x,
                      ),
                    })
                  }
                />
                <TextField
                  label="Side"
                  value={participant.side}
                  multiline={false}
                  onChange={(side) =>
                    update(i, {
                      ...c,
                      participants: c.participants.map((x, n) =>
                        n === pIndex ? { ...x, side } : x,
                      ),
                    })
                  }
                />
              </SheetFieldGrid>
              <DiceEditor
                label="Accumulated Fallout"
                value={participant.fallout}
                onChange={(fallout) =>
                  update(i, {
                    ...c,
                    participants: c.participants.map((x, n) =>
                      n === pIndex ? { ...x, fallout } : x,
                    ),
                  })
                }
              />
              <button
                className="secondary-button"
                disabled={participant.gave}
                onClick={() =>
                  update(i, {
                    ...c,
                    participants: c.participants.map((x, n) =>
                      n === pIndex ? { ...x, gave: true } : x,
                    ),
                    events: [
                      ...c.events,
                      {
                        id: crypto.randomUUID(),
                        kind: 'give',
                        actorId: participant.id,
                        affectedIds: [],
                        diceIds: [],
                        narration: `${participant.name || 'Participant'} gave`,
                        falloutSize: null,
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  })
                }
              >
                Give
              </button>
            </SheetCard>
          ))}
          {character && c.participants[0] && (
            <SheetCard density="compact">
              <h3>Bring a character record into play once</h3>
              <SheetToolbar>
                {[
                  ...character.traits.map((record) => ({
                    record,
                    type: 'trait' as const,
                  })),
                  ...character.relationships.map((record) => ({
                    record,
                    type: 'relationship' as const,
                  })),
                  ...character.belongings.map((record) => ({
                    record,
                    type: 'belonging' as const,
                  })),
                ].map(({ record, type }) => {
                  const participant = c.participants[0]!;
                  const used =
                    type === 'trait'
                      ? participant.usedTraitIds
                      : type === 'relationship'
                        ? participant.usedRelationshipIds
                        : participant.usedBelongingIds;
                  return (
                    <button
                      key={`${type}-${record.id}`}
                      className="secondary-button"
                      disabled={used.includes(record.id)}
                      onClick={() => {
                        const added = rollPool(record.dice).map((die) => ({
                          id: crypto.randomUUID(),
                          ...die,
                          sourceType: type,
                          sourceId: record.id,
                          state: 'available' as const,
                        }));
                        const field =
                          type === 'trait'
                            ? 'usedTraitIds'
                            : type === 'relationship'
                              ? 'usedRelationshipIds'
                              : 'usedBelongingIds';
                        const next = {
                          ...participant,
                          [field]: [...used, record.id],
                        };
                        update(i, {
                          ...c,
                          participants: [next, ...c.participants.slice(1)],
                          dice: [...c.dice, ...added],
                          events: [
                            ...c.events,
                            {
                              id: crypto.randomUUID(),
                              kind:
                                type === 'belonging'
                                  ? 'belonging'
                                  : type === 'trait'
                                    ? 'trait'
                                    : 'help',
                              actorId: participant.id,
                              affectedIds: [],
                              diceIds: added.map((die) => die.id),
                              narration: `Brought ${record.name} into play`,
                              falloutSize: null,
                              createdAt: new Date().toISOString(),
                            },
                          ],
                        });
                      }}
                    >
                      {record.name || `Unnamed ${type}`} ·{' '}
                      {formatDice(record.dice)}
                    </button>
                  );
                })}
              </SheetToolbar>
            </SheetCard>
          )}
          <DiceEditor label="Dice to add" value={pool} onChange={setPool} />
          <SheetToolbar>
            <button
              className="secondary-button"
              onClick={() => {
                const dice = rollPool(pool).map((x) => ({
                  id: crypto.randomUUID(),
                  ...x,
                  sourceType: 'improvised' as const,
                  sourceId: null,
                  state: 'available' as const,
                }));
                update(i, {
                  ...c,
                  status: 'active',
                  dice: [...c.dice, ...dice],
                });
                setPool(emptyDice());
              }}
            >
              Roll into pool
            </button>
            <button
              className="secondary-button"
              disabled={
                c.dice.filter((x) => x.state === 'available').length < 2
              }
              onClick={() => {
                const ids = c.dice
                  .filter((x) => x.state === 'available')
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 2)
                  .map((x) => x.id);
                update(i, {
                  ...c,
                  dice: c.dice.map((x) =>
                    ids.includes(x.id) ? { ...x, state: 'spent' } : x,
                  ),
                  events: [
                    ...c.events,
                    {
                      id: crypto.randomUUID(),
                      kind: 'raise',
                      actorId: 'local',
                      affectedIds: [],
                      diceIds: ids,
                      narration: 'Raise',
                      falloutSize: null,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                });
              }}
            >
              Raise with best two
            </button>
            <button
              className="primary-button"
              onClick={() =>
                update(i, {
                  ...c,
                  status: 'resolved',
                  resolvedAt: new Date().toISOString(),
                })
              }
            >
              Resolve
            </button>
          </SheetToolbar>
          <SheetToolbar>
            {([1, 2, 3] as const).map((count) => (
              <button
                key={count}
                className="secondary-button"
                disabled={
                  c.dice.filter((x) => x.state === 'available').length < count
                }
                onClick={() => {
                  const ids = c.dice
                    .filter((x) => x.state === 'available')
                    .sort((a, b) => b.value - a.value)
                    .slice(0, count)
                    .map((x) => x.id);
                  update(i, {
                    ...c,
                    dice: c.dice.map((x) =>
                      ids.includes(x.id) ? { ...x, state: 'spent' } : x,
                    ),
                    events: [
                      ...c.events,
                      {
                        id: crypto.randomUUID(),
                        kind: 'see',
                        actorId: c.activeParticipantId ?? 'local',
                        affectedIds: [],
                        diceIds: ids,
                        narration:
                          count === 1
                            ? 'Reverse the Blow'
                            : count === 2
                              ? 'Block or Dodge'
                              : 'Take the Blow',
                        falloutSize: count >= 3 ? 6 : null,
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  });
                }}
              >
                See with {count}
              </button>
            ))}
          </SheetToolbar>
          <p>
            Available:{' '}
            {c.dice
              .filter((x) => x.state === 'available')
              .map((x) => `${x.value}(d${x.size})`)
              .join(', ') || '—'}
          </p>
          <TextField
            label="Resolution and narration"
            value={c.resolution}
            onChange={(resolution) => update(i, { ...c, resolution })}
          />
        </SheetCard>
      ))}
    </div>
  );
}
