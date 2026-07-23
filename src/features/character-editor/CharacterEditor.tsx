import { AttributesSection } from '../../components/character/AttributesSection';
import { DeferredSections } from '../../components/character/DeferredSections';
import { IdentitySection } from '../../components/character/IdentitySection';
import { SaveStatusBadge } from '../../components/character/SaveStatusBadge';
import { SpheresSection } from '../../components/character/SpheresSection';
import { useEditorStore } from '../../state/editor-store';

export function CharacterEditor({
  onReturnToLibrary,
}: {
  onReturnToLibrary: () => Promise<void>;
}) {
  const character = useEditorStore((state) => state.character);
  const saveStatus = useEditorStore((state) => state.saveStatus);

  if (!character) {
    return null;
  }

  const displayName = character.identity.name.trim() || 'Untitled mage';

  return (
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

      <IdentitySection />
      <AttributesSection />
      <SpheresSection />
      <DeferredSections />

      <footer className="privacy-note">
        <strong>Private by design.</strong> Character data is stored in this
        browser profile and is not backed up online.
      </footer>
    </main>
  );
}
