import { MageSourceWarning } from '../../../games/mage20/supplements/SourceControls';
import {
  focusDefinitionsByKind,
  type FocusKind,
} from '../../../systems/mage-m20/reference/focus';
import type {
  FocusSelection,
  InstrumentSelection,
} from '../../../types/character';

const labels: Record<FocusKind, string> = {
  paradigm: 'Paradigms',
  practice: 'Practices',
  instrument: 'Instruments',
};

export function FocusSelectionList({
  kind,
  selections,
  onUpdate,
  onRemove,
}: {
  kind: FocusKind;
  selections: Array<FocusSelection | InstrumentSelection>;
  onUpdate: (
    selectionId: string,
    update: Partial<
      Pick<FocusSelection, 'customName' | 'notes'> & {
        significant: boolean;
      }
    >,
  ) => void;
  onRemove: (selectionId: string) => void;
}) {
  return (
    <div className="focus-selection-list">
      <h3>{labels[kind]}</h3>
      {selections.length === 0 ? (
        <p className="selected-list-empty">
          No {labels[kind].toLocaleLowerCase()} recorded.
        </p>
      ) : (
        selections.map((selection) => {
          const definition = selection.definitionId
            ? focusDefinitionsByKind[kind].get(selection.definitionId)
            : undefined;
          const displayName =
            definition?.name ||
            selection.customName ||
            selection.unresolvedDefinitionName ||
            `Untitled ${kind}`;
          return (
            <article
              className="magick-selected-card"
              id={`selected-focus-${selection.id}`}
              key={selection.id}
            >
              <div className="magick-selected-card__heading">
                <div>
                  <h4>{displayName}</h4>
                  <p>
                    {definition
                      ? `${definition.family.replace('-', ' ')} · reference preview`
                      : selection.definitionId
                        ? 'Unresolved catalog reference'
                        : `Custom ${kind}`}
                  </p>
                </div>
                <button
                  type="button"
                  className="small-button small-button--danger"
                  onClick={() => onRemove(selection.id)}
                >
                  Remove
                </button>
              </div>

              {!definition && !selection.definitionId ? (
                <label>
                  <span>Custom name</span>
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

              {definition && <MageSourceWarning entry={definition} />}
              {definition ? (
                <details className="magick-reference-note">
                  <summary>Reference note</summary>
                  <p>{definition.summary}</p>
                  <small>{definition.citation}</small>
                </details>
              ) : selection.definitionId ? (
                <p className="selected-reference-warning">
                  Definition ID: {selection.definitionId}. This unknown
                  reference remains preserved in the character.
                </p>
              ) : null}

              {kind === 'instrument' ? (
                <label className="magick-check-row">
                  <input
                    type="checkbox"
                    checked={
                      'significant' in selection && selection.significant
                    }
                    onChange={(event) =>
                      onUpdate(selection.id, {
                        significant: event.target.checked,
                      })
                    }
                  />
                  <span>Significant to this mage</span>
                </label>
              ) : null}

              <label>
                <span>Character notes</span>
                <textarea
                  rows={2}
                  value={selection.notes}
                  onChange={(event) =>
                    onUpdate(selection.id, { notes: event.target.value })
                  }
                />
              </label>
            </article>
          );
        })
      )}
    </div>
  );
}
