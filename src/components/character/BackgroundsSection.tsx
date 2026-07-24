import { useMemo, useState } from 'react';
import {
  backgroundCreationRules,
  calculateBackgroundTotals,
} from '../../systems/mage-m20/background-rules';
import type { BackgroundDefinition } from '../../systems/mage-m20/reference/backgrounds';
import { useEditorStore } from '../../state/editor-store';
import type { SelectedBackground } from '../../types/character';
import { SheetSection } from '../layout/SheetSection';
import { BackgroundCatalog } from './backgrounds/BackgroundCatalog';
import { BackgroundSummary } from './backgrounds/BackgroundSummary';
import {
  SelectedBackgroundList,
  type SelectedBackgroundSort,
} from './backgrounds/SelectedBackgroundList';

const emptyBackgrounds: SelectedBackground[] = [];

export function BackgroundsSection() {
  const backgrounds =
    useEditorStore((state) => state.character?.repeatableEntries.backgrounds) ??
    emptyBackgrounds;
  const lastChange = useEditorStore((state) => state.lastBackgroundChange);
  const addBackground = useEditorStore((state) => state.addBackground);
  const updateBackground = useEditorStore((state) => state.updateBackground);
  const repairBackground = useEditorStore((state) => state.repairBackground);
  const removeBackground = useEditorStore((state) => state.removeBackground);
  const undoBackgroundChange = useEditorStore(
    (state) => state.undoBackgroundChange,
  );
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [selectedSort, setSelectedSort] =
    useState<SelectedBackgroundSort>('added');
  const [focusSelectionId, setFocusSelectionId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const totals = useMemo(
    () => calculateBackgroundTotals(backgrounds),
    [backgrounds],
  );
  const selectedDefinitionIds = useMemo(
    () => new Set(backgrounds.map((selection) => selection.definitionId)),
    [backgrounds],
  );

  const add = (definition: BackgroundDefinition) => {
    const selectionId = addBackground(definition.id);
    if (!selectionId) {
      return;
    }
    setFocusSelectionId(selectionId);
    setAnnouncement(
      `${definition.name} added at one dot for ${definition.creationPointCostPerDot} Background ${
        definition.creationPointCostPerDot === 1 ? 'point' : 'points'
      }.`,
    );
  };

  return (
    <SheetSection
      id="backgrounds"
      eyebrow="Resources and connections"
      title="Backgrounds"
      description="Rated advantages selected from the cited Mage M20 reference catalog."
      className="backgrounds-section"
      actions={
        <button
          type="button"
          className="secondary-button"
          aria-expanded={catalogOpen}
          aria-controls="background-catalog"
          onClick={() => setCatalogOpen((current) => !current)}
        >
          {catalogOpen ? 'Close catalog' : 'Open catalog'}
        </button>
      }
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Backgrounds cost {totals.pointsSpent} of {totals.standardAllowance}{' '}
        points.{' '}
        {totals.pointsOver > 0
          ? `${totals.pointsOver} points over the standard allowance.`
          : `${totals.pointsRemaining} points remaining.`}{' '}
        {totals.selectedCount} selected. {announcement}
      </div>

      <BackgroundSummary totals={totals} />

      {totals.pointsOver > 0 ? (
        <p className="background-warning" role="status">
          This character has spent {totals.pointsSpent} Background points.
          Standard Mage M20 character creation normally provides{' '}
          {backgroundCreationRules.standardBackgroundPoints} points.
        </p>
      ) : null}

      <div className="background-section-toolbar">
        <p>
          Standard Mage M20 character creation provides 7 Background points. The
          Storyteller determines which Backgrounds, ratings, and restrictions
          are appropriate.
        </p>
        <label>
          <span>Sort selected Backgrounds</span>
          <select
            value={selectedSort}
            onChange={(event) =>
              setSelectedSort(event.target.value as SelectedBackgroundSort)
            }
          >
            <option value="added">Order added</option>
            <option value="display-name">Character display name</option>
            <option value="reference-name">Reference name</option>
            <option value="rating">Rating</option>
            <option value="cost">Creation-point cost</option>
          </select>
        </label>
        {lastChange ? (
          <button
            type="button"
            className="small-button small-button--quiet"
            onClick={() => {
              undoBackgroundChange();
              setAnnouncement('Last Background change undone.');
            }}
          >
            Undo last Background change
          </button>
        ) : null}
      </div>

      <SelectedBackgroundList
        selections={backgrounds}
        sort={selectedSort}
        focusSelectionId={focusSelectionId}
        onUpdate={updateBackground}
        onRepair={(selectionId, definitionId) => {
          repairBackground(selectionId, definitionId);
          setAnnouncement('Background reference repaired.');
        }}
        onRemove={(selectionId) => {
          removeBackground(selectionId);
          setAnnouncement('Background removed.');
        }}
      />

      {catalogOpen ? (
        <div id="background-catalog">
          <BackgroundCatalog
            totals={totals}
            selectedDefinitionIds={selectedDefinitionIds}
            onAdd={add}
          />
        </div>
      ) : null}
    </SheetSection>
  );
}
