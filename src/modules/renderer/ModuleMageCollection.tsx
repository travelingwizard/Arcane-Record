import { useMemo, useState } from 'react';
import {
  ReferenceCatalog,
  type ReferenceCatalogEntry,
} from '../../components/controls/ReferenceCatalog';
import { SelectedEquipmentList } from '../../components/character/equipment/SelectedEquipmentList';
import { FocusSelectionList } from '../../components/character/focus/FocusSelectionList';
import { CombatReference } from '../../components/character/maneuvers/CombatReference';
import { KnownDoManeuvers } from '../../components/character/maneuvers/KnownDoManeuvers';
import { SelectedRoteList } from '../../components/character/rotes/SelectedRoteList';
import { SelectedWonderList } from '../../components/character/wonders/SelectedWonderList';
import {
  type FocusDefinition,
  type FocusKind,
} from '../../systems/mage-m20/reference/focus';
import type { EquipmentDefinition } from '../../systems/mage-m20/reference/equipment';
import type { RoteDefinition } from '../../systems/mage-m20/reference/rotes';
import type { WonderDefinition } from '../../systems/mage-m20/reference/wonders';
import type {
  CombatManeuverDefinition,
  DoManeuverDefinition,
} from '../../systems/mage-m20/reference/maneuvers';
import type {
  CharacterManeuvers,
  FocusData,
  FocusSelection,
  InstrumentSelection,
  KnownRote,
  OwnedEquipment,
  OwnedWonder,
} from '../../types/character';
import { readDataPath } from '../schema/data-path';
import type { ModuleComponentDefinition } from '../schema/module-envelope';

type Component = Extract<
  ModuleComponentDefinition,
  { type: 'mage20-collection' }
>;

const focusLabels: Record<FocusKind, string> = {
  paradigm: 'Paradigm',
  practice: 'Practice',
  instrument: 'Instrument',
};

function id() {
  return crypto.randomUUID();
}

