import {
  attributeGroups,
  type AttributeId,
} from '../../systems/mage-m20/definitions';
import { useEditorStore } from '../../state/editor-store';
import { DotRating } from '../controls/DotRating';
import { SheetSection } from '../layout/SheetSection';

export function AttributesSection() {
  const attributes = useEditorStore((state) => state.character?.attributes);
  const ratingsReadOnly = useEditorStore(
    (state) => state.character?.sheetLayout.mode === 'play',
  );
  const updateAttribute = useEditorStore((state) => state.updateAttribute);

  if (!attributes) {
    return null;
  }

  return (
    <SheetSection
      id="attributes"
      eyebrow="Innate capacities"
      title="Attributes"
      description="Ratings are editable without point-allocation rules in this milestone."
    >
      <div className="attribute-groups">
        {attributeGroups.map((group) => {
          const ratings = attributes[group.id] as Record<string, number>;
          return (
            <div className="trait-group" key={group.id}>
              <h3>{group.label}</h3>
              <div className="trait-list">
                {group.traits.map((trait) => (
                  <div className="trait-row" key={trait.id}>
                    <span className="trait-row__label">{trait.label}</span>
                    <DotRating
                      label={trait.label}
                      value={ratings[trait.id]}
                      min={1}
                      max={5}
                      readOnly={ratingsReadOnly}
                      onChange={(value) =>
                        updateAttribute(
                          group.id,
                          trait.id as AttributeId,
                          value,
                        )
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
