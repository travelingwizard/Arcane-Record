import { useMemo, useState } from 'react';
import { BackgroundCatalog } from '../../components/character/backgrounds/BackgroundCatalog';
import { BackgroundSummary } from '../../components/character/backgrounds/BackgroundSummary';
import { SelectedBackgroundList } from '../../components/character/backgrounds/SelectedBackgroundList';
import {
  backgroundCreationRules,
  calculateBackgroundTotals,
} from '../../systems/mage-m20/background-rules';
import type { BackgroundDefinition } from '../../systems/mage-m20/reference/backgrounds';
import type { SelectedBackground } from '../../types/character';
import { readDataPath } from '../schema/data-path';
import type { ModuleComponentDefinition } from '../schema/module-envelope';

type Component = Extract<
  ModuleComponentDefinition,
  { type: 'mage20-background-catalog' }
>;

export function ModuleMageBackgrounds({
  component,
  data,
  readOnly,
  onPathChange,
  catalogEntries,
}: {
  component: Component;
  data: Record<string, unknown>;
  readOnly: boolean;
  onPathChange: (path: Component['selectionsPath'], value: unknown) => void;
  catalogEntries: readonly unknown[];
}) {
  const stored = readDataPath(data, component.selectionsPath);
  const selections = useMemo(
    () => (Array.isArray(stored) ? stored : []) as SelectedBackground[],
    [stored],
  );
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [undo, setUndo] = useState<SelectedBackground[] | null>(null);
  const [focusSelectionId, setFocusSelectionId] = useState<string | null>(null);
  const totals = useMemo(
    () => calculateBackgroundTotals(selections),
    [selections],
  );
  const selectedDefinitionIds = useMemo(
    () => new Set(selections.map(({ definitionId }) => definitionId)),
    [selections],
  );
  const commit = (next: SelectedBackground[]) => {
    setUndo(structuredClone(selections));
    onPathChange(component.selectionsPath, next);
  };
  const add = (definition: BackgroundDefinition) => {
    if (
      !definition.canBeSelectedMultipleTimes &&
      selectedDefinitionIds.has(definition.id)
    )
      return;
    const id = crypto.randomUUID();
    commit([
      ...selections,
      {
        id,
        definitionId: definition.id,
        displayName: definition.name,
        rating: definition.minimumRating,
        notes: '',
        addedAt: new Date().toISOString(),
        pooled: false,
      },
    ]);
    setFocusSelectionId(id);
  };
  const update = (selectionId: string, patch: Partial<SelectedBackground>) =>
    commit(
      selections.map((selection) =>
        selection.id === selectionId ? { ...selection, ...patch } : selection,
      ),
    );

  return (
    <div className="backgrounds-section">
      <div className="module-catalog-heading-actions">
        <button
          type="button"
          className="secondary-button"
          aria-expanded={catalogOpen}
          onClick={() => setCatalogOpen((current) => !current)}
        >
          {catalogOpen ? 'Close catalog' : 'Open catalog'}
        </button>
        {undo ? (
          <button
            type="button"
            className="small-button small-button--quiet"
            onClick={() => {
              onPathChange(component.selectionsPath, undo);
              setUndo(null);
            }}
          >
            Undo last Background change
          </button>
        ) : null}
      </div>
      <BackgroundSummary totals={totals} />
      {totals.pointsOver > 0 ? (
        <p className="background-warning" role="status">
          This character has spent {totals.pointsSpent} Background points.
          Standard Mage M20 character creation normally provides{' '}
          {backgroundCreationRules.standardBackgroundPoints} points.
        </p>
      ) : null}
      <SelectedBackgroundList
        selections={selections}
        sort="added"
        focusSelectionId={focusSelectionId}
        ratingsReadOnly={readOnly}
        onUpdate={update}
        onRepair={(selectionId, definitionId) =>
          update(selectionId, { definitionId })
        }
        onRemove={(selectionId) =>
          commit(selections.filter(({ id }) => id !== selectionId))
        }
      />
      {catalogOpen ? (
        <BackgroundCatalog
          definitions={catalogEntries as BackgroundDefinition[]}
          totals={totals}
          selectedDefinitionIds={selectedDefinitionIds}
          onAdd={add}
        />
      ) : null}
    </div>
  );
}