export function ModuleMageCollection({
  component,
  data,
  onPathChange,
  catalogEntries,
}: {
  component: Component;
  data: Record<string, unknown>;
  onPathChange: (path: Component['dataPath'], value: unknown) => void;
  catalogEntries: readonly unknown[];
}) {
  const value = readDataPath(data, component.dataPath);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [undo, setUndo] = useState<unknown>(null);
  const commit = (next: unknown) => {
    setUndo(structuredClone(value));
    onPathChange(component.dataPath, next);
  };
  const actions = (
    <div className="module-catalog-heading-actions">
      <button
        type="button"
        className="secondary-button"
        aria-expanded={catalogOpen}
        onClick={() => setCatalogOpen((open) => !open)}
      >
        {catalogOpen ? 'Close references' : 'Browse references'}
      </button>
      {undo !== null ? (
        <button
          type="button"
          className="small-button small-button--quiet"
          onClick={() => {
            onPathChange(component.dataPath, undo);
            setUndo(null);
          }}
        >
          Undo last change
        </button>
      ) : null}
    </div>
  );

  if (component.kind === 'focus') {
    const focus = value as FocusData;
    return (
      <FocusEditor
        focus={focus}
        catalogOpen={catalogOpen}
        actions={actions}
        commit={commit}
        definitions={
          catalogEntries as Array<FocusDefinition & { kind: FocusKind }>
        }
      />
    );
  }
  if (component.kind === 'wonders') {
    const records = (Array.isArray(value) ? value : []) as OwnedWonder[];
    return (
      <CollectionEditor
        label="Wonder"
        customName={customName}
        setCustomName={setCustomName}
        actions={actions}
        selectedDefinitionIds={
          new Set(
            records.flatMap((entry) =>
              entry.definitionId ? [entry.definitionId] : [],
            ),
          )
        }
        catalogOpen={catalogOpen}
        catalog={catalogEntries as WonderDefinition[]}
        onAdd={(definition) =>
          commit([
            ...records,
            {
              id: id(),
              definitionId: definition?.id,
              name: definition?.name ?? customName.trim(),
              typeLabel: definition?.typeLabel ?? '',
              rating: null,
              powers: '',
              notes: '',
              addedAt: new Date().toISOString(),
            },
          ])
        }
        renderList={() => (
          <SelectedWonderList
            wonders={records}
            onUpdate={(recordId, patch) =>
              commit(
                records.map((record) =>
                  record.id === recordId ? { ...record, ...patch } : record,
                ),
              )
            }
            onRemove={(recordId) =>
              commit(
                records.filter(
                  ({ id: recordIdValue }) => recordIdValue !== recordId,
                ),
              )
            }
          />
        )}
      />
    );
  }
  if (component.kind === 'rotes') {
    const records = (Array.isArray(value) ? value : []) as KnownRote[];
    return (
      <CollectionEditor
        label="Rote"
        customName={customName}
        setCustomName={setCustomName}
        actions={actions}
        selectedDefinitionIds={
          new Set(
            records.flatMap((entry) =>
              entry.definitionId ? [entry.definitionId] : [],
            ),
          )
        }
        catalogOpen={catalogOpen}
        catalog={catalogEntries as RoteDefinition[]}
        onAdd={(definition) =>
          commit([
            ...records,
            {
              id: id(),
              definitionId: definition?.id,
              name: definition?.name ?? customName.trim(),
              sphereRequirements: [],
              requirementNotes: definition?.requirements ?? '',
              effect: definition?.summary ?? '',
              focusNotes: '',
              notes: '',
              addedAt: new Date().toISOString(),
            },
          ])
        }
        renderList={() => (
          <SelectedRoteList
            rotes={records}
            onUpdate={(recordId, patch) =>
              commit(
                records.map((record) =>
                  record.id === recordId ? { ...record, ...patch } : record,
                ),
              )
            }
            onRemove={(recordId) =>
              commit(records.filter((record) => record.id !== recordId))
            }
          />
        )}
      />
    );
  }
  if (component.kind === 'equipment') {
    const records = (Array.isArray(value) ? value : []) as OwnedEquipment[];
    return (
      <CollectionEditor
        label="equipment"
        customName={customName}
        setCustomName={setCustomName}
        actions={actions}
        selectedDefinitionIds={
          new Set(
            records.flatMap((entry) =>
              entry.definitionId ? [entry.definitionId] : [],
            ),
          )
        }
        catalogOpen={catalogOpen}
        catalog={catalogEntries as EquipmentDefinition[]}
        onAdd={(definition) =>
          commit([
            ...records,
            {
              id: id(),
              definitionId: definition?.id,
              name: definition?.name ?? customName.trim(),
              category: definition?.category ?? 'gear',
              description: definition?.summary ?? '',
              quantity: 1,
              equipped: false,
              notes: '',
              addedAt: new Date().toISOString(),
            },
          ])
        }
        renderList={() => (
          <SelectedEquipmentList
            equipment={records}
            onUpdate={(recordId, patch) =>
              commit(
                records.map((record) =>
                  record.id === recordId ? { ...record, ...patch } : record,
                ),
              )
            }
            onRemove={(recordId) =>
              commit(records.filter((record) => record.id !== recordId))
            }
          />
        )}
      />
    );
  }

  const maneuvers = value as CharacterManeuvers;
  const doRating = component.doRatingPath
    ? readDataPath(data, component.doRatingPath)
    : 0;
  return (
    <ManeuverEditor
      value={maneuvers}
      doRating={typeof doRating === 'number' ? doRating : 0}
      commit={commit}
      definitions={
        catalogEntries as Array<
          (CombatManeuverDefinition | DoManeuverDefinition) & {
            kind: 'combat' | 'do';
          }
        >
      }
    />
  );
}

