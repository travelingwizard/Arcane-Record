import { useMemo, useState } from 'react';
import {
  formatAllowedCosts,
  formatMeritFlawSources,
  meritFlawById,
  type MeritFlawKind,
} from '../../../systems/mage-m20/reference/merits-flaws';
import type { SelectedMeritFlaw } from '../../../types/character';

export type SelectedMeritFlawSort = 'added' | 'name' | 'cost' | 'category';

export function SelectedMeritFlawList({
  kind,
  selections,
  sort,
  onUpdate,
  onRemove,
}: {
  kind: MeritFlawKind;
  selections: SelectedMeritFlaw[];
  sort: SelectedMeritFlawSort;
  onUpdate: (
    selectionId: string,
    update: Partial<Pick<SelectedMeritFlaw, 'chosenCost' | 'notes'>>,
  ) => void;
  onRemove: (selectionId: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const sorted = useMemo(
    () =>
      [...selections].sort((left, right) => {
        const leftDefinition = meritFlawById.get(left.definitionId);
        const rightDefinition = meritFlawById.get(right.definitionId);
        if (sort === 'name') {
          return (leftDefinition?.name ?? left.definitionId).localeCompare(
            rightDefinition?.name ?? right.definitionId,
          );
        }
        if (sort === 'cost') {
          return (
            right.chosenCost - left.chosenCost ||
            left.addedAt.localeCompare(right.addedAt)
          );
        }
        if (sort === 'category') {
          return (
            (leftDefinition?.category ?? 'other').localeCompare(
              rightDefinition?.category ?? 'other',
            ) || left.addedAt.localeCompare(right.addedAt)
          );
        }
        return left.addedAt.localeCompare(right.addedAt);
      }),
    [selections, sort],
  );

  return (
    <div className="selected-merit-flaw-list">
      <h3>Selected {kind === 'merit' ? 'Merits' : 'Flaws'}</h3>
      {sorted.length === 0 ? (
        <p className="selected-merit-flaw-list__empty">
          No {kind === 'merit' ? 'Merits' : 'Flaws'} selected.
        </p>
      ) : (
        sorted.map((selection) => {
          const definition = meritFlawById.get(selection.definitionId);
          const isExpanded = expanded.has(selection.id);
          const detailId = `selected-detail-${selection.id}`;
          return (
            <article
              className="selected-merit-flaw"
              id={`selected-${selection.definitionId}`}
              key={selection.id}
            >
              <div className="selected-merit-flaw__heading">
                <div>
                  <h4>
                    {definition?.name ?? 'Unknown Merit or Flaw reference'}
                  </h4>
                  <p>
                    {selection.chosenCost}-point{' '}
                    {definition
                      ? `${definition.category} ${definition.kind}`
                      : kind}
                  </p>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`${
                    isExpanded ? 'Collapse' : 'Expand'
                  } selected ${definition?.name ?? selection.definitionId}`}
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
              {definition ? (
                <p className="selected-merit-flaw__source">
                  {formatMeritFlawSources(definition)}
                </p>
              ) : (
                <p className="selected-merit-flaw__unresolved">
                  Definition ID: {selection.definitionId}. This unresolved
                  reference is preserved in character data.
                </p>
              )}

              {isExpanded ? (
                <div className="selected-merit-flaw__details" id={detailId}>
                  {definition ? <p>{definition.description}</p> : null}
                  {definition && definition.allowedCosts.length > 1 ? (
                    <label>
                      <span>Selected cost</span>
                      <select
                        value={selection.chosenCost}
                        onChange={(event) =>
                          onUpdate(selection.id, {
                            chosenCost: Number(event.target.value),
                          })
                        }
                      >
                        {definition.allowedCosts.map((cost) => (
                          <option value={cost} key={cost}>
                            {cost} point{cost === 1 ? '' : 's'}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : definition ? (
                    <p>Allowed points: {formatAllowedCosts(definition)}</p>
                  ) : null}
                  <label>
                    <span>Character notes</span>
                    <textarea
                      value={selection.notes}
                      rows={3}
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
