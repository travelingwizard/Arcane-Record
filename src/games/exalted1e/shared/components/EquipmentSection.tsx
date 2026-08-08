import { useMemo, useState } from 'react';
import type { Exalted1eCharacter } from '../../schema';
import {
  exaltedAmmunitionCatalog,
  exaltedArmorCatalog,
  exaltedWeaponCatalog,
} from '../equipment/catalog';
import type {
  EquipmentKind,
  EquipmentQuality,
  MagicalMaterial,
  OwnedEquipment,
} from '../equipment/types';

type EquipmentState = Exalted1eCharacter['equipment'];
type EquipmentGroup = keyof EquipmentState;

const groupForKind: Record<EquipmentKind, EquipmentGroup> = {
  weapon: 'weapons',
  armor: 'armor',
  shield: 'shields',
  ammunition: 'ammunition',
};

const kindLabels: Record<EquipmentKind, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  shield: 'Shield',
  ammunition: 'Ammunition',
};

function blankItem(
  kind: EquipmentKind,
  definitionId: string | null,
  customName = '',
): OwnedEquipment {
  const modeId =
    kind === 'weapon' && definitionId
      ? (exaltedWeaponCatalog.find(({ id }) => id === definitionId)?.modes[0]
          ?.id ?? null)
      : null;
  return {
    id: crypto.randomUUID(),
    kind,
    definitionId,
    customName,
    modeId,
    quality: 'normal',
    qualityAdjustments: {
      speed: 0,
      accuracy: 0,
      damage: 0,
      defense: 0,
      rate: 0,
      range: 0,
    },
    material: 'none',
    equipped: kind !== 'ammunition',
    attuned: false,
    committedEssence: 0,
    ammunition: { current: null, typeId: null },
    enhancements: [],
    notes: '',
  };
}

function definitionName(item: OwnedEquipment) {
  if (item.customName.trim()) return item.customName;
  if (item.kind === 'weapon')
    return exaltedWeaponCatalog.find(({ id }) => id === item.definitionId)
      ?.name;
  if (item.kind === 'armor')
    return exaltedArmorCatalog.find(({ id }) => id === item.definitionId)?.name;
  if (item.kind === 'ammunition')
    return exaltedAmmunitionCatalog.find(({ id }) => id === item.definitionId)
      ?.name;
  return undefined;
}

interface Props {
  equipment: EquipmentState;
  onChange: (equipment: EquipmentState) => void;
}