function CollectionEditor<T extends ReferenceCatalogEntry>({
  label,
  customName,
  setCustomName,
  actions,
  selectedDefinitionIds,
  catalogOpen,
  catalog,
  onAdd,
  renderList,
}: {
  label: string;
  customName: string;
  setCustomName: (value: string) => void;
  actions: React.ReactNode;
  selectedDefinitionIds: Set<string>;
  catalogOpen: boolean;
  catalog: readonly T[];
  onAdd: (definition?: T) => void;
  renderList: () => React.ReactNode;
}) {
  return (
    <div className="module-mage-collection">
      {actions}
      <div className="magick-custom-adder">
        <label>
          <span>Custom {label} name</span>
          <input
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="primary-button"
          disabled={!customName.trim()}
          onClick={() => {
            onAdd();
            setCustomName('');
          }}
        >
          Add custom {label}
        </button>
      </div>
      {renderList()}
      {catalogOpen ? (
        <ReferenceCatalog
          label={`${label}s`}
          entries={catalog}
          selectedDefinitionIds={selectedDefinitionIds}
          onAdd={onAdd}
        />
      ) : null}
    </div>
  );
}

function FocusEditor({
  focus,
  catalogOpen,
  actions,
  commit,
  definitions,
}: {
  focus: FocusData;
  catalogOpen: boolean;
  actions: React.ReactNode;
  commit: (next: FocusData) => void;
  definitions: Array<FocusDefinition & { kind: FocusKind }>;
}) {
  const [kind, setKind] = useState<FocusKind>('paradigm');
  const [customName, setCustomName] = useState('');
  const key =
    kind === 'paradigm'
      ? 'paradigms'
      : kind === 'practice'
        ? 'practices'
        : 'instruments';
  const allIds = useMemo(
    () =>
      new Set(
        [...focus.paradigms, ...focus.practices, ...focus.instruments].flatMap(
          (entry) => (entry.definitionId ? [entry.definitionId] : []),
        ),
      ),
    [focus],
  );
  const updateList = (next: Array<FocusSelection | InstrumentSelection>) =>
    commit({ ...focus, [key]: next });
  return (
    <div className="module-mage-collection">
      {actions}
      <div className="magick-custom-adder">
        <label>
          <span>Focus type</span>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as FocusKind)}
          >
            {Object.entries(focusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Custom name</span>
          <input
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="primary-button"
          disabled={!customName.trim()}
          onClick={() => {
            updateList([
              ...focus[key],
              {
                id: id(),
                customName: customName.trim(),
                notes: '',
                addedAt: new Date().toISOString(),
                ...(kind === 'instrument' ? { significant: false } : {}),
              },
            ]);
            setCustomName('');
          }}
        >
          Add custom
        </button>
      </div>
      <div className="focus-selected-grid">
        {(['paradigm', 'practice', 'instrument'] as const).map((entryKind) => {
          const entryKey =
            entryKind === 'paradigm'
              ? 'paradigms'
              : entryKind === 'practice'
                ? 'practices'
                : 'instruments';
          return (
            <FocusSelectionList
              key={entryKind}
              kind={entryKind}
              selections={focus[entryKey]}
              onUpdate={(recordId, patch) =>
                commit({
                  ...focus,
                  [entryKey]: focus[entryKey].map((record) =>
                    record.id === recordId ? { ...record, ...patch } : record,
                  ),
                })
              }
              onRemove={(recordId) =>
                commit({
                  ...focus,
                  [entryKey]: focus[entryKey].filter(
                    (record) => record.id !== recordId,
                  ),
                })
              }
            />
          );
        })}
      </div>
      <div className="focus-context-grid">
        {(['need', 'culture', 'notes'] as const).map((field) => (
          <label key={field}>
            <span>
              {field === 'need'
                ? 'Personal need'
                : field === 'culture'
                  ? 'Culture and community'
                  : 'General Focus notes'}
            </span>
            <textarea
              rows={3}
              value={focus[field]}
              onChange={(event) =>
                commit({ ...focus, [field]: event.target.value })
              }
            />
          </label>
        ))}
      </div>
      {catalogOpen ? (
        <>
          <div className="magick-catalog-tabs">
            {(Object.keys(focusLabels) as FocusKind[]).map((entryKind) => (
              <button
                type="button"
                key={entryKind}
                className={
                  entryKind === kind ? 'primary-button' : 'secondary-button'
                }
                onClick={() => setKind(entryKind)}
              >
                {focusLabels[entryKind]}s
              </button>
            ))}
          </div>
          <ReferenceCatalog
            label={`${focusLabels[kind]}s`}
            entries={definitions.filter((entry) => entry.kind === kind)}
            selectedDefinitionIds={allIds}
            onAdd={(definition) =>
              updateList([
                ...focus[key],
                {
                  id: id(),
                  definitionId: definition.id,
                  notes: '',
                  addedAt: new Date().toISOString(),
                  ...(kind === 'instrument' ? { significant: false } : {}),
                },
              ])
            }
          />
        </>
      ) : null}
    </div>
  );
}

