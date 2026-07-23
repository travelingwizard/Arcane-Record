import { identityFields } from '../../systems/mage-m20/definitions';
import { useEditorStore } from '../../state/editor-store';
import { SheetSection } from '../layout/SheetSection';

export function IdentitySection() {
  const identity = useEditorStore((state) => state.character?.identity);
  const updateIdentity = useEditorStore((state) => state.updateIdentity);

  if (!identity) {
    return null;
  }

  return (
    <SheetSection
      id="identity"
      eyebrow="The mortal mask"
      title="Identity"
      className="identity-section"
    >
      <div className="identity-grid">
        {identityFields.map(({ id, label }) => (
          <label className="line-field" key={id}>
            <span>{label}</span>
            <input
              value={identity[id]}
              onChange={(event) => updateIdentity(id, event.target.value)}
              autoComplete="off"
            />
          </label>
        ))}
      </div>
    </SheetSection>
  );
}
