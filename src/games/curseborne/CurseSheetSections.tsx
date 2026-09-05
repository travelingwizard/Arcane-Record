import { DotRating } from '../../components/controls/DotRating';
import { TextField } from '../shared/LocalSheet';
import type { CurseCharacter } from './schema';

type Props = {
  character: CurseCharacter;
  onChange: (character: CurseCharacter) => void;
  locked: boolean;
};

const citation = (record: { source: string; page: number }) =>
  `${record.source}${record.page ? ` · p. ${record.page}` : ' · page unverified'}`;

function RemoveButton({
  onClick,
  locked,
}: {
  onClick: () => void;
  locked: boolean;
}) {
  return locked ? null : <button onClick={onClick}>Remove</button>;
}

export function CurseAspirations({ character: c, onChange, locked }: Props) {
  const add = (horizon: 'short' | 'long') =>
    onChange({
      ...c,
      aspirationRecords: [
        ...c.aspirationRecords,
        { id: crypto.randomUUID(), horizon, text: '', completed: false },
      ],
    });
  return (
    <div className="curseborne-panel curseborne-aspirations">
      <h3>Aspirations</h3>
      {(['short', 'long'] as const).map((horizon) => (
        <div key={horizon}>
          <h4>{horizon === 'short' ? 'Short-term' : 'Long-term'}</h4>
          {c.aspirationRecords
            .filter((v) => v.horizon === horizon)
            .map((record) => (
              <div className="curseborne-writing-row" key={record.id}>
                <input
                  aria-label={`${horizon} aspiration`}
                  value={record.text}
                  readOnly={locked}
                  onChange={(e) =>
                    onChange({
                      ...c,
                      aspirationRecords: c.aspirationRecords.map((v) =>
                        v.id === record.id ? { ...v, text: e.target.value } : v,
                      ),
                    })
                  }
                />
                <label>
                  <input
                    type="checkbox"
                    checked={record.completed}
                    onChange={(e) =>
                      onChange({
                        ...c,
                        aspirationRecords: c.aspirationRecords.map((v) =>
                          v.id === record.id
                            ? { ...v, completed: e.target.checked }
                            : v,
                        ),
                      })
                    }
                  />{' '}
                  Complete
                </label>
                <RemoveButton
                  locked={locked}
                  onClick={() =>
                    onChange({
                      ...c,
                      aspirationRecords: c.aspirationRecords.filter(
                        (v) => v.id !== record.id,
                      ),
                    })
                  }
                />
              </div>
            ))}
          {!locked && (
            <button onClick={() => add(horizon)}>
              Add {horizon} Aspiration
            </button>
          )}
        </div>
      ))}
      {c.aspirations && (
        <details>
          <summary>Legacy Aspirations retained</summary>
          <TextField
            label="Original aspiration notes"
            value={c.aspirations}
            locked={locked}
            onChange={(aspirations) => onChange({ ...c, aspirations })}
          />
        </details>
      )}
    </div>
  );
}

