import { useState } from 'react';
import { useEditorStore } from '../../state/editor-store';
import {
  roteCatalog,
  type RoteDefinition,
} from '../../systems/mage-m20/reference/rotes';
import { ReferenceCatalog } from '../controls/ReferenceCatalog';
import { SheetSection } from '../layout/SheetSection';
import { SelectedRoteList } from './rotes/SelectedRoteList';

export function RotesSection() {
  const character = useEditorStore((state) => state.character);
  const addRote = useEditorStore((state) => state.addRote);
  const updateRote = useEditorStore((state) => state.updateRote);
  const removeRote = useEditorStore((state) => state.removeRote);
  const lastRemoval = useEditorStore((state) => state.lastMagickRemoval);
  const undoMagickRemoval = useEditorStore((state) => state.undoMagickRemoval);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [customName, setCustomName] = useState('');

  if (!character) {
    return null;
  }

  const rotes = character.repeatableEntries.rotes;
  const selectedDefinitionIds = new Set(
    rotes.flatMap((rote) => (rote.definitionId ? [rote.definitionId] : [])),
  );

  return (
    <SheetSection
      id="rotes"
      eyebrow="Personal Effects and procedures"
      title="Rotes"
      description="Keep the character's practiced Effects, Sphere requirements, and Focus notes together."
      actions={
        <button
          type="button"
          className="secondary-button"
          aria-expanded={catalogOpen}
          aria-controls="rote-reference-catalog"
          onClick={() => setCatalogOpen((open) => !open)}
        >
          {catalogOpen ? 'Close reference catalog' : 'Browse Rote references'}
        </button>
      }
    >
      <div className="magick-custom-adder">
        <label>
          <span>Custom Rote name</span>
          <input
            value={customName}
            placeholder="Name a custom Rote"
            onChange={(event) => setCustomName(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="primary-button"
          disabled={!customName.trim()}
          onClick={() => {
            const id = addRote(undefined, customName);
            if (id) {
              setCustomName('');
            }
          }}
        >
          Add custom Rote
        </button>
        {lastRemoval?.type === 'rote' ? (
          <button
            type="button"
            className="small-button small-button--quiet"
            onClick={undoMagickRemoval}
          >
            Undo removal
          </button>
        ) : null}
      </div>

      <SelectedRoteList
        rotes={rotes}
        onUpdate={updateRote}
        onRemove={removeRote}
      />

      {catalogOpen ? (
        <div id="rote-reference-catalog">
          <p className="reference-preview-note">
            Reference preview: supplied citations and requirements remain
            unverified. Indexed-only names are labeled in their summaries.
          </p>
          <ReferenceCatalog
            label="Rotes"
            entries={roteCatalog}
            selectedDefinitionIds={selectedDefinitionIds}
            getMeta={(definition: RoteDefinition) =>
              definition.requirements || 'Requirements not supplied'
            }
            onAdd={(definition) => addRote(definition.id)}
          />
        </div>
      ) : null}
    </SheetSection>
  );
}
