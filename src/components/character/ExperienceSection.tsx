import { useEditorStore } from '../../state/editor-store';
import { SheetSection } from '../layout/SheetSection';
import { ExperienceTotalsFields } from './ExperienceTotalsFields';
import { MageAdvancement } from '../../games/mage20/development/MageAdvancement';
import {
  developmentFor,
  experienceTotals,
  setOpeningBalance,
} from '../../games/mage20/development/rules';

export function ExperienceSection() {
  const experience = useEditorStore((state) => state.character?.experience);
  const updateExperience = useEditorStore((state) => state.updateExperience);
  const development = useEditorStore((state) => state.character?.development);
  const update = useEditorStore((state) => state.updateMage);

  if (!experience) return null;

  return (
    <SheetSection
      id="experience"
      title="Experience"
      eyebrow="Advancement"
      collapsibleOnDesktop
    >
      {development ? (
        <>
          {development.status === 'manual' && (
            <>
              <p className="section-note">
                Manual opening balance. No historical purchases are inferred.
              </p>
              <ExperienceTotalsFields
                idPrefix="mage"
                total={experience.total}
                current={experience.current}
                onChange={(field, value) =>
                  update((character) =>
                    setOpeningBalance(character, field, value),
                  )
                }
              />
            </>
          )}
          <MageAdvancement />
        </>
      ) : (
        <>
          <p className="section-note">
            Record earned experience separately from the amount currently
            available.
          </p>
          <ExperienceTotalsFields
            idPrefix="mage"
            total={experience.total}
            current={experience.current}
            onChange={updateExperience}
          />
          <button
            onClick={() =>
              update((c) => {
                const development = developmentFor(c);
                return {
                  ...c,
                  development,
                  experience: experienceTotals(development.ledger),
                };
              })
            }
          >
            Enable XP ledger and advancement
          </button>
        </>
      )}
    </SheetSection>
  );
}