export function EquipmentSection({ equipment, onChange }: Props) {
  const [kind, setKind] = useState<EquipmentKind>('weapon');
  const [definitionId, setDefinitionId] = useState('');
  const [customName, setCustomName] = useState('');
  const definitions = useMemo(() => {
    if (kind === 'weapon') return exaltedWeaponCatalog;
    if (kind === 'armor') return exaltedArmorCatalog;
    if (kind === 'ammunition') return exaltedAmmunitionCatalog;
    return [];
  }, [kind]);
  const allItems = Object.values(equipment).flat();

  const updateItem = (
    item: OwnedEquipment,
    changes: Partial<OwnedEquipment>,
  ) => {
    const group = groupForKind[item.kind];
    onChange({
      ...equipment,
      [group]: equipment[group].map((entry) =>
        entry.id === item.id ? { ...entry, ...changes } : entry,
      ),
    });
  };

  const add = () => {
    const chosenDefinition = definitionId || null;
    if (!chosenDefinition && !customName.trim()) return;
    const item = blankItem(kind, chosenDefinition, customName.trim());
    const group = groupForKind[kind];
    onChange({ ...equipment, [group]: [...equipment[group], item] });
    setDefinitionId('');
    setCustomName('');
  };

  return (
    <div className="exalted-equipment-section">
      <p className="section-note">
        Catalog definitions are shared by both Exalted sheet types. Names,
        attunement, ammunition, and modifications belong only to this character.
      </p>
      <div className="exalted-equipment-add">
        <label>
          <span>Equipment type</span>
          <select
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as EquipmentKind);
              setDefinitionId('');
            }}
          >
            {Object.entries(kindLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {definitions.length ? (
          <label>
            <span>Catalog definition</span>
            <select
              value={definitionId}
              onChange={(event) => setDefinitionId(event.target.value)}
            >
              <option value="">Custom item</option>
              {definitions.map((definition) => (
                <option key={definition.id} value={definition.id}>
                  {definition.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          <span>{definitionId ? 'Custom name (optional)' : 'Custom name'}</span>
          <input
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
          />
        </label>
        <button
          className="primary-button"
          type="button"
          disabled={!definitionId && !customName.trim()}
          onClick={add}
        >
          Add {kindLabels[kind]}
        </button>
      </div>

      <div className="exalted-equipment-list">
        {allItems.length ? (
          allItems.map((item) => {
            const group = groupForKind[item.kind];
            const weapon =
              item.kind === 'weapon'
                ? exaltedWeaponCatalog.find(
                    ({ id }) => id === item.definitionId,
                  )
                : undefined;
            return (
              <article key={item.id}>
                <div className="exalted-equipment-card__heading">
                  <div>
                    <p className="eyebrow">{kindLabels[item.kind]}</p>
                    <h3>{definitionName(item) ?? 'Custom item'}</h3>
                  </div>
                  <button
                    type="button"
                    className="small-button small-button--quiet"
                    onClick={() =>
                      onChange({
                        ...equipment,
                        [group]: equipment[group].filter(
                          ({ id }) => id !== item.id,
                        ),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
                {item.kind === 'weapon' && item.quality !== 'normal' ? (
                  <details className="exalted-quality-adjustments">
                    <summary>Recorded quality adjustments</summary>
                    <p className="section-note">
                      Enter only the allocation supported by the item source.
                      Exceptional allocations are selected by the character and
                      are not guessed automatically.
                    </p>
                    <div className="exalted-equipment-fields">
                      {(
                        [
                          'speed',
                          'accuracy',
                          'damage',
                          'defense',
                          'rate',
                          'range',
                        ] as const
                      ).map((field) => (
                        <label key={field}>
                          <span>{field}</span>
                          <input
                            type="number"
                            value={item.qualityAdjustments[field]}
                            onChange={(event) =>
                              updateItem(item, {
                                qualityAdjustments: {
                                  ...item.qualityAdjustments,
                                  [field]:
                                    Number.parseInt(event.target.value, 10) ||
                                    0,
                                },
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </details>
                ) : null}
                <div className="exalted-equipment-fields">
                  <label>
                    <span>Item name</span>
                    <input
                      value={item.customName}
                      placeholder={definitionName({ ...item, customName: '' })}
                      onChange={(event) =>
                        updateItem(item, { customName: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span>Quality</span>
                    <select
                      value={item.quality}
                      onChange={(event) =>
                        updateItem(item, {
                          quality: event.target.value as EquipmentQuality,
                        })
                      }
                    >
                      {[
                        'poor',
                        'normal',
                        'exceptional',
                        'perfect',
                        'custom',
                      ].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Magical Material</span>
                    <select
                      value={item.material}
                      onChange={(event) =>
                        updateItem(item, {
                          material: event.target.value as MagicalMaterial,
                        })
                      }
                    >
                      {[
                        'none',
                        'orichalcum',
                        'moonsilver',
                        'jade',
                        'starmetal',
                        'soulsteel',
                      ].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  {weapon && weapon.modes.length > 1 ? (
                    <label>
                      <span>Mode</span>
                      <select
                        value={item.modeId ?? ''}
                        onChange={(event) =>
                          updateItem(item, { modeId: event.target.value })
                        }
                      >
                        {weapon.modes.map((mode) => (
                          <option key={mode.id} value={mode.id}>
                            {mode.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {item.kind === 'weapon' ? (
                    <label>
                      <span>Ammunition</span>
                      <select
                        value={item.ammunition.typeId ?? ''}
                        onChange={(event) =>
                          updateItem(item, {
                            ammunition: {
                              ...item.ammunition,
                              typeId: event.target.value || null,
                            },
                          })
                        }
                      >
                        <option value="">None</option>
                        {exaltedAmmunitionCatalog.map((ammo) => (
                          <option key={ammo.id} value={ammo.id}>
                            {ammo.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label>
                    <span>Committed Essence</span>
                    <input
                      type="number"
                      min="0"
                      value={item.committedEssence}
                      onChange={(event) =>
                        updateItem(item, {
                          committedEssence: Math.max(
                            0,
                            Number.parseInt(event.target.value, 10) || 0,
                          ),
                        })
                      }
                    />
                  </label>
                </div>
                <div className="exalted-equipment-checks">
                  <label>
                    <input
                      type="checkbox"
                      checked={item.equipped}
                      onChange={(event) =>
                        updateItem(item, { equipped: event.target.checked })
                      }
                    />{' '}
                    Equipped
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={item.attuned}
                      onChange={(event) =>
                        updateItem(item, { attuned: event.target.checked })
                      }
                    />{' '}
                    Attuned
                  </label>
                </div>
                <label className="exalted-wide-field">
                  <span>Notes and enhancements</span>
                  <textarea
                    value={item.notes}
                    onChange={(event) =>
                      updateItem(item, { notes: event.target.value })
                    }
                  />
                </label>
              </article>
            );
          })
        ) : (
          <p className="empty-inline">No equipment recorded yet.</p>
        )}
      </div>
    </div>
  );
}
