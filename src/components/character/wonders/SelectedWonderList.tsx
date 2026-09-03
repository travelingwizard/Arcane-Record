import { useState } from 'react';
import { MageSourceWarning } from '../../../games/mage20/supplements/SourceControls';
import { wonderById } from '../../../systems/mage-m20/reference/wonders';
import type { OwnedWonder } from '../../../types/character';

export function SelectedWonderList({
  wonders,
  onUpdate,
  onRemove,
}: {
  wonders: OwnedWonder[];
  onUpdate: (
    selectionId: string,
    update: Partial<
      Pick<OwnedWonder, 'name' | 'typeLabel' | 'rating' | 'powers' | 'notes'>
    >,
  ) => void;
  onRemove: (selectionId: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (wonders.length === 0) {
    return <p className="selected-list-empty">No Wonders recorded.</p>;
  }

  return (
    <div className="magick-selected-list">
      {wonders.map((wonder) => {
        const definition = wonder.definitionId
          ? wonderById.get(wonder.definitionId)
          : undefined;
        const isExpanded = expanded.has(wonder.id);
        const detailId = `selected-wonder-${wonder.id}-details`;
        return (
          <article
            className="magick-selected-card"
            id={`selected-wonder-${wonder.id}`}
            key={wonder.id}
          >
            <div className="magick-selected-card__heading">
              <div>
                <h3>{wonder.name.trim() || 'Untitled Wonder'}</h3>
                <p>
                  {wonder.typeLabel ||
                    definition?.typeLabel ||
                    'Type unrecorded'}
                  {wonder.rating !== null ? ` · Rating ${wonder.rating}` : ''}
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label={`${
                  isExpanded ? 'Collapse' : 'Expand'
                } ${wonder.name || 'Untitled Wonder'}`}
                aria-expanded={isExpanded}
                aria-controls={detailId}
                onClick={() =>
                  setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(wonder.id)) {
                      next.delete(wonder.id);
                    } else {
                      next.add(wonder.id);
                    }
                    return next;
                  })
                }
              >
                {isExpanded ? '⌃' : '⌄'}
              </button>
            </div>

            {definition && <MageSourceWarning entry={definition} />}
            {definition ? (
              <p className="catalog-card__source">
                {definition.citation} · reference preview
              </p>
            ) : wonder.definitionId ? (
              <p className="selected-reference-warning">
                Unknown definition {wonder.definitionId} is preserved.
              </p>
            ) : (
              <p className="catalog-card__source">Custom Wonder</p>
            )}

            {isExpanded ? (
              <div className="magick-selected-card__details" id={detailId}>
                {definition ? (
                  <details className="magick-reference-note">
                    <summary>Reference note</summary>
                    <p>{definition.summary}</p>
                  </details>
                ) : null}
                <div className="magick-field-grid">
                  <label>
                    <span>Name</span>
                    <input
                      value={wonder.name}
                      onChange={(event) =>
                        onUpdate(wonder.id, { name: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span>Type</span>
                    <input
                      value={wonder.typeLabel}
                      placeholder="Talisman, Device, Trinket…"
                      onChange={(event) =>
                        onUpdate(wonder.id, { typeLabel: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span>Rating (optional)</span>
                    <select
                      value={wonder.rating ?? ''}
                      onChange={(event) =>
                        onUpdate(wonder.id, {
                          rating:
                            event.target.value === ''
                              ? null
                              : Number(event.target.value),
                        })
                      }
                    >
                      <option value="">Not recorded</option>
                      {Array.from({ length: 11 }, (_, value) => (
                        <option value={value} key={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  <span>Powers and Effects</span>
                  <textarea
                    rows={4}
                    value={wonder.powers}
                    onChange={(event) =>
                      onUpdate(wonder.id, { powers: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Character notes</span>
                  <textarea
                    rows={3}
                    value={wonder.notes}
                    onChange={(event) =>
                      onUpdate(wonder.id, { notes: event.target.value })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="small-button small-button--danger"
                  onClick={() => onRemove(wonder.id)}
                >
                  Remove Wonder
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
