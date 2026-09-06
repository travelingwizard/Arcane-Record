import { identityFields } from '../../systems/mage-m20/definitions';
import { useEditorStore } from '../../state/editor-store';
import { SheetSection } from '../layout/SheetSection';
import { SheetField, SheetFieldGrid } from '../layout/SheetPrimitives';

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
      <SheetFieldGrid columns={3} className="identity-grid">
        {identityFields.map(({ id, label }) => (
          <SheetField className="line-field" label={label} key={id}>
            <input
              value={identity[id]}
              onChange={(event) => updateIdentity(id, event.target.value)}
              autoComplete="off"
            />
          </SheetField>
        ))}
      </SheetFieldGrid>
    </SheetSection>
  );
}
