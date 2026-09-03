import { useState } from 'react';
import { useEditorStore } from '../../state/editor-store';
import {
  equipmentCatalog,
  type EquipmentCategory,
  type EquipmentDefinition,
} from '../../systems/mage-m20/reference/equipment';
import { MageReferenceCatalog as ReferenceCatalog } from '../../games/mage20/supplements/MageReferenceCatalog';
import { SheetSection } from '../layout/SheetSection';
import { SelectedEquipmentList } from './equipment/SelectedEquipmentList';

const categoryLabels: Record<EquipmentCategory, string> = {
  melee: 'Melee weapon',
  ranged: 'Ranged weapon',
  armor: 'Armor',
  gear: 'Field gear',
};

export function EquipmentSection() {
  const character = useEditorStore((state) => state.character);
  const addEquipment = useEditorStore((state) => state.addEquipment);
  const updateEquipment = useEditorStore((state) => state.updateEquipment);
  const removeEquipment = useEditorStore((state) => state.removeEquipment);
  const lastRemoval = useEditorStore((state) => state.lastEquipmentRemoval);
  const undoRemoval = useEditorStore((state) => state.undoEquipmentRemoval);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customCategory, setCustomCategory] =
    useState<EquipmentCategory>('gear');

  if (!character) {
    return null;
  }

  const equipment = character.repeatableEntries.equipment;
  const selectedDefinitionIds = new Set(
    equipment.flatMap((item) => (item.definitionId ? [item.definitionId] : [])),
  );
  const canAddCustom =
    customName.trim().length > 0 && customDescription.trim().length > 0;

  return (
    <SheetSection
      id="equipment"
      eyebrow="Weapons, protection, and field gear"
      title="Equipment"
      description="Record carried items and keep their important reference information close at hand."
      actions={
        <button
          type="button"
          className="secondary-button"
          aria-expanded={catalogOpen}
          aria-controls="equipment-reference-catalog"
          onClick={() => setCatalogOpen((open) => !open)}
        >
          {catalogOpen ? 'Close equipment catalog' : 'Browse equipment catalog'}
        </button>
      }
    >
      <div className="equipment-custom-adder">
        <label>
          <span>Custom equipment name</span>
          <input
            value={customName}
            placeholder="Name the item"
            onChange={(event) => setCustomName(event.target.value)}
          />
        </label>
        <label>
          <span>Custom description</span>
          <input
            value={customDescription}
            placeholder="What is it or what matters about it?"
            onChange={(event) => setCustomDescription(event.target.value)}
          />
        </label>
        <label>
          <span>Custom category</span>
          <select
            value={customCategory}
            onChange={(event) =>
              setCustomCategory(event.target.value as EquipmentCategory)
            }
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="primary-button"
          disabled={!canAddCustom}
          onClick={() => {
            const id = addEquipment(undefined, {
              name: customName,
              description: customDescription,
              category: customCategory,
            });
            if (id) {
              setCustomName('');
              setCustomDescription('');
              setCustomCategory('gear');
            }
          }}
        >
          Add custom equipment
        </button>
        {lastRemoval ? (
          <button
            type="button"
            className="small-button small-button--quiet"
            onClick={undoRemoval}
          >
            Undo removal
          </button>
        ) : null}
      </div>

      <SelectedEquipmentList
        equipment={equipment}
        onUpdate={updateEquipment}
        onRemove={removeEquipment}
      />

      {catalogOpen ? (
        <div id="equipment-reference-catalog">
          <p className="reference-preview-note">
            Reference preview: statistics and citations from the supplied
            research still need source verification. Supplemental World of
            Darkness: Armory traits require Storyteller conversion before use
            with Mage 20. Catalog items do not change character ratings
            automatically.
          </p>
          <ReferenceCatalog
            label="Equipment"
            entries={equipmentCatalog}
            selectedDefinitionIds={selectedDefinitionIds}
            getMeta={(definition: EquipmentDefinition) =>
              `${categoryLabels[definition.category]} · ${
                definition.statistics || 'No statistics supplied'
              }`
            }
            onAdd={(definition) => addEquipment(definition.id)}
          />
        </div>
      ) : null}
    </SheetSection>
  );
}
