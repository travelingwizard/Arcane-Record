import {
  abilityGroups,
  type AbilityId,
} from '../../systems/mage-m20/definitions';
import { useEditorStore } from '../../state/editor-store';
import { DotRating } from '../controls/DotRating';
import { SheetSection } from '../layout/SheetSection';

export function AbilitiesSection() {
  const abilities = useEditorStore((state) => state.character?.abilities);
  const ratingsReadOnly = useEditorStore(
    (state) => state.character?.sheetLayout.mode === 'play',
  );
  const updateAbility = useEditorStore((state) => state.updateAbility);

  if (!abilities) {
    return null;
  }

  return (
    <SheetSection
      id="abilities"
      eyebrow="Learned and practiced"
      title="Abilities"
      description="Talents, Skills, and Knowledges are rated from zero to five."
    >
      <div className="ability-groups">
        {abilityGroups.map((group) => {
          const ratings = abilities[group.id] as Record<string, number>;
          return (
            <div className="ability-group" key={group.id}>
              <h3>{group.label}</h3>
              <div className="ability-list">
                {group.traits.map((ability) => (
                  <div className="ability-row" key={ability.id}>
                    <span className="ability-row__label">{ability.label}</span>
                    <DotRating
                      label={ability.label}
                      value={ratings[ability.id]}
                      min={0}
                      max={5}
                      readOnly={ratingsReadOnly}
                      onChange={(value) =>
                        updateAbility(group.id, ability.id as AbilityId, value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </SheetSection>
  );
}