function ManeuverEditor({
  value,
  doRating,
  commit,
  definitions,
}: {
  value: CharacterManeuvers;
  doRating: number;
  commit: (next: CharacterManeuvers) => void;
  definitions: Array<
    (CombatManeuverDefinition | DoManeuverDefinition) & {
      kind: 'combat' | 'do';
    }
  >;
}) {
  const [tab, setTab] = useState<'combat' | 'do'>('combat');
  return (
    <div className="module-mage-collection">
      <div className="maneuver-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'combat'}
          onClick={() => setTab('combat')}
        >
          Combat Reference
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'do'}
          onClick={() => setTab('do')}
        >
          Special Do Techniques
        </button>
      </div>
      {tab === 'combat' ? (
        <CombatReference
          definitions={definitions.filter(
            (entry): entry is CombatManeuverDefinition & { kind: 'combat' } =>
              entry.kind === 'combat',
          )}
          favorites={value.favoriteCombatManeuverIds}
          customManeuvers={value.customCombatManeuvers}
          onToggleFavorite={(maneuverId) =>
            commit({
              ...value,
              favoriteCombatManeuverIds:
                value.favoriteCombatManeuverIds.includes(maneuverId)
                  ? value.favoriteCombatManeuverIds.filter(
                      (id) => id !== maneuverId,
                    )
                  : [...value.favoriteCombatManeuverIds, maneuverId],
            })
          }
          onAddCustom={(name, description) => {
            const recordId = id();
            commit({
              ...value,
              customCombatManeuvers: [
                ...value.customCombatManeuvers,
                {
                  id: recordId,
                  name,
                  description,
                  notes: '',
                  addedAt: new Date().toISOString(),
                },
              ],
            });
            return recordId;
          }}
          onUpdateCustom={(recordId, patch) =>
            commit({
              ...value,
              customCombatManeuvers: value.customCombatManeuvers.map(
                (record) =>
                  record.id === recordId ? { ...record, ...patch } : record,
              ),
            })
          }
          onRemoveCustom={(recordId) =>
            commit({
              ...value,
              customCombatManeuvers: value.customCombatManeuvers.filter(
                (record) => record.id !== recordId,
              ),
              favoriteCombatManeuverIds: value.favoriteCombatManeuverIds.filter(
                (id) => id !== recordId,
              ),
            })
          }
        />
      ) : (
        <KnownDoManeuvers
          definitions={definitions.filter(
            (entry): entry is DoManeuverDefinition & { kind: 'do' } =>
              entry.kind === 'do',
          )}
          doRating={doRating}
          selections={value.selectedDoManeuvers}
          onAdd={(definitionId, custom) => {
            const recordId = id();
            commit({
              ...value,
              selectedDoManeuvers: [
                ...value.selectedDoManeuvers,
                {
                  id: recordId,
                  definitionId,
                  customName: custom?.name,
                  customSummary: custom?.summary,
                  customRoll: custom?.roll,
                  customDifficulty: custom?.difficulty,
                  customDamage: custom?.damage,
                  customActions: custom?.actions,
                  customSourceTitle: custom?.sourceTitle,
                  customSourcePage: custom?.sourcePage,
                  notes: '',
                  addedAt: new Date().toISOString(),
                },
              ],
            });
            return recordId;
          }}
          onUpdate={(recordId, patch) =>
            commit({
              ...value,
              selectedDoManeuvers: value.selectedDoManeuvers.map((record) =>
                record.id === recordId ? { ...record, ...patch } : record,
              ),
            })
          }
          onRemove={(recordId) =>
            commit({
              ...value,
              selectedDoManeuvers: value.selectedDoManeuvers.filter(
                (record) => record.id !== recordId,
              ),
            })
          }
        />
      )}
    </div>
  );
}
