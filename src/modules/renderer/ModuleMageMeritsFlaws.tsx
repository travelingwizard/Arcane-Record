import { useMemo, useState } from 'react';
import { MeritFlawCatalog } from '../../components/character/merits-flaws/MeritFlawCatalog';
import { MeritFlawSummary } from '../../components/character/merits-flaws/MeritFlawSummary';
import { SelectedMeritFlawList } from '../../components/character/merits-flaws/SelectedMeritFlawList';
import { calculateMeritFlawTotals } from '../../systems/mage-m20/merit-flaw-rules';
import type {
  MeritFlawDefinition,
  MeritFlawKind,
} from '../../systems/mage-m20/reference/merits-flaws';
import type { SelectedMeritFlaw } from '../../types/character';
import { readDataPath } from '../schema/data-path';
import type { ModuleComponentDefinition } from '../schema/module-envelope';

type Component = Extract<
  ModuleComponentDefinition,
  { type: 'mage20-merits-flaws-catalog' }
>;

export function ModuleMageMeritsFlaws({
  component,
  data,
  onPathsChange,
  catalogEntries,
}: {
  component: Component;
  data: Record<string, unknown>;
  onPathsChange: (
    changes: Array<{ path: Component['meritsPath']; value: unknown }>,
  ) => void;
  catalogEntries: readonly unknown[];
}) {
  const storedMerits = readDataPath(data, component.meritsPath);
  const storedFlaws = readDataPath(data, component.flawsPath);
  const merits = useMemo(
    () =>
      (Array.isArray(storedMerits) ? storedMerits : []) as SelectedMeritFlaw[],
    [storedMerits],
  );
  const flaws = useMemo(
    () =>
      (Array.isArray(storedFlaws) ? storedFlaws : []) as SelectedMeritFlaw[],
    [storedFlaws],
  );
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [undo, setUndo] = useState<{
    merits: SelectedMeritFlaw[];
    flaws: SelectedMeritFlaw[];
  } | null>(null);
  const totals = useMemo(
    () => calculateMeritFlawTotals(merits, flaws),
    [merits, flaws],
  );
  const selectedDefinitionIds = useMemo(
    () =>
      new Set([...merits, ...flaws].map(({ definitionId }) => definitionId)),
    [merits, flaws],
  );
  const commit = (
    nextMerits: SelectedMeritFlaw[],
    nextFlaws: SelectedMeritFlaw[],
  ) => {
    setUndo({ merits: structuredClone(merits), flaws: structuredClone(flaws) });
    onPathsChange([
      { path: component.meritsPath, value: nextMerits },
      { path: component.flawsPath, value: nextFlaws },
    ]);
  };
  const listFor = (kind: MeritFlawKind) => (kind === 'merit' ? merits : flaws);
  const update = (
    kind: MeritFlawKind,
    id: string,
    patch: Partial<SelectedMeritFlaw>,
  ) => {
    const next = listFor(kind).map((selection) =>
      selection.id === id ? { ...selection, ...patch } : selection,
    );
    commit(kind === 'merit' ? next : merits, kind === 'flaw' ? next : flaws);
  };
  const add = (definition: MeritFlawDefinition, chosenCost: number) => {
    if (selectedDefinitionIds.has(definition.id)) return;
    const selection: SelectedMeritFlaw = {
      id: crypto.randomUUID(),
      definitionId: definition.id,
      chosenCost,
      notes: '',
      addedAt: new Date().toISOString(),
    };
    commit(
      definition.kind === 'merit' ? [...merits, selection] : merits,
      definition.kind === 'flaw' ? [...flaws, selection] : flaws,
    );
  };

  return (
    <div className="merits-flaws-section">
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
              onPathsChange([
                { path: component.meritsPath, value: undo.merits },
                { path: component.flawsPath, value: undo.flaws },
              ]);
              setUndo(null);
            }}
          >
            Undo last change
          </button>
        ) : null}
      </div>
      <MeritFlawSummary totals={totals} />
      {totals.excessFlawPoints > 0 ? (
        <p className="merit-flaw-warning" role="status">
          This character has selected {totals.flawPointTotal} points of Flaws.
          Standard Mage M20 character creation normally grants benefits for no
          more than 7 Flaw points.
        </p>
      ) : null}
      <div className="selected-merit-flaw-columns">
        {(['merit', 'flaw'] as const).map((kind) => (
          <SelectedMeritFlawList
            key={kind}
            kind={kind}
            selections={listFor(kind)}
            sort="added"
            onUpdate={(id, patch) => update(kind, id, patch)}
            onRemove={(id) => {
              const next = listFor(kind).filter(
                (selection) => selection.id !== id,
              );
              commit(
                kind === 'merit' ? next : merits,
                kind === 'flaw' ? next : flaws,
              );
            }}
          />
        ))}
      </div>
      {catalogOpen ? (
        <MeritFlawCatalog
          definitions={catalogEntries as MeritFlawDefinition[]}
          totals={totals}
          selectedDefinitionIds={selectedDefinitionIds}
          onAdd={add}
          onViewSelected={(definitionId) =>
            document
              .getElementById(`selected-${definitionId}`)
              ?.scrollIntoView({ block: 'center' })
          }
        />
      ) : null}
    </div>
  );
}
