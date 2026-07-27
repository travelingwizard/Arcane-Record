import { useState } from 'react';
import { equipmentById } from '../../../systems/mage-m20/reference/equipment';
import type {
  EquipmentCategory,
  OwnedEquipment,
} from '../../../types/character';

const categoryLabels: Record<EquipmentCategory, string> = {
  melee: 'Melee weapon',
  ranged: 'Ranged weapon',
  armor: 'Armor',
  gear: 'Field gear',
};

export function SelectedEquipmentList({
  equipment,
  onUpdate,
  onRemove,
}: {
  equipment: OwnedEquipment[];
  onUpdate: (
    selectionId: string,
    update: Partial<
      Pick<
        OwnedEquipment,
        'name' | 'category' | 'description' | 'quantity' | 'equipped' | 'notes'
      >
    >,
  ) => void;
  onRemove: (selectionId: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (equipment.length === 0) {
    return <p className="selected-list-empty">No equipment recorded.</p>;
  }

  return (
    <div className="magick-selected-list">
      {equipment.map((item) => {
        const definition = item.definitionId
          ? equipmentById.get(item.definitionId)
          : undefined;
        const isExpanded = expanded.has(item.id);
        const detailsId = `selected-equipment-${item.id}-details`;

        return (
          <article className="magick-selected-card" key={item.id}>
            <div className="magick-selected-card__heading">
              <div>
                <div className="catalog-card__labels">
                  <span className="kind-badge">
                    {categoryLabels[item.category]}
                  </span>
                  {item.equipped ? <span>Equipped</span> : null}
                  {item.quantity > 1 ? <span>×{item.quantity}</span> : null}
                </div>
                <h3>{item.name.trim() || 'Untitled equipment'}</h3>
                <p>
                  {definition?.statistics ||
                    item.description ||
                    'No details recorded'}
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label={`${
                  isExpanded ? 'Collapse' : 'Expand'
                } ${item.name || 'Untitled equipment'}`}
                aria-expanded={isExpanded}
                aria-controls={detailsId}
                onClick={() =>
                  setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(item.id)) {
                      next.delete(item.id);
                    } else {
                      next.add(item.id);
                    }
                    return next;
                  })
                }
              >
                {isExpanded ? '⌃' : '⌄'}
              </button>
            </div>

            {definition ? (
              <p className="catalog-card__source">
                {definition.citation} · reference preview
              </p>
            ) : item.definitionId ? (
              <p className="selected-reference-warning">
                Unknown definition {item.definitionId} is preserved.
              </p>
            ) : (
              <p className="catalog-card__source">Custom equipment</p>
            )}

            {isExpanded ? (
              <div className="magick-selected-card__details" id={detailsId}>
                {definition ? (
                  <div className="equipment-reference-note">
                    <p>
                      <strong>Important information:</strong>{' '}
                      {definition.statistics || 'No statistics supplied'}
                    </p>
                    <p>{definition.summary}</p>
                  </div>
                ) : null}

                <div className="equipment-field-grid">
                  <label>
                    <span>Name</span>
                    <input
                      value={item.name}
                      onChange={(event) =>
                        onUpdate(item.id, { name: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span>Category</span>
                    <select
                      value={item.category}
                      disabled={Boolean(definition)}
                      onChange={(event) =>
                        onUpdate(item.id, {
                          category: event.target.value as EquipmentCategory,
                        })
                      }
                    >
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Quantity</span>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={item.quantity}
                      onChange={(event) =>
                        onUpdate(item.id, {
                          quantity: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="equipment-equipped-toggle">
                    <input
                      type="checkbox"
                      checked={item.equipped}
                      onChange={(event) =>
                        onUpdate(item.id, { equipped: event.target.checked })
                      }
                    />
                    <span>Equipped or readied</span>
                  </label>
                </div>

                <label>
                  <span>Description</span>
                  <textarea
                    rows={3}
                    value={item.description}
                    onChange={(event) =>
                      onUpdate(item.id, { description: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Character notes</span>
                  <textarea
                    rows={3}
                    value={item.notes}
                    onChange={(event) =>
                      onUpdate(item.id, { notes: event.target.value })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="small-button small-button--danger"
                  onClick={() => onRemove(item.id)}
                >
                  Remove equipment
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
