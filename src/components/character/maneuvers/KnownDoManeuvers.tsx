import { useMemo, useState } from 'react';
import {
  doManeuverById,
  doManeuverCatalog,
  matchesManeuverSearch,
} from '../../../systems/mage-m20/reference/maneuvers';
import type { SelectedDoManeuver } from '../../../types/character';

export function KnownDoManeuvers({
  selections,
  onAdd,
  onUpdate,
  onRemove,
}: {
  selections: SelectedDoManeuver[];
  onAdd: (definitionId?: string, customName?: string) => string | null;
  onUpdate: (
    selectionId: string,
    update: Partial<Pick<SelectedDoManeuver, 'customName' | 'notes'>>,
  ) => void;
  onRemove: (selectionId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [includeLegacy, setIncludeLegacy] = useState(false);
  const [customName, setCustomName] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const selectedDefinitionIds = useMemo(
    () =>
      new Set(
        selections.flatMap((selection) =>
          selection.definitionId ? [selection.definitionId] : [],
        ),
      ),
    [selections],
  );
  const results = useMemo(
    () =>
      doManeuverCatalog.filter(
        (entry) =>
          (includeLegacy || entry.version === 'revised') &&
          matchesManeuverSearch(entry, search),
      ),
    [includeLegacy, search],
  );

  return (
    <div className="maneuver-panel">
      <div className="maneuver-custom-adder maneuver-custom-adder--do">
        <label>
          <span>Custom Do maneuver name</span>
          <input
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="primary-button"
          disabled={!customName.trim()}
          onClick={() => {
            const id = onAdd(undefined, customName);
            if (id) {
              setCustomName('');
            }
          }}
        >
          Add custom Do maneuver
        </button>
      </div>

      <div>
        <h3 className="maneuver-subheading">Selected Do maneuvers</h3>
        {selections.length === 0 ? (
          <p className="selected-list-empty">No Do maneuvers selected.</p>
        ) : (
          <div className="maneuver-card-grid">
            {selections.map((selection) => {
              const definition = selection.definitionId
                ? doManeuverById.get(selection.definitionId)
                : undefined;
              const name =
                definition?.name ||
                selection.customName ||
                selection.unresolvedDefinitionName ||
                'Untitled Do maneuver';
              const isExpanded = expanded.has(selection.id);
              const detailsId = `selected-do-${selection.id}-details`;
              return (
                <article className="maneuver-card" key={selection.id}>
                  <div className="maneuver-card__heading">
                    <div>
                      <div className="catalog-card__labels">
                        <span className="kind-badge">
                          {definition
                            ? definition.version === 'revised'
                              ? 'Revised'
                              : 'Legacy'
                            : 'Custom'}
                        </span>
                      </div>
                      <h3>{name}</h3>
                    </div>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`${
                        isExpanded ? 'Collapse' : 'Expand'
                      } ${name}`}
                      aria-expanded={isExpanded}
                      aria-controls={detailsId}
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
                    <>
                      <p className="catalog-card__source">
                        {definition.citation}
                      </p>
                      <p className="maneuver-card__summary">
                        {definition.summary}
                      </p>
                    </>
                  ) : selection.definitionId ? (
                    <p className="selected-reference-warning">
                      Unknown definition {selection.definitionId} is preserved.
                    </p>
                  ) : (
                    <p className="catalog-card__source">Custom Do maneuver</p>
                  )}
                  {isExpanded ? (
                    <div className="maneuver-card__details" id={detailsId}>
                      {!definition && !selection.definitionId ? (
                        <label>
                          <span>Name</span>
                          <input
                            value={selection.customName ?? ''}
                            onChange={(event) =>
                              onUpdate(selection.id, {
                                customName: event.target.value,
                              })
                            }
                          />
                        </label>
                      ) : null}
                      <label>
                        <span>Notes</span>
                        <textarea
                          rows={3}
                          value={selection.notes}
                          onChange={(event) =>
                            onUpdate(selection.id, {
                              notes: event.target.value,
                            })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="small-button small-button--danger"
                        onClick={() => onRemove(selection.id)}
                      >
                        Remove Do maneuver
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="maneuver-catalog">
        <h3 className="maneuver-subheading">Do maneuver catalog</h3>
        <div className="maneuver-catalog-toolbar">
          <label>
            <span>Search Do maneuvers</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="maneuver-check-row">
            <input
              type="checkbox"
              checked={includeLegacy}
              onChange={(event) => setIncludeLegacy(event.target.checked)}
            />
            <span>Include 3 Legacy maneuvers</span>
          </label>
        </div>
        <p className="catalog-result-count" role="status">
          {results.length} of {doManeuverCatalog.length} maneuvers
        </p>
        <div className="maneuver-card-grid">
          {results.map((entry) => {
            const isExpanded = expanded.has(entry.id);
            const isSelected = selectedDefinitionIds.has(entry.id);
            const detailsId = `do-maneuver-${entry.id}-details`;
            return (
              <article className="maneuver-card" key={entry.id}>
                <div className="maneuver-card__heading">
                  <div>
                    <div className="catalog-card__labels">
                      <span className="kind-badge">
                        {entry.version === 'revised' ? 'Revised' : 'Legacy'}
                      </span>
                    </div>
                    <h3>{entry.name}</h3>
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`${
                      isExpanded ? 'Collapse' : 'Expand'
                    } reference for ${entry.name}`}
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                    onClick={() =>
                      setExpanded((current) => {
                        const next = new Set(current);
                        if (next.has(entry.id)) {
                          next.delete(entry.id);
                        } else {
                          next.add(entry.id);
                        }
                        return next;
                      })
                    }
                  >
                    {isExpanded ? '⌃' : '⌄'}
                  </button>
                </div>
                <p className="catalog-card__source">{entry.citation}</p>
                <p className="maneuver-card__summary">{entry.summary}</p>
                {isExpanded ? (
                  <div className="maneuver-card__details" id={detailsId}>
                    <p>
                      Reference preview: adding records this maneuver as known
                      but does not automate or validate its use.
                    </p>
                  </div>
                ) : null}
                <button
                  type="button"
                  className={isSelected ? 'secondary-button' : 'primary-button'}
                  disabled={isSelected}
                  onClick={() => onAdd(entry.id)}
                >
                  {isSelected ? 'Selected' : 'Add'}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
