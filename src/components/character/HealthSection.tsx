import { healthLevels } from '../../systems/mage-m20/definitions';
import { useEditorStore } from '../../state/editor-store';
import type { HealthState } from '../../types/character';
import { SheetSection } from '../layout/SheetSection';

const damagePresentation = {
  bashing: { label: 'Bashing', mark: '╱' },
  lethal: { label: 'Lethal', mark: '×' },
  aggravated: { label: 'Aggravated', mark: '✱' },
} as const;

const emptyDamage: HealthState['damage'] = [];

export function HealthSection() {
  const damage = useEditorStore(
    (state) => state.character?.health.damage ?? emptyDamage,
  );
  const cycleHealthDamage = useEditorStore((state) => state.cycleHealthDamage);

  return (
    <SheetSection
      id="health"
      eyebrow="The cost of conflict"
      title="Health"
      description="Add damage from the top down. Activate a marked box to cycle through bashing, lethal, aggravated, and clear."
    >
      <div className="health-layout">
        <div className="health-track">
          {healthLevels.map((level, index) => {
            const current = damage[index];
            const presentation = current
              ? damagePresentation[current]
              : undefined;
            const disabled = index > damage.length;

            return (
              <div className="health-row" key={level.id}>
                <span className="health-row__level">{level.label}</span>
                <span className="health-row__penalty">
                  {level.penalty}
                  <span className="sr-only"> dice penalty</span>
                </span>
                <button
                  type="button"
                  className={`health-box${
                    current ? ` health-box--${current}` : ''
                  }`}
                  aria-label={`${level.label}: ${
                    presentation?.label ?? 'Unmarked'
                  } damage`}
                  disabled={disabled}
                  onClick={() => cycleHealthDamage(index)}
                >
                  <span aria-hidden="true">{presentation?.mark ?? ''}</span>
                </button>
              </div>
            );
          })}
        </div>
        <div className="health-legend" aria-label="Damage mark legend">
          <h3>Damage marks</h3>
          {Object.values(damagePresentation).map(({ label, mark }) => (
            <span key={label}>
              <b aria-hidden="true">{mark}</b> {label}
            </span>
          ))}
          <p>Clearing a box also clears any boxes below it.</p>
        </div>
      </div>
    </SheetSection>
  );
}
