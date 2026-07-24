import { useMemo, useState } from 'react';
import { calculateMeritFlawTotals } from '../../systems/mage-m20/merit-flaw-rules';
import type {
  MeritFlawDefinition,
  MeritFlawKind,
} from '../../systems/mage-m20/reference/merits-flaws';
import { useEditorStore } from '../../state/editor-store';
import type { SelectedMeritFlaw } from '../../types/character';
import { SheetSection } from '../layout/SheetSection';
import { MeritFlawCatalog } from './merits-flaws/MeritFlawCatalog';
import { MeritFlawSummary } from './merits-flaws/MeritFlawSummary';
import {
  SelectedMeritFlawList,
  type SelectedMeritFlawSort,
} from './merits-flaws/SelectedMeritFlawList';

const emptySelections: SelectedMeritFlaw[] = [];

export function MeritsFlawsSection() {
  const entries = useEditorStore((state) => state.character?.repeatableEntries);
  const lastChange = useEditorStore((state) => state.lastMeritFlawChange);
  const addMeritFlaw = useEditorStore((state) => state.addMeritFlaw);
  const updateMeritFlaw = useEditorStore((state) => state.updateMeritFlaw);
  const removeMeritFlaw = useEditorStore((state) => state.removeMeritFlaw);
  const undoMeritFlawChange = useEditorStore(
    (state) => state.undoMeritFlawChange,
  );
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [selectedSort, setSelectedSort] =
    useState<SelectedMeritFlawSort>('added');
  const [announcement, setAnnouncement] = useState('');

  const merits = entries?.merits ?? emptySelections;
  const flaws = entries?.flaws ?? emptySelections;
  const totals = useMemo(
    () => calculateMeritFlawTotals(merits, flaws),
    [flaws, merits],
  );
  const selectedDefinitionIds = useMemo(
    () =>
      new Set([...merits, ...flaws].map((selection) => selection.definitionId)),
    [flaws, merits],
  );

  if (!entries) {
    return null;
  }

  const add = (definition: MeritFlawDefinition, cost: number) => {
    addMeritFlaw(definition.kind, definition.id, cost);
    setAnnouncement(
      `${definition.name} added as a ${cost}-point ${definition.kind}.`,
    );
  };

  const remove = (kind: MeritFlawKind, selectionId: string) => {
    removeMeritFlaw(kind, selectionId);
    setAnnouncement(`${kind === 'merit' ? 'Merit' : 'Flaw'} removed.`);
  };

  return (
    <SheetSection
      id="merits-flaws"
      eyebrow="Gifts and burdens"
      title="Merits & Flaws"
      description="Optional qualities selected from the cited Mage M20 reference catalog."
      className="merits-flaws-section"
      actions={
        <button
          type="button"
          className="secondary-button"
          aria-expanded={catalogOpen}
          aria-controls="merits-flaws-catalog"
          onClick={() => setCatalogOpen((current) => !current)}
        >
          {catalogOpen ? 'Close catalog' : 'Open catalog'}
        </button>
      }
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Merits {totals.meritPointTotal} points. Flaws {totals.flawPointTotal} of
        7 points. Net character-creation cost {totals.netCharacterCreationCost}{' '}
        points. {announcement}
      </div>

      <MeritFlawSummary totals={totals} />

      {totals.excessFlawPoints > 0 ? (
        <p className="merit-flaw-warning" role="status">
          This character has selected {totals.flawPointTotal} points of Flaws.
          Standard Mage M20 character creation normally grants benefits for no
          more than 7 Flaw points.
        </p>
      ) : null}

      <div className="merit-flaw-section-toolbar">
        <p>
          Merits and Flaws are optional. The Storyteller determines which
          selections are permitted.
        </p>
        <label>
          <span>Sort selected lists</span>
          <select
            value={selectedSort}
            onChange={(event) =>
              setSelectedSort(event.target.value as SelectedMeritFlawSort)
            }
          >
            <option value="added">Order added</option>
            <option value="name">Name</option>
            <option value="cost">Point cost</option>
            <option value="category">Category</option>
          </select>
        </label>
        {lastChange ? (
          <button
            type="button"
            className="small-button small-button--quiet"
            onClick={() => {
              undoMeritFlawChange();
              setAnnouncement('Last Merits and Flaws change undone.');
            }}
          >
            Undo last change
          </button>
        ) : null}
      </div>

      <div className="selected-merit-flaw-columns">
        <SelectedMeritFlawList
          kind="merit"
          selections={merits}
          sort={selectedSort}
          onUpdate={(selectionId, update) =>
            updateMeritFlaw('merit', selectionId, update)
          }
          onRemove={(selectionId) => remove('merit', selectionId)}
        />
        <SelectedMeritFlawList
          kind="flaw"
          selections={flaws}
          sort={selectedSort}
          onUpdate={(selectionId, update) =>
            updateMeritFlaw('flaw', selectionId, update)
          }
          onRemove={(selectionId) => remove('flaw', selectionId)}
        />
      </div>

      {catalogOpen ? (
        <div id="merits-flaws-catalog">
          <MeritFlawCatalog
            totals={totals}
            selectedDefinitionIds={selectedDefinitionIds}
            onAdd={add}
            onViewSelected={(definitionId) =>
              document
                .getElementById(`selected-${definitionId}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          />
        </div>
      ) : null}
    </SheetSection>
  );
}
