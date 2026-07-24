import { useState } from 'react';
import { spheres } from '../../../systems/mage-m20/definitions';
import { roteById } from '../../../systems/mage-m20/reference/rotes';
import type { KnownRote, SphereRequirement } from '../../../types/character';

const sphereOptions = [
  ...spheres,
  { id: 'data', label: 'Data' },
  { id: 'other', label: 'Other' },
] as const;

function requirementLabel(requirement: SphereRequirement) {
  const label =
    requirement.sphereId === 'other'
      ? requirement.label || 'Other'
      : sphereOptions.find(({ id }) => id === requirement.sphereId)?.label;
  return `${label} ${requirement.minimum}${
    requirement.maximum !== undefined ? `–${requirement.maximum}` : ''
  }`;
}

export function SelectedRoteList({
  rotes,
  onUpdate,
  onRemove,
}: {
  rotes: KnownRote[];
  onUpdate: (
    selectionId: string,
    update: Partial<
      Pick<
        KnownRote,
        | 'name'
        | 'sphereRequirements'
        | 'requirementNotes'
        | 'effect'
        | 'focusNotes'
        | 'notes'
      >
    >,
  ) => void;
  onRemove: (selectionId: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (rotes.length === 0) {
    return <p className="selected-list-empty">No Rotes recorded.</p>;
  }

  return (
    <div className="magick-selected-list">
      {rotes.map((rote) => {
        const definition = rote.definitionId
          ? roteById.get(rote.definitionId)
          : undefined;
        const isExpanded = expanded.has(rote.id);
        const detailId = `selected-rote-${rote.id}-details`;
        const requirements =
          rote.sphereRequirements.length > 0
            ? rote.sphereRequirements.map(requirementLabel).join(' · ')
            : rote.requirementNotes || 'Requirements unrecorded';
        const updateRequirement = (
          index: number,
          update: Partial<SphereRequirement>,
        ) =>
          onUpdate(rote.id, {
            sphereRequirements: rote.sphereRequirements.map(
              (requirement, requirementIndex) =>
                requirementIndex === index
                  ? { ...requirement, ...update }
                  : requirement,
            ),
          });

        return (
          <article
            className="magick-selected-card"
            id={`selected-rote-${rote.id}`}
            key={rote.id}
          >
            <div className="magick-selected-card__heading">
              <div>
                <h3>{rote.name.trim() || 'Untitled Rote'}</h3>
                <p>{requirements}</p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label={`${
                  isExpanded ? 'Collapse' : 'Expand'
                } ${rote.name || 'Untitled Rote'}`}
                aria-expanded={isExpanded}
                aria-controls={detailId}
                onClick={() =>
                  setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(rote.id)) {
                      next.delete(rote.id);
                    } else {
                      next.add(rote.id);
                    }
                    return next;
                  })
                }
              >
                {isExpanded ? '⌃' : '⌄'}
              </button>
            </div>

            {definition ? (
              <p className="catalog-card__source">
                {definition.citation} · reference preview
              </p>
            ) : rote.definitionId ? (
              <p className="selected-reference-warning">
                Unknown definition {rote.definitionId} is preserved.
              </p>
            ) : (
              <p className="catalog-card__source">Custom Rote</p>
            )}

            {isExpanded ? (
              <div className="magick-selected-card__details" id={detailId}>
                {definition ? (
                  <details className="magick-reference-note">
                    <summary>Reference note</summary>
                    <p>{definition.summary}</p>
                  </details>
                ) : null}
                <label>
                  <span>Name</span>
                  <input
                    value={rote.name}
                    onChange={(event) =>
                      onUpdate(rote.id, { name: event.target.value })
                    }
                  />
                </label>

                <fieldset className="rote-requirements">
                  <legend>Structured Sphere requirements</legend>
                  {rote.sphereRequirements.map((requirement, index) => (
                    <div
                      className="rote-requirement-row"
                      key={`${rote.id}-${index}`}
                    >
                      <label>
                        <span>Sphere</span>
                        <select
                          value={requirement.sphereId}
                          onChange={(event) =>
                            updateRequirement(index, {
                              sphereId: event.target
                                .value as SphereRequirement['sphereId'],
                              ...(event.target.value === 'other'
                                ? { label: requirement.label || '' }
                                : { label: undefined }),
                            })
                          }
                        >
                          {sphereOptions.map((sphere) => (
                            <option value={sphere.id} key={sphere.id}>
                              {sphere.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Minimum</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={requirement.minimum}
                          onChange={(event) =>
                            updateRequirement(index, {
                              minimum: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>Maximum</span>
                        <input
                          type="number"
                          min={requirement.minimum}
                          max="10"
                          value={requirement.maximum ?? ''}
                          placeholder="—"
                          onChange={(event) =>
                            updateRequirement(index, {
                              maximum: event.target.value
                                ? Number(event.target.value)
                                : undefined,
                            })
                          }
                        />
                      </label>
                      {requirement.sphereId === 'other' ? (
                        <label>
                          <span>Label</span>
                          <input
                            value={requirement.label ?? ''}
                            onChange={(event) =>
                              updateRequirement(index, {
                                label: event.target.value,
                              })
                            }
                          />
                        </label>
                      ) : null}
                      <button
                        type="button"
                        className="small-button small-button--danger"
                        onClick={() =>
                          onUpdate(rote.id, {
                            sphereRequirements: rote.sphereRequirements.filter(
                              (_, requirementIndex) =>
                                requirementIndex !== index,
                            ),
                          })
                        }
                      >
                        Remove requirement
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="small-button small-button--quiet"
                    onClick={() =>
                      onUpdate(rote.id, {
                        sphereRequirements: [
                          ...rote.sphereRequirements,
                          { sphereId: 'forces', minimum: 1 },
                        ],
                      })
                    }
                  >
                    Add Sphere requirement
                  </button>
                </fieldset>

                <label>
                  <span>Requirement notes</span>
                  <input
                    value={rote.requirementNotes}
                    placeholder="Alternatives, ranges, Data, or special requirements"
                    onChange={(event) =>
                      onUpdate(rote.id, {
                        requirementNotes: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  <span>Effect</span>
                  <textarea
                    rows={4}
                    value={rote.effect}
                    onChange={(event) =>
                      onUpdate(rote.id, { effect: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Focus and instruments</span>
                  <textarea
                    rows={3}
                    value={rote.focusNotes}
                    onChange={(event) =>
                      onUpdate(rote.id, { focusNotes: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Character notes</span>
                  <textarea
                    rows={3}
                    value={rote.notes}
                    onChange={(event) =>
                      onUpdate(rote.id, { notes: event.target.value })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="small-button small-button--danger"
                  onClick={() => onRemove(rote.id)}
                >
                  Remove Rote
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