export function CurseTraitsSection({ character: c, onChange, locked }: Props) {
  const arenas = [
    ['Mental', ['Intellect', 'Cunning', 'Resolve']],
    ['Physical', ['Might', 'Dexterity', 'Stamina']],
    ['Social', ['Presence', 'Manipulation', 'Composure']],
  ] as const;
  return (
    <div className="curseborne-traits-layout">
      <div className="curseborne-panel">
        <h3>Skills</h3>
        {Object.keys(c.skills).map((id) => (
          <div className="curseborne-rating-row" key={id}>
            <span>{id}</span>
            <DotRating
              label={id}
              value={c.skills[id as keyof typeof c.skills]}
              max={5}
              readOnly={locked}
              onChange={(value) =>
                onChange({ ...c, skills: { ...c.skills, [id]: value } })
              }
            />
          </div>
        ))}
      </div>
      <div className="curseborne-panel">
        <h3>Edges</h3>
        {c.edges.map((edge) => (
          <details key={edge.id}>
            <summary>
              {edge.name || 'New Edge'} · {edge.rating}
            </summary>
            <TextField
              label="Edge name"
              value={edge.name}
              locked={locked}
              onChange={(name) =>
                onChange({
                  ...c,
                  edges: c.edges.map((v) =>
                    v.id === edge.id ? { ...v, name } : v,
                  ),
                })
              }
            />
            <DotRating
              label={`${edge.name || 'Edge'} rating`}
              value={edge.rating}
              max={5}
              readOnly={locked}
              onChange={(rating) =>
                onChange({
                  ...c,
                  edges: c.edges.map((v) =>
                    v.id === edge.id ? { ...v, rating } : v,
                  ),
                })
              }
            />
            <TextField
              label="Notes"
              value={edge.notes}
              onChange={(notes) =>
                onChange({
                  ...c,
                  edges: c.edges.map((v) =>
                    v.id === edge.id ? { ...v, notes } : v,
                  ),
                })
              }
            />
            <p>{citation(edge)}</p>
            <RemoveButton
              locked={locked}
              onClick={() =>
                onChange({
                  ...c,
                  edges: c.edges.filter((v) => v.id !== edge.id),
                })
              }
            />
          </details>
        ))}
        {!locked && (
          <button
            onClick={() =>
              onChange({
                ...c,
                edges: [
                  ...c.edges,
                  {
                    id: crypto.randomUUID(),
                    definitionId: null,
                    sourceId: null,
                    source: 'Curseborne',
                    page: 0,
                    legacyEntryId: null,
                    name: '',
                    rating: 0,
                    notes: '',
                  },
                ],
              })
            }
          >
            Add Edge
          </button>
        )}
      </div>
      <div className="curseborne-arena-grid">
        {arenas.map(([arena, ids]) => (
          <div className="curseborne-panel curseborne-stat-arena" key={arena}>
            <h3>{arena}</h3>
            {ids.map((id) => (
              <div className="curseborne-rating-row" key={id}>
                <span>{id}</span>
                <DotRating
                  label={id}
                  value={c.attributes[id]}
                  min={1}
                  max={5}
                  readOnly={locked}
                  onChange={(value) =>
                    onChange({
                      ...c,
                      attributes: { ...c.attributes, [id]: value },
                    })
                  }
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Connections({
  kind,
  character: c,
  onChange,
  locked,
}: Props & { kind: 'contacts' | 'bonds' }) {
  const records = c[kind];
  return (
    <div className="curseborne-panel">
      <h3>{kind === 'contacts' ? 'Contacts' : 'Bonds'}</h3>
      {records.map((record) => (
        <details key={record.id}>
          <summary>
            {record.name || `New ${kind.slice(0, -1)}`} · {record.rating}
          </summary>
          <TextField
            label="Name"
            value={record.name}
            locked={locked}
            onChange={(name) =>
              onChange({
                ...c,
                [kind]: records.map((v) =>
                  v.id === record.id ? { ...v, name } : v,
                ),
              })
            }
          />
          <DotRating
            label={`${record.name || kind} rating`}
            value={record.rating}
            max={5}
            readOnly={locked}
            onChange={(rating) =>
              onChange({
                ...c,
                [kind]: records.map((v) =>
                  v.id === record.id ? { ...v, rating } : v,
                ),
              })
            }
          />
          <TextField
            label="Tags (comma separated)"
            value={record.tags.join(', ')}
            locked={locked}
            onChange={(value) =>
              onChange({
                ...c,
                [kind]: records.map((v) =>
                  v.id === record.id
                    ? {
                        ...v,
                        tags: value
                          .split(',')
                          .map((x) => x.trim())
                          .filter(Boolean),
                      }
                    : v,
                ),
              })
            }
          />
          <TextField
            label="Notes"
            value={record.notes}
            onChange={(notes) =>
              onChange({
                ...c,
                [kind]: records.map((v) =>
                  v.id === record.id ? { ...v, notes } : v,
                ),
              })
            }
          />
          <label>
            <input
              type="checkbox"
              checked={record.active}
              onChange={(e) =>
                onChange({
                  ...c,
                  [kind]: records.map((v) =>
                    v.id === record.id ? { ...v, active: e.target.checked } : v,
                  ),
                })
              }
            />{' '}
            Active
          </label>
          <p>{citation(record)}</p>
          <RemoveButton
            locked={locked}
            onClick={() =>
              onChange({
                ...c,
                [kind]: records.filter((v) => v.id !== record.id),
              })
            }
          />
        </details>
      ))}
      {!locked && (
        <button
          onClick={() =>
            onChange({
              ...c,
              [kind]: [
                ...records,
                {
                  id: crypto.randomUUID(),
                  definitionId: null,
                  sourceId: null,
                  source: 'Curseborne',
                  page: 0,
                  legacyEntryId: null,
                  name: '',
                  rating: 0,
                  tags: [],
                  notes: '',
                  active: false,
                },
              ],
            })
          }
        >
          Add {kind === 'contacts' ? 'Contact' : 'Bond'}
        </button>
      )}
    </div>
  );
}

export function CurseConnectionsSection(props: Props) {
  return (
    <div className="curseborne-grid curseborne-grid--two">
      <Connections {...props} kind="contacts" />
      <Connections {...props} kind="bonds" />
    </div>
  );
}

export function CurseGearSection({ character: c, onChange, locked }: Props) {
  return (
    <div className="curseborne-record-grid">
      {c.gear.map((record) => (
        <details key={record.id}>
          <summary>
            {record.name || 'New gear'} · {record.state}
          </summary>
          <TextField
            label="Item"
            value={record.name}
            locked={locked}
            onChange={(name) =>
              onChange({
                ...c,
                gear: c.gear.map((v) =>
                  v.id === record.id ? { ...v, name } : v,
                ),
              })
            }
          />
          <TextField
            label="Tags (up to four, comma separated)"
            value={record.tags.join(', ')}
            locked={locked}
            onChange={(value) =>
              onChange({
                ...c,
                gear: c.gear.map((v) =>
                  v.id === record.id
                    ? {
                        ...v,
                        tags: value
                          .split(',')
                          .map((x) => x.trim())
                          .filter(Boolean)
                          .slice(0, 4),
                      }
                    : v,
                ),
              })
            }
          />
          <label>
            State
            <select
              value={record.state}
              onChange={(e) =>
                onChange({
                  ...c,
                  gear: c.gear.map((v) =>
                    v.id === record.id
                      ? { ...v, state: e.target.value as typeof record.state }
                      : v,
                  ),
                })
              }
            >
              {['carried', 'equipped', 'stored', 'lost', 'consumed'].map(
                (v) => (
                  <option key={v}>{v}</option>
                ),
              )}
            </select>
          </label>
          <TextField
            label="Notes"
            value={record.notes}
            onChange={(notes) =>
              onChange({
                ...c,
                gear: c.gear.map((v) =>
                  v.id === record.id ? { ...v, notes } : v,
                ),
              })
            }
          />
          <p>{citation(record)}</p>
          <RemoveButton
            locked={locked}
            onClick={() =>
              onChange({ ...c, gear: c.gear.filter((v) => v.id !== record.id) })
            }
          />
        </details>
      ))}
      {!locked && (
        <button
          onClick={() =>
            onChange({
              ...c,
              gear: [
                ...c.gear,
                {
                  id: crypto.randomUUID(),
                  definitionId: null,
                  sourceId: null,
                  source: 'Curseborne',
                  page: 0,
                  legacyEntryId: null,
                  name: '',
                  tags: [],
                  state: 'carried',
                  notes: '',
                },
              ],
            })
          }
        >
          Add Gear
        </button>
      )}
    </div>
  );
}

export function CurseSpellsSection({ character: c, onChange, locked }: Props) {
  const field = (
    id: string,
    key: 'name' | 'cost' | 'attunements' | 'effect' | 'advances' | 'notes',
    label: string,
    permanent = true,
  ) => {
    const record = c.spells.find((v) => v.id === id)!;
    return (
      <TextField
        label={label}
        value={record[key]}
        locked={locked && permanent}
        onChange={(value) =>
          onChange({
            ...c,
            spells: c.spells.map((v) =>
              v.id === id ? { ...v, [key]: value } : v,
            ),
          })
        }
      />
    );
  };
  return (
    <div className="curseborne-record-grid">
      {c.spells.map((record) => (
        <details key={record.id}>
          <summary>
            {record.name || 'New spell'} · {record.cost || 'cost —'} ·{' '}
            {record.state}
          </summary>
          <div className="curseborne-grid curseborne-grid--two">
            {field(record.id, 'name', 'Spell')}
            {field(record.id, 'cost', 'Cost')}
            {field(record.id, 'attunements', 'Attunements')}
            {field(record.id, 'effect', 'Effect summary')}
            {field(record.id, 'advances', 'Advances')}
            {field(record.id, 'notes', 'Notes', false)}
          </div>
          <label>
            State
            <select
              value={record.state}
              onChange={(e) =>
                onChange({
                  ...c,
                  spells: c.spells.map((v) =>
                    v.id === record.id
                      ? { ...v, state: e.target.value as typeof record.state }
                      : v,
                  ),
                })
              }
            >
              {['ready', 'active', 'spent'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <p>{citation(record)}</p>
          <RemoveButton
            locked={locked}
            onClick={() =>
              onChange({
                ...c,
                spells: c.spells.filter((v) => v.id !== record.id),
              })
            }
          />
        </details>
      ))}
      {!locked && (
        <button
          onClick={() =>
            onChange({
              ...c,
              spells: [
                ...c.spells,
                {
                  id: crypto.randomUUID(),
                  definitionId: null,
                  sourceId: null,
                  source: 'Curseborne',
                  page: 0,
                  legacyEntryId: null,
                  name: '',
                  cost: '',
                  attunements: '',
                  effect: '',
                  advances: '',
                  state: 'ready',
                  notes: '',
                },
              ],
            })
          }
        >
          Add Spell
        </button>
      )}
    </div>
  );
}

export function CurseTorments({ character: c, onChange, locked }: Props) {
  const block = (
    key: 'accursedTorment' | 'personalTormentRecord',
    label: string,
  ) => (
    <div className="curseborne-panel">
      <h3>{label}</h3>
      <TextField
        label="Torment"
        value={c[key].description}
        locked={locked}
        onChange={(description) =>
          onChange({ ...c, [key]: { ...c[key], description } })
        }
      />
      <TextField
        label="Trigger"
        value={c[key].trigger}
        locked={locked}
        onChange={(trigger) =>
          onChange({ ...c, [key]: { ...c[key], trigger } })
        }
      />
    </div>
  );
  return (
    <div className="curseborne-grid curseborne-grid--two">
      {block('accursedTorment', 'Accursed Torment')}
      {block('personalTormentRecord', 'Personal Torment')}
    </div>
  );
}
