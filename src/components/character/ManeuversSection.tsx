import { useState } from 'react';
import { useEditorStore } from '../../state/editor-store';
import { SheetSection } from '../layout/SheetSection';
import { CombatReference } from './maneuvers/CombatReference';
import { KnownDoManeuvers } from './maneuvers/KnownDoManeuvers';

type ManeuverTab = 'combat' | 'do';

export function ManeuversSection() {
  const character = useEditorStore((state) => state.character);
  const toggleFavorite = useEditorStore(
    (state) => state.toggleCombatManeuverFavorite,
  );
  const addCustomCombat = useEditorStore(
    (state) => state.addCustomCombatManeuver,
  );
  const updateCustomCombat = useEditorStore(
    (state) => state.updateCustomCombatManeuver,
  );
  const removeCustomCombat = useEditorStore(
    (state) => state.removeCustomCombatManeuver,
  );
  const addDo = useEditorStore((state) => state.addDoManeuver);
  const updateDo = useEditorStore((state) => state.updateDoManeuver);
  const removeDo = useEditorStore((state) => state.removeDoManeuver);
  const lastRemoval = useEditorStore((state) => state.lastManeuverRemoval);
  const undoRemoval = useEditorStore((state) => state.undoManeuverRemoval);
  const [activeTab, setActiveTab] = useState<ManeuverTab>('combat');

  if (!character) {
    return null;
  }

  const maneuvers = character.repeatableEntries.maneuvers;

  return (
    <SheetSection
      id="maneuvers"
      eyebrow="Combat reference and learned forms"
      title="Maneuvers"
      description="Keep universal combat references and this character's known Do maneuvers together."
      collapsibleOnDesktop
      hideSummaryWhenCollapsed
      actions={
        lastRemoval ? (
          <button
            type="button"
            className="small-button small-button--quiet"
            onClick={undoRemoval}
          >
            Undo removal
          </button>
        ) : null
      }
    >
      <p className="reference-preview-note">
        Reference preview: these summaries and citations come from the supplied
        local references. This section does not calculate attacks, damage, or
        maneuver limits.
      </p>

      <div className="maneuver-tabs" role="tablist" aria-label="Maneuver views">
        <button
          type="button"
          role="tab"
          id="maneuver-tab-combat"
          aria-selected={activeTab === 'combat'}
          aria-controls="maneuver-panel-combat"
          className={
            activeTab === 'combat' ? 'secondary-button' : 'small-button'
          }
          onClick={() => setActiveTab('combat')}
        >
          Combat Reference
        </button>
        <button
          type="button"
          role="tab"
          id="maneuver-tab-do"
          aria-selected={activeTab === 'do'}
          aria-controls="maneuver-panel-do"
          className={activeTab === 'do' ? 'secondary-button' : 'small-button'}
          onClick={() => setActiveTab('do')}
        >
          Known Do Maneuvers
        </button>
      </div>

      <div
        role="tabpanel"
        id={`maneuver-panel-${activeTab}`}
        aria-labelledby={`maneuver-tab-${activeTab}`}
      >
        {activeTab === 'combat' ? (
          <CombatReference
            favorites={maneuvers.favoriteCombatManeuverIds}
            customManeuvers={maneuvers.customCombatManeuvers}
            onToggleFavorite={toggleFavorite}
            onAddCustom={addCustomCombat}
            onUpdateCustom={updateCustomCombat}
            onRemoveCustom={removeCustomCombat}
          />
        ) : (
          <KnownDoManeuvers
            selections={maneuvers.selectedDoManeuvers}
            onAdd={addDo}
            onUpdate={updateDo}
            onRemove={removeDo}
          />
        )}
      </div>
    </SheetSection>
  );
}
