import type { Torchbearer2eCharacter } from './schema';

type Update = (
  updater: (current: Torchbearer2eCharacter) => Torchbearer2eCharacter,
) => void;

const number = (value: string) => Math.max(0, Number.parseInt(value, 10) || 0);

export function AdventureState({
  character,
  update,
}: {
  character: Torchbearer2eCharacter;
  update: Update;
}) {
  const state = character.playState;
  const grindCycles = Math.floor(state.adventureTurns / 4);
  return (
    <div className="tb2-field-grid">
      <label>
        <span>Current phase</span>
        <select
          value={state.phase}
          onChange={(event) =>
            update((current) => ({
              ...current,
              playState: {
                ...current.playState,
                phase: event.target.value as typeof state.phase,
              },
            }))
          }
        >
          <option value="adventure">Adventure</option>
          <option value="camp">Camp</option>
          <option value="town">Town</option>
          <option value="respite">Respite</option>
        </select>
      </label>
      <label>
        <span>Adventure turns</span>
        <input
          type="number"
          min="0"
          value={state.adventureTurns}
          onChange={(event) =>
            update((current) => ({
              ...current,
              playState: {
                ...current.playState,
                adventureTurns: number(event.target.value),
              },
            }))
          }
        />
      </label>
      <p className="settings-hint" role="status">
        {grindCycles} complete Grind interval{grindCycles === 1 ? '' : 's'}{' '}
        recorded. The GM still determines when consequences apply.
      </p>
      <label>
        <span>Available checks</span>
        <input
          type="number"
          min="0"
          value={state.checks.available}
          onChange={(event) =>
            update((current) => ({
              ...current,
              playState: {
                ...current.playState,
                checks: {
                  ...current.playState.checks,
                  available: number(event.target.value),
                },
              },
            }))
          }
        />
      </label>
      <label>
        <span>Spent checks</span>
        <input
          type="number"
          min="0"
          value={state.checks.spent}
          onChange={(event) =>
            update((current) => ({
              ...current,
              playState: {
                ...current.playState,
                checks: {
                  ...current.playState.checks,
                  spent: number(event.target.value),
                },
              },
            }))
          }
        />
      </label>
      <button
        type="button"
        className="secondary-button"
        onClick={() =>
          update((current) => ({
            ...current,
            playState: {
              ...current.playState,
              lights: [
                ...current.playState.lights,
                {
                  id: crypto.randomUUID(),
                  name: 'Torch',
                  status: 'active',
                  remainingTurns: 2,
                  maximumTurns: 2,
                },
              ],
            },
          }))
        }
      >
        Add light source
      </button>
      {state.lights.map((light) => (
        <div className="tb2-compact-record" key={light.id}>
          <input
            aria-label="Light source"
            value={light.name}
            onChange={(e) =>
              update((current) => ({
                ...current,
                playState: {
                  ...current.playState,
                  lights: current.playState.lights.map((item) =>
                    item.id === light.id
                      ? { ...item, name: e.target.value }
                      : item,
                  ),
                },
              }))
            }
          />
          <select
            aria-label={`${light.name} status`}
            value={light.status}
            onChange={(e) =>
              update((current) => ({
                ...current,
                playState: {
                  ...current.playState,
                  lights: current.playState.lights.map((item) =>
                    item.id === light.id
                      ? {
                          ...item,
                          status: e.target.value as typeof light.status,
                        }
                      : item,
                  ),
                },
              }))
            }
          >
            <option value="active">Active</option>
            <option value="spent">Spent</option>
            <option value="extinguished">Extinguished</option>
          </select>
          <input
            aria-label={`${light.name} turns remaining`}
            type="number"
            min="0"
            value={light.remainingTurns}
            onChange={(e) =>
              update((current) => ({
                ...current,
                playState: {
                  ...current.playState,
                  lights: current.playState.lights.map((item) =>
                    item.id === light.id
                      ? { ...item, remainingTurns: number(e.target.value) }
                      : item,
                  ),
                },
              }))
            }
          />
        </div>
      ))}
    </div>
  );
}

