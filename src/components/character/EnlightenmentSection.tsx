import { enlightenmentTraits } from '../../systems/mage-m20/definitions';
import { useEditorStore } from '../../state/editor-store';
import { DotRating } from '../controls/DotRating';
import { SheetSection } from '../layout/SheetSection';

export function EnlightenmentSection() {
  const enlightenment = useEditorStore(
    (state) => state.character?.enlightenment,
  );
  const updateEnlightenment = useEditorStore(
    (state) => state.updateEnlightenment,
  );

  if (!enlightenment) {
    return null;
  }

  return (
    <SheetSection
      id="enlightenment"
      eyebrow="Awakened potential"
      title="Enlightenment"
      description="Ten-point tracks for Arete, Willpower, Quintessence, and Paradox."
    >
      <div className="enlightenment-grid">
        {enlightenmentTraits.map((trait) => (
          <div className="enlightenment-track" key={trait.id}>
            <div>
              <h3>{trait.label}</h3>
              <span>{enlightenment[trait.id]} / 10</span>
            </div>
            <DotRating
              label={trait.label}
              value={enlightenment[trait.id]}
              min={trait.min}
              max={10}
              showBreakAfterFive
              onChange={(value) => updateEnlightenment(trait.id, value)}
            />
          </div>
        ))}
      </div>
    </SheetSection>
  );
}
