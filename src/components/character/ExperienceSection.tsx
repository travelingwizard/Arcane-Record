import { useEditorStore } from '../../state/editor-store';
import { SheetSection } from '../layout/SheetSection';
import { ExperienceTotalsFields } from './ExperienceTotalsFields';

export function ExperienceSection() {
  const experience = useEditorStore((state) => state.character?.experience);
  const updateExperience = useEditorStore((state) => state.updateExperience);

  if (!experience) return null;

  return (
    <SheetSection
      id="experience"
      title="Experience"
      eyebrow="Advancement"
      collapsibleOnDesktop
    >
      <p className="section-note">
        Record earned experience separately from the amount currently available.
      </p>
      <ExperienceTotalsFields
        idPrefix="mage"
        total={experience.total}
        current={experience.current}
        onChange={updateExperience}
      />
    </SheetSection>
  );
}