export function ConflictTool({
  character,
  update,
}: {
  character: Torchbearer2eCharacter;
  update: Update;
}) {
  const conflict = character.playState.conflict;
  const patch = (value: Partial<typeof conflict>) =>
    update((current) => ({
      ...current,
      playState: {
        ...current.playState,
        conflict: { ...current.playState.conflict, ...value },
      },
    }));
  return (
    <div className="tb2-field-grid">
      <label className="settings-checkbox">
        <input
          type="checkbox"
          checked={conflict.active}
          onChange={(e) => patch({ active: e.target.checked })}
        />
        <span>Conflict active</span>
      </label>
      <label>
        <span>Conflict type</span>
        <input
          value={conflict.type}
          onChange={(e) => patch({ type: e.target.value })}
        />
      </label>
      <label>
        <span>Captain</span>
        <input
          value={conflict.captain}
          onChange={(e) => patch({ captain: e.target.value })}
        />
      </label>
      <label>
        <span>Participants</span>
        <input
          value={conflict.participants}
          onChange={(e) => patch({ participants: e.target.value })}
        />
      </label>
      <label>
        <span>Maximum disposition</span>
        <input
          type="number"
          min="0"
          value={conflict.maximumDisposition}
          onChange={(e) =>
            patch({
              maximumDisposition: number(e.target.value),
              currentDisposition: Math.min(
                conflict.currentDisposition,
                number(e.target.value),
              ),
            })
          }
        />
      </label>
      <label>
        <span>Current disposition</span>
        <input
          type="number"
          min="0"
          max={conflict.maximumDisposition}
          value={conflict.currentDisposition}
          onChange={(e) =>
            patch({
              currentDisposition: Math.min(
                conflict.maximumDisposition,
                number(e.target.value),
              ),
            })
          }
        />
      </label>
      <label>
        <span>Round</span>
        <input
          type="number"
          min="0"
          value={conflict.round}
          onChange={(e) => patch({ round: number(e.target.value) })}
        />
      </label>
      <label>
        <span>Equipment choices</span>
        <textarea
          value={conflict.equipment}
          onChange={(e) => patch({ equipment: e.target.value })}
        />
      </label>
      <label>
        <span>Result</span>
        <textarea
          value={conflict.result}
          onChange={(e) => patch({ result: e.target.value })}
        />
      </label>
      <label>
        <span>Compromise notes</span>
        <textarea
          value={conflict.compromise}
          onChange={(e) => patch({ compromise: e.target.value })}
        />
      </label>
      <p className="settings-hint">
        This tool tracks arithmetic and context. The table decides actions,
        compromises, twists, and narrative outcomes.
      </p>
    </div>
  );
}

