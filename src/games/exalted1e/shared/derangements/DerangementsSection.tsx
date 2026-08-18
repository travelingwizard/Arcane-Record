import type { Exalted1eCharacter } from '../../schema';

interface Props {
  derangements: Exalted1eCharacter['derangements'];
  onChange: (derangements: Exalted1eCharacter['derangements']) => void;
}

export function DerangementsSection({ derangements, onChange }: Props) {
  const update = (
    id: string,
    changes: Partial<Exalted1eCharacter['derangements'][number]>,
  ) =>
    onChange(
      derangements.map((entry) =>
        entry.id === id ? { ...entry, ...changes } : entry,
      ),
    );
  const add = () =>
    onChange([
      ...derangements,
      {
        id: crypto.randomUUID(),
        definitionId: null,
        customName: '',
        description: '',
        mechanics: '',
        duration: 'temporary',
        customDuration: '',
        status: 'active',
        sourceType: 'custom',
        trigger: '',
        suppressionRules: '',
        recoveryRules: '',
        notes: '',
        linkedMeritFlawId: null,
      },
    ]);
  return (
    <>
      <p className="section-note">
        The Great Curse and Virtue Flaw remain separate from these Derangement
        records.
      </p>
      <button type="button" className="secondary-button" onClick={add}>
        Add Derangement
      </button>
      <div className="exalted-record-list">
        {derangements.length ? (
          derangements.map((entry) => (
            <details className="exalted-compact-record" key={entry.id}>
              <summary>
                <strong>{entry.customName || 'Unnamed Derangement'}</strong>
                <span>
                  {entry.status} · {entry.duration}
                </span>
              </summary>
              <div className="exalted-record-fields">
                {entry.linkedMeritFlawId ? (
                  <p className="section-note">
                    Linked to the Derangement Flaw.
                  </p>
                ) : null}
                <label>
                  <span>Derangement name</span>
                  <input
                    value={entry.customName}
                    onChange={(event) =>
                      update(entry.id, { customName: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Duration</span>
                  <select
                    value={entry.duration}
                    onChange={(event) =>
                      update(entry.id, {
                        duration: event.target.value as typeof entry.duration,
                      })
                    }
                  >
                    <option value="temporary">Temporary</option>
                    <option value="indefinite">Indefinite</option>
                    <option value="permanent">Permanent</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select
                    value={entry.status}
                    onChange={(event) =>
                      update(entry.id, {
                        status: event.target.value as typeof entry.status,
                      })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="suppressed">Suppressed</option>
                    <option value="dormant">Dormant</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </label>
                {(
                  [
                    'description',
                    'mechanics',
                    'trigger',
                    'suppressionRules',
                    'recoveryRules',
                    'notes',
                  ] as const
                ).map((field) => (
                  <label key={field}>
                    <span>{field.replace(/([A-Z])/g, ' $1')}</span>
                    <textarea
                      value={entry[field]}
                      onChange={(event) =>
                        update(entry.id, { [field]: event.target.value })
                      }
                    />
                  </label>
                ))}
                <button
                  type="button"
                  className="small-button small-button--quiet"
                  onClick={() =>
                    onChange(derangements.filter(({ id }) => id !== entry.id))
                  }
                >
                  Remove
                </button>
              </div>
            </details>
          ))
        ) : (
          <p className="empty-inline">No Derangements recorded.</p>
        )}
      </div>
    </>
  );
}
