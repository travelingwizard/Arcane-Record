import { useState } from 'react';
import type { Exalted1eCharacter } from '../../schema';

interface Props {
  character: Exalted1eCharacter;
  onChange: (character: Exalted1eCharacter) => void;
}

export function PossessionsSection({ character, onChange }: Props) {
  const [name, setName] = useState('');
  const [manseName, setManseName] = useState('');
  const [hearthstoneName, setHearthstoneName] = useState('');
  const [kind, setKind] =
    useState<Exalted1eCharacter['possessions'][number]['kind']>('mundane');
  const add = () => {
    if (!name.trim()) return;
    onChange({
      ...character,
      possessions: [
        ...character.possessions,
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          kind,
          quantity: 1,
          carried: true,
          equipped: false,
          stored: false,
          lost: false,
          loaned: false,
          notes: '',
          linkedEquipmentId: null,
          linkedBackgroundIds: [],
          artifact:
            kind === 'artifact'
              ? {
                  rating: 1,
                  material: '',
                  attuned: false,
                  attunementCost: 0,
                  committedEssence: 0,
                  powers: '',
                  source: '',
                }
              : null,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setName('');
  };
  const addManse = () => {
    if (!manseName.trim()) return;
    onChange({
      ...character,
      manses: [
        ...character.manses,
        {
          id: crypto.randomUUID(),
          name: manseName.trim(),
          rating: 0,
          aspect: '',
          location: '',
          description: '',
          powers: '',
          source: '',
          linkedBackgroundIds: [],
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setManseName('');
  };
  const addHearthstone = () => {
    if (!hearthstoneName.trim()) return;
    onChange({
      ...character,
      hearthstones: [
        ...character.hearthstones,
        {
          id: crypto.randomUUID(),
          name: hearthstoneName.trim(),
          rating: 0,
          aspect: '',
          powers: '',
          source: '',
          notes: '',
          linkedManseId: null,
          socketedPossessionId: null,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setHearthstoneName('');
  };
  return (
    <>
      <p className="section-note">
        Combat equipment appears here through a stable link; removing or
        unlinking a record does not silently delete the other record.
      </p>
      <div className="exalted-background-add">
        <label>
          <span>Possession name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          <span>Kind</span>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as typeof kind)}
          >
            {[
              'mundane',
              'weapon',
              'armor',
              'shield',
              'ammunition',
              'artifact',
              'hearthstone',
              'consumable',
              'other',
            ].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="secondary-button" onClick={add}>
          Add possession
        </button>
      </div>
      <div className="exalted-record-list">
        {character.possessions.length ? (
          character.possessions.map((item) => (
            <details className="exalted-compact-record" key={item.id}>
              <summary>
                <strong>{item.name}</strong>
                <span>
                  {item.quantity} · {item.kind}
                </span>
              </summary>
              <div className="exalted-record-fields">
                <div className="exalted-action-row">
                  {(
                    ['carried', 'equipped', 'stored', 'lost', 'loaned'] as const
                  ).map((field) => (
                    <label key={field}>
                      <input
                        type="checkbox"
                        checked={item[field]}
                        onChange={(event) =>
                          onChange({
                            ...character,
                            possessions: character.possessions.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, [field]: event.target.checked }
                                : entry,
                            ),
                          })
                        }
                      />{' '}
                      {field}
                    </label>
                  ))}
                </div>
                <label>
                  <span>Notes</span>
                  <textarea
                    value={item.notes}
                    onChange={(event) =>
                      onChange({
                        ...character,
                        possessions: character.possessions.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, notes: event.target.value }
                            : entry,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="small-button small-button--quiet"
                  onClick={() =>
                    onChange({
                      ...character,
                      possessions: character.possessions.filter(
                        ({ id }) => id !== item.id,
                      ),
                      backgrounds: character.backgrounds.map((background) => ({
                        ...background,
                        linkedEntityIds: background.linkedEntityIds.filter(
                          (id) => id !== item.id,
                        ),
                      })),
                      hearthstones: character.hearthstones.map((stone) =>
                        stone.socketedPossessionId === item.id
                          ? { ...stone, socketedPossessionId: null }
                          : stone,
                      ),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            </details>
          ))
        ) : (
          <p className="empty-inline">No possessions recorded.</p>
        )}
      </div>
      <div className="exalted-selected-trait-groups">
        <section className="exalted-record-group">
          <h3>Manses</h3>
          <div className="exalted-background-add">
            <label>
              <span>Manse name</span>
              <input
                value={manseName}
                onChange={(event) => setManseName(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="secondary-button"
              onClick={addManse}
            >
              Add Manse
            </button>
          </div>
          {character.manses.map((manse) => (
            <details className="exalted-compact-record" key={manse.id}>
              <summary>
                <strong>{manse.name}</strong>
                <span>Rating {manse.rating}</span>
              </summary>
              <div className="exalted-record-fields">
                <label>
                  <span>Aspect</span>
                  <input
                    value={manse.aspect}
                    onChange={(event) =>
                      onChange({
                        ...character,
                        manses: character.manses.map((entry) =>
                          entry.id === manse.id
                            ? { ...entry, aspect: event.target.value }
                            : entry,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  <span>Location and notes</span>
                  <textarea
                    value={manse.description}
                    onChange={(event) =>
                      onChange({
                        ...character,
                        manses: character.manses.map((entry) =>
                          entry.id === manse.id
                            ? { ...entry, description: event.target.value }
                            : entry,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="small-button small-button--quiet"
                  onClick={() =>
                    onChange({
                      ...character,
                      manses: character.manses.filter(
                        ({ id }) => id !== manse.id,
                      ),
                      backgrounds: character.backgrounds.map((background) => ({
                        ...background,
                        linkedEntityIds: background.linkedEntityIds.filter(
                          (id) => id !== manse.id,
                        ),
                      })),
                      hearthstones: character.hearthstones.map((stone) =>
                        stone.linkedManseId === manse.id
                          ? { ...stone, linkedManseId: null }
                          : stone,
                      ),
                    })
                  }
                >
                  Remove Manse
                </button>
              </div>
            </details>
          ))}
        </section>
        <section className="exalted-record-group">
          <h3>Hearthstones</h3>
          <div className="exalted-background-add">
            <label>
              <span>Hearthstone name</span>
              <input
                value={hearthstoneName}
                onChange={(event) => setHearthstoneName(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="secondary-button"
              onClick={addHearthstone}
            >
              Add Hearthstone
            </button>
          </div>
          {character.hearthstones.map((stone) => (
            <details className="exalted-compact-record" key={stone.id}>
              <summary>
                <strong>{stone.name}</strong>
                <span>Rating {stone.rating}</span>
              </summary>
              <div className="exalted-record-fields">
                <label>
                  <span>Linked Manse</span>
                  <select
                    value={stone.linkedManseId ?? ''}
                    onChange={(event) =>
                      onChange({
                        ...character,
                        hearthstones: character.hearthstones.map((entry) =>
                          entry.id === stone.id
                            ? {
                                ...entry,
                                linkedManseId: event.target.value || null,
                              }
                            : entry,
                        ),
                      })
                    }
                  >
                    <option value="">None</option>
                    {character.manses.map((manse) => (
                      <option key={manse.id} value={manse.id}>
                        {manse.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Socketed in possession</span>
                  <select
                    value={stone.socketedPossessionId ?? ''}
                    onChange={(event) =>
                      onChange({
                        ...character,
                        hearthstones: character.hearthstones.map((entry) =>
                          entry.id === stone.id
                            ? {
                                ...entry,
                                socketedPossessionId:
                                  event.target.value || null,
                              }
                            : entry,
                        ),
                      })
                    }
                  >
                    <option value="">Not socketed</option>
                    {character.possessions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="small-button small-button--quiet"
                  onClick={() =>
                    onChange({
                      ...character,
                      hearthstones: character.hearthstones.filter(
                        ({ id }) => id !== stone.id,
                      ),
                      backgrounds: character.backgrounds.map((background) => ({
                        ...background,
                        linkedEntityIds: background.linkedEntityIds.filter(
                          (id) => id !== stone.id,
                        ),
                      })),
                    })
                  }
                >
                  Remove Hearthstone
                </button>
              </div>
            </details>
          ))}
        </section>
      </div>
    </>
  );
}
