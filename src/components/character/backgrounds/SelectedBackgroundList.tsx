import { useEffect, useMemo, useRef, useState } from 'react';
import { MageSourceWarning } from '../../../games/mage20/supplements/SourceControls';
import {
  backgroundRatingRules,
  calculateBackgroundCreationCost,
} from '../../../systems/mage-m20/background-rules';
import {
  backgroundById,
  backgroundCatalog,
  formatBackgroundRestriction,
  formatBackgroundSources,
} from '../../../systems/mage-m20/reference/backgrounds';
import type { SelectedBackground } from '../../../types/character';
import { DotRating } from '../../controls/DotRating';

export type SelectedBackgroundSort =
  'added' | 'display-name' | 'reference-name' | 'rating' | 'cost';

export function SelectedBackgroundList({
  selections,
  sort,
  focusSelectionId,
  ratingsReadOnly,
  onUpdate,
  onRepair,
  onRemove,
}: {
  selections: SelectedBackground[];
  sort: SelectedBackgroundSort;
  focusSelectionId: string | null;
  ratingsReadOnly: boolean;
  onUpdate: (
    selectionId: string,
    update: Partial<
      Pick<SelectedBackground, 'displayName' | 'rating' | 'notes' | 'pooled'>
    >,
  ) => void;
  onRepair: (selectionId: string, definitionId: string) => void;
  onRemove: (selectionId: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const cardRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (!focusSelectionId) {
      return;
    }
    setExpanded((current) => new Set(current).add(focusSelectionId));
    requestAnimationFrame(() =>
      cardRefs.current.get(focusSelectionId)?.focus(),
    );
  }, [focusSelectionId]);

  const sorted = useMemo(
    () =>
      [...selections].sort((left, right) => {
        const leftDefinition = backgroundById.get(left.definitionId);
        const rightDefinition = backgroundById.get(right.definitionId);
        if (sort === 'display-name') {
          return left.displayName.localeCompare(right.displayName);
        }
        if (sort === 'reference-name') {
          return (
            (leftDefinition?.name ?? left.definitionId).localeCompare(
              rightDefinition?.name ?? right.definitionId,
            ) || left.addedAt.localeCompare(right.addedAt)
          );
        }
        if (sort === 'rating') {
          return (
            right.rating - left.rating ||
            left.addedAt.localeCompare(right.addedAt)
          );
        }
        if (sort === 'cost') {
          const leftCost = leftDefinition
            ? calculateBackgroundCreationCost(left.rating, leftDefinition)
            : -1;
          const rightCost = rightDefinition
            ? calculateBackgroundCreationCost(right.rating, rightDefinition)
            : -1;
          return (
            rightCost - leftCost || left.addedAt.localeCompare(right.addedAt)
          );
        }
        return left.addedAt.localeCompare(right.addedAt);
      }),
    [selections, sort],
  );

  const selectedDefinitionIds = new Set(
    selections.map((selection) => selection.definitionId),
  );

  return (
    <div className="selected-background-list">
      {sorted.length === 0 ? (
        <p className="selected-background-list__empty">
          No Backgrounds selected.
        </p>
      ) : (
        sorted.map((selection) => {
          const definition = backgroundById.get(selection.definitionId);
          const referenceName =
            definition?.name ??
            selection.unresolvedDefinitionName ??
            'Unknown Background reference';
          const displayName =
            selection.displayName.trim() || 'Unnamed Background';
          const isExpanded = expanded.has(selection.id);
          const detailId = `selected-background-detail-${selection.id}`;
          const creationCost = definition
            ? calculateBackgroundCreationCost(selection.rating, definition)
            : null;
          const repairOptions = backgroundCatalog.filter((candidate) => {
            const maximum = candidate.supportsRatingsAboveFive
              ? backgroundRatingRules.extendedInterfaceMaximum
              : candidate.standardMaximumRating;
            const duplicate =
              selectedDefinitionIds.has(candidate.id) &&
              !candidate.canBeSelectedMultipleTimes;
            return (
              !duplicate &&
              selection.rating >= candidate.minimumRating &&
              selection.rating <= maximum
            );
          });

          return (
            <article
              className={`selected-background${
                definition ? '' : ' selected-background--unresolved'
              }`}
              key={selection.id}
              id={`selected-background-${selection.id}`}
              tabIndex={-1}
              ref={(element) => {
                if (element) {
                  cardRefs.current.set(selection.id, element);
                } else {
                  cardRefs.current.delete(selection.id);
                }
              }}
            >
              <div className="selected-background__heading">
                <div>
                  <h4>{displayName}</h4>
                  {displayName !== referenceName ? (
                    <p>Reference Background: {referenceName}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`${
                    isExpanded ? 'Collapse' : 'Expand'
                  } selected ${displayName}`}
                  aria-expanded={isExpanded}
                  aria-controls={detailId}
                  onClick={() =>
                    setExpanded((current) => {
                      const next = new Set(current);
                      if (next.has(selection.id)) {
                        next.delete(selection.id);
                      } else {
                        next.add(selection.id);
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
                <>
                  <DotRating
                    label={displayName}
                    ariaLabel={`${displayName}: ${selection.rating} out of ${
                      definition.supportsRatingsAboveFive
                        ? backgroundRatingRules.extendedInterfaceMaximum
                        : definition.standardMaximumRating
                    } dots. Creation cost: ${creationCost} Background ${
                      creationCost === 1 ? 'point' : 'points'
                    }.`}
                    value={Math.min(
                      selection.rating,
                      definition.standardMaximumRating,
                    )}
                    min={definition.minimumRating}
                    max={definition.standardMaximumRating}
                    readOnly={ratingsReadOnly}
                    onChange={(rating) => onUpdate(selection.id, { rating })}
                  />
                  <div className="selected-background__facts">
                    <span>
                      Rating: {selection.rating}{' '}
                      {selection.rating === 1 ? 'dot' : 'dots'}
                    </span>
                    <span>
                      Cost per dot: {definition.creationPointCostPerDot}
                    </span>
                    <strong>Creation cost: {creationCost} points</strong>
                  </div>
                  {selection.rating > definition.standardMaximumRating ? (
                    <p className="background-extended-note">
                      Extended rating — Storyteller approval recommended.
                    </p>
                  ) : null}
                  <p className="catalog-card__source">
                    {formatBackgroundSources(definition)}
                  </p>
                </>
              ) : (
                <div className="selected-background__unresolved">
                  <strong>Unknown Background reference</strong>
                  <span>Definition ID: {selection.definitionId}</span>
                  <span>Rating: {selection.rating}</span>
                  <span>Excluded from point totals until repaired.</span>
                </div>
              )}

              {isExpanded ? (
                <div className="selected-background__details" id={detailId}>
                  <label>
                    <span>Character label</span>
                    <input
                      value={selection.displayName}
                      onChange={(event) =>
                        onUpdate(selection.id, {
                          displayName: event.target.value,
                        })
                      }
                    />
                  </label>
                  {definition ? (
                    <>
                      <p>{definition.description}</p>
                      {definition.supportsRatingsAboveFive ? (
                        <label>
                          <span>Extended rating</span>
                          <input
                            type="number"
                            min={definition.minimumRating}
                            max={backgroundRatingRules.extendedInterfaceMaximum}
                            step={1}
                            value={selection.rating}
                            disabled={ratingsReadOnly}
                            onChange={(event) =>
                              onUpdate(selection.id, {
                                rating: Number(event.target.value),
                              })
                            }
                          />
                          <small>
                            Ratings above five require Storyteller approval. Ten
                            is an interface safety limit, not a universal Mage
                            rule.
                          </small>
                        </label>
                      ) : null}
                      <p>
                        Cost calculation: {selection.rating} ×{' '}
                        {definition.creationPointCostPerDot} = {creationCost}{' '}
                        Background points.
                      </p>
                      {definition.restrictions.map((restriction) => (
                        <p
                          className="background-restriction"
                          key={restriction}
                          role="note"
                        >
                          {formatBackgroundRestriction(restriction)}.
                        </p>
                      ))}
                      {definition.canBePooled ? (
                        <label className="background-pooling-toggle">
                          <input
                            type="checkbox"
                            checked={selection.pooled}
                            onChange={(event) =>
                              onUpdate(selection.id, {
                                pooled: event.target.checked,
                              })
                            }
                          />
                          <span>Mark as pooled with other characters</span>
                        </label>
                      ) : null}
                    </>
                  ) : (
                    <label>
                      <span>Repair reference</span>
                      <select
                        value=""
                        onChange={(event) => {
                          if (event.target.value) {
                            onRepair(selection.id, event.target.value);
                          }
                        }}
                      >
                        <option value="">Choose a compatible Background</option>
                        {repairOptions.map((candidate) => (
                          <option value={candidate.id} key={candidate.id}>
                            {candidate.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label>
                    <span>Character notes</span>
                    <textarea
                      rows={3}
                      value={selection.notes}
                      onChange={(event) =>
                        onUpdate(selection.id, { notes: event.target.value })
                      }
                    />
                  </label>
                </div>
              ) : null}

              <button
                type="button"
                className="small-button small-button--danger"
                onClick={() => onRemove(selection.id)}
              >
                Remove
              </button>
            </article>
          );
        })
      )}
    </div>
  );
}
