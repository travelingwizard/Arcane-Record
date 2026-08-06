import { enlightenmentTraits } from '../../systems/mage-m20/definitions';
import { useEditorStore } from '../../state/editor-store';
import { DotRating } from '../controls/DotRating';
import { SheetSection } from '../layout/SheetSection';

export function EnlightenmentSection() {
  const enlightenment = useEditorStore(
    (state) => state.character?.enlightenment,
  );
  const ratingsReadOnly = useEditorStore(
    (state) => state.character?.sheetLayout.mode === 'play',
  );
  const updateEnlightenment = useEditorStore(
    (state) => state.updateEnlightenment,
  );
  const updateTemporaryWillpower = useEditorStore(
    (state) => state.updateTemporaryWillpower,
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
            <div className="enlightenment-ratings">
              <DotRating
                label={trait.label}
                value={enlightenment[trait.id]}
                min={trait.min}
                max={10}
                showBreakAfterFive
                readOnly={
                  ratingsReadOnly &&
                  (trait.id === 'arete' || trait.id === 'willpower')
                }
                onChange={(value) => updateEnlightenment(trait.id, value)}
              />
              {trait.id === 'willpower' ? (
                <div className="temporary-willpower">
                  <span>Temporary {enlightenment.willpowerTemporary} / 10</span>
                  <DotRating
                    label="Temporary Willpower"
                    value={enlightenment.willpowerTemporary}
                    min={0}
                    max={10}
                    showBreakAfterFive
                    variant="boxes"
                    onChange={updateTemporaryWillpower}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </SheetSection>
  );
}
