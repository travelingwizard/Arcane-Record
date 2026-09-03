import { useState } from 'react';
import { useEditorStore } from '../../state/editor-store';
import {
  wonderCatalog,
  type WonderDefinition,
} from '../../systems/mage-m20/reference/wonders';
import { MageReferenceCatalog as ReferenceCatalog } from '../../games/mage20/supplements/MageReferenceCatalog';
import { SheetSection } from '../layout/SheetSection';
import { SelectedWonderList } from './wonders/SelectedWonderList';

export function WondersSection() {
  const character = useEditorStore((state) => state.character);
  const addWonder = useEditorStore((state) => state.addWonder);
  const updateWonder = useEditorStore((state) => state.updateWonder);
  const removeWonder = useEditorStore((state) => state.removeWonder);
  const lastRemoval = useEditorStore((state) => state.lastMagickRemoval);
  const undoMagickRemoval = useEditorStore((state) => state.undoMagickRemoval);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [customName, setCustomName] = useState('');

  if (!character) {
    return null;
  }

  const wonders = character.repeatableEntries.wonders;
  const selectedDefinitionIds = new Set(
    wonders.flatMap((wonder) =>
      wonder.definitionId ? [wonder.definitionId] : [],
    ),
  );

  return (
    <SheetSection
      id="wonders"
      eyebrow="Enchanted and Enlightened objects"
      title="Wonders"
      description="Record the named objects, devices, and creations carried by this character."
      actions={
        <button
          type="button"
          className="secondary-button"
          aria-expanded={catalogOpen}
          aria-controls="wonder-reference-catalog"
          onClick={() => setCatalogOpen((open) => !open)}
        >
          {catalogOpen ? 'Close reference catalog' : 'Browse Wonder references'}
        </button>
      }
    >
      <div className="magick-custom-adder">
        <label>
          <span>Custom Wonder name</span>
          <input
            value={customName}
            placeholder="Name a custom Wonder"
            onChange={(event) => setCustomName(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="primary-button"
          disabled={!customName.trim()}
          onClick={() => {
            const id = addWonder(undefined, customName);
            if (id) {
              setCustomName('');
            }
          }}
        >
          Add custom Wonder
        </button>
        {lastRemoval?.type === 'wonder' ? (
          <button
            type="button"
            className="small-button small-button--quiet"
            onClick={undoMagickRemoval}
          >
            Undo removal
          </button>
        ) : null}
      </div>

      <SelectedWonderList
        wonders={wonders}
        onUpdate={updateWonder}
        onRemove={removeWonder}
      />

      {catalogOpen ? (
        <div id="wonder-reference-catalog">
          <p className="reference-preview-note">
            Reference preview: this supplied list is useful for inspiration but
            is not yet a verified or exhaustive catalog.
          </p>
          <ReferenceCatalog
            label="Wonders"
            entries={wonderCatalog}
            selectedDefinitionIds={selectedDefinitionIds}
            getMeta={(definition: WonderDefinition) =>
              definition.typeLabel || 'Type requires review'
            }
            onAdd={(definition) => addWonder(definition.id)}
          />
        </div>
      ) : null}
    </SheetSection>
  );
}
