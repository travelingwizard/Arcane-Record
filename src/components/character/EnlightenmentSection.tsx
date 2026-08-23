import { enlightenmentTraits } from '../../systems/mage-m20/definitions';
import { useMageSheetPreferences } from '../../games/mage20/mage-sheet-preferences';
import { useEditorStore } from '../../state/editor-store';
import { DotRating } from '../controls/DotRating';
import { SheetSection } from '../layout/SheetSection';
import { QuintessenceParadoxWheel } from './QuintessenceParadoxWheel';

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
  const { temporaryWillpowerDots } = useMageSheetPreferences();

  if (!enlightenment) {
    return null;
  }

  return (
    <SheetSection
      id="enlightenment"
      eyebrow="Awakened potential"
      title="Enlightenment"
      description="Ten-point tracks for Arete and Willpower, with a shared twenty-position Quintessence and Paradox wheel."
    >
      <div className="enlightenment-grid">
        {enlightenmentTraits
          .filter(({ id }) => id !== 'quintessence' && id !== 'paradox')
          .map((trait) => (
            <div
              className={`enlightenment-track enlightenment-track--${trait.id}`}
              key={trait.id}
            >
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
                    <span>
                      Temporary {enlightenment.willpowerTemporary} / 10
                    </span>
                    <DotRating
                      label="Temporary Willpower"
                      value={enlightenment.willpowerTemporary}
                      min={0}
                      max={10}
                      showBreakAfterFive
                      variant={temporaryWillpowerDots ? undefined : 'boxes'}
                      onChange={updateTemporaryWillpower}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        <QuintessenceParadoxWheel
          quintessence={enlightenment.quintessence}
          paradox={enlightenment.paradox}
          onQuintessenceChange={(value) =>
            updateEnlightenment('quintessence', value)
          }
          onParadoxChange={(value) => updateEnlightenment('paradox', value)}
        />
      </div>
    </SheetSection>
  );
}
