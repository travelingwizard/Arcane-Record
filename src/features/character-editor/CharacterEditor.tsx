import { useCallback, useMemo } from 'react';
import { AbilitiesSection } from '../../components/character/AbilitiesSection';
import { AttributesSection } from '../../components/character/AttributesSection';
import { BackgroundsSection } from '../../components/character/BackgroundsSection';
import { EnlightenmentSection } from '../../components/character/EnlightenmentSection';
import { EquipmentSection } from '../../components/character/EquipmentSection';
import { FocusSection } from '../../components/character/FocusSection';
import { HealthSection } from '../../components/character/HealthSection';
import { IdentitySection } from '../../components/character/IdentitySection';
import { MeritsFlawsSection } from '../../components/character/MeritsFlawsSection';
import { RotesSection } from '../../components/character/RotesSection';
import { SaveStatusBadge } from '../../components/character/SaveStatusBadge';
import { SpheresSection } from '../../components/character/SpheresSection';
import { WondersSection } from '../../components/character/WondersSection';
import { CharacterSectionProvider } from '../../components/navigation/CharacterSectionProvider';
import { CharacterSectionNav } from '../../components/navigation/CharacterSectionNav';
import { MobileSectionNavigator } from '../../components/navigation/MobileSectionNavigator';
import { useEditorStore } from '../../state/editor-store';
import type { CharacterRepository } from '../../storage/character-repository';
import type { CharacterSectionId } from '../../systems/mage-m20/character-sections';
import type { MageCharacter } from '../../types/character';
import { ImportExportSection } from '../import-export/ImportExportSection';
import { getCharacterSectionSummaries } from './character-section-summaries';
import { useActiveCharacterSection } from './use-active-character-section';
import { useCharacterSectionNavigation } from './use-character-section-navigation';
import { useCharacterSectionPreferences } from './use-character-section-preferences';
import { useMediaQuery } from './use-media-query';

export function CharacterEditor({
  onReturnToLibrary,
  repository,
  onImported,
}: {
  onReturnToLibrary: () => Promise<void>;
  repository: CharacterRepository;
  onImported: (character: MageCharacter) => void;
}) {
  const character = useEditorStore((state) => state.character);

  if (!character) {
    return null;
  }

  return (
    <CharacterEditorContent
      key={character.id}
      character={character}
      onReturnToLibrary={onReturnToLibrary}
      repository={repository}
      onImported={onImported}
    />
  );
}

function CharacterEditorContent({
  character,
  onReturnToLibrary,
  repository,
  onImported,
}: {
  character: MageCharacter;
  onReturnToLibrary: () => Promise<void>;
  repository: CharacterRepository;
  onImported: (character: MageCharacter) => void;
}) {
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const displayName = character.identity.name.trim() || 'Untitled mage';
  const isNarrowLayout = useMediaQuery('(max-width: 69.999rem)');
  const summaries = useMemo(
    () => getCharacterSectionSummaries(character),
    [character],
  );
  const {
    expandedSections,
    setSectionExpanded,
    expandAllSections,
    collapseAllSections,
  } = useCharacterSectionPreferences(character.id);
  const { activeSection, setActiveSection } = useActiveCharacterSection();
  const expandSection = useCallback(
    (sectionId: CharacterSectionId) => setSectionExpanded(sectionId, true),
    [setSectionExpanded],
  );
  const { navigateToSection } = useCharacterSectionNavigation({
    activeSection,
    setActiveSection,
    expandSection,
  });
  const sectionContext = useMemo(
    () => ({
      activeSection,
      expandedSections,
      isNarrowLayout,
      summaries,
      setSectionExpanded,
      navigateToSection,
      expandAllSections,
      collapseAllSections,
    }),
    [
      activeSection,
      collapseAllSections,
      expandAllSections,
      expandedSections,
      isNarrowLayout,
      navigateToSection,
      setSectionExpanded,
      summaries,
    ],
  );

  return (
    <CharacterSectionProvider value={sectionContext}>
      <main className="app-shell editor-shell">
        <header className="editor-header">
          <button
            type="button"
            className="text-button editor-header__back"
            onClick={() => void onReturnToLibrary()}
          >
            <span aria-hidden="true">←</span> Character library
          </button>
          <div className="editor-header__title">
            <p className="eyebrow">Arcane Ledger · Mage M20</p>
            <h1>{displayName}</h1>
            <p className="editor-header__subtitle">
              An editable record kept only on this device.
            </p>
          </div>
          <SaveStatusBadge status={saveStatus} />
        </header>

        <div className="ornament-rule" aria-hidden="true">
          <span>✦</span>
        </div>

        <MobileSectionNavigator />

        <div className="character-editor-layout">
          <CharacterSectionNav />
          <div className="character-sheet">
            <IdentitySection />
            <AttributesSection />
            <AbilitiesSection />
            <BackgroundsSection />
            <MeritsFlawsSection />
            <SpheresSection />
            <EnlightenmentSection />
            <FocusSection />
            <WondersSection />
            <RotesSection />
            <EquipmentSection />
            <HealthSection />
            <ImportExportSection
              character={character}
              repository={repository}
              onImported={onImported}
            />
          </div>
        </div>

        <footer className="privacy-note">
          <strong>Private by design.</strong> Character data is stored in this
          browser profile and is not backed up online.
        </footer>
      </main>
    </CharacterSectionProvider>
  );
}