export function CampTownTool({
  character,
  update,
}: {
  character: Torchbearer2eCharacter;
  update: Update;
}) {
  const value = character.playState.campTown;
  const patch = (change: Partial<typeof value>) =>
    update((current) => ({
      ...current,
      playState: {
        ...current.playState,
        campTown: { ...current.playState.campTown, ...change },
      },
    }));
  return (
    <div className="tb2-field-grid">
      <label>
        <span>Camp type</span>
        <input
          value={value.campType}
          onChange={(e) => patch({ campType: e.target.value })}
        />
      </label>
      <label>
        <span>Town</span>
        <input
          value={value.townName}
          onChange={(e) => patch({ townName: e.target.value })}
        />
      </label>
      <label>
        <span>Town type</span>
        <input
          value={value.townType}
          onChange={(e) => patch({ townType: e.target.value })}
        />
      </label>
      <label>
        <span>Lifestyle</span>
        <input
          type="number"
          min="0"
          value={value.lifestyle}
          onChange={(e) => patch({ lifestyle: number(e.target.value) })}
        />
      </label>
      <label>
        <span>Respite and recovery notes</span>
        <textarea
          value={value.respiteNotes}
          onChange={(e) => patch({ respiteNotes: e.target.value })}
        />
      </label>
      <button
        type="button"
        className="secondary-button"
        onClick={() =>
          update((current) => ({
            ...current,
            playState: {
              ...current.playState,
              recovery: [
                ...current.playState.recovery,
                {
                  id: crypto.randomUUID(),
                  date: new Date().toISOString().slice(0, 10),
                  condition: '',
                  method: '',
                  obstacle: 0,
                  outcome: 'pending',
                  notes: '',
                },
              ],
            },
          }))
        }
      >
        Record recovery attempt
      </button>
      {character.playState.recovery.map((record) => (
        <details key={record.id}>
          <summary>
            {record.condition || 'Recovery attempt'} · {record.outcome}
          </summary>
          <div className="tb2-field-grid">
            <input
              aria-label="Condition"
              value={record.condition}
              onChange={(e) =>
                updateRecovery(update, record.id, { condition: e.target.value })
              }
            />
            <input
              aria-label="Recovery method"
              value={record.method}
              onChange={(e) =>
                updateRecovery(update, record.id, { method: e.target.value })
              }
            />
            <select
              aria-label="Outcome"
              value={record.outcome}
              onChange={(e) =>
                updateRecovery(update, record.id, {
                  outcome: e.target.value as typeof record.outcome,
                })
              }
            >
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="condition">Condition</option>
              <option value="twist">Twist</option>
            </select>
            <textarea
              aria-label="Recovery notes"
              value={record.notes}
              onChange={(e) =>
                updateRecovery(update, record.id, { notes: e.target.value })
              }
            />
          </div>
        </details>
      ))}
    </div>
  );
}

function updateRecovery(
  update: Update,
  id: string,
  patch: Partial<Torchbearer2eCharacter['playState']['recovery'][number]>,
) {
  update((current) => ({
    ...current,
    playState: {
      ...current.playState,
      recovery: current.playState.recovery.map((record) =>
        record.id === id ? { ...record, ...patch } : record,
      ),
    },
  }));
}

export function LegacyTool({
  character,
  update,
}: {
  character: Torchbearer2eCharacter;
  update: Update;
}) {
  return (
    <div>
      <p className="settings-hint">
        Terrible Price records are permanent history. Review the consequence and
        affected records with the GM before confirming; Arcane Record never
        deletes them automatically.
      </p>
      <button
        type="button"
        className="secondary-button"
        onClick={() =>
          update((current) => ({
            ...current,
            terriblePrice: [
              ...current.terriblePrice,
              {
                id: crypto.randomUUID(),
                date: new Date().toISOString().slice(0, 10),
                trigger: '',
                optionId: 'tb2.lore-master.level-benefit.a-terrible-price',
                optionName: 'A Terrible Price',
                affectedRecordIds: [],
                rolls: [],
                notes: '',
                createdAt: new Date().toISOString(),
              },
            ],
          }))
        }
      >
        Record Terrible Price
      </button>
      {character.terriblePrice.map((record) => (
        <details key={record.id}>
          <summary>
            {record.optionName} · {record.date}
          </summary>
          <div className="tb2-text-grid">
            <label>
              <span>Triggering event</span>
              <textarea
                value={record.trigger}
                onChange={(e) =>
                  updateLegacy(update, record.id, { trigger: e.target.value })
                }
              />
            </label>
            <label>
              <span>Consequence and affected records</span>
              <textarea
                value={record.notes}
                onChange={(e) =>
                  updateLegacy(update, record.id, { notes: e.target.value })
                }
              />
            </label>
          </div>
        </details>
      ))}
    </div>
  );
}

function updateLegacy(
  update: Update,
  id: string,
  patch: Partial<Torchbearer2eCharacter['terriblePrice'][number]>,
) {
  update((current) => ({
    ...current,
    terriblePrice: current.terriblePrice.map((record) =>
      record.id === id ? { ...record, ...patch } : record,
    ),
  }));
}
