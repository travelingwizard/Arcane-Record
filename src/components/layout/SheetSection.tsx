import { useRef, type ReactNode } from 'react';
import {
  characterSectionById,
  type CharacterSectionId,
} from '../../systems/mage-m20/character-sections';
import { CharacterSectionDisclosure } from '../navigation/CharacterSectionDisclosure';
import { useCharacterSectionContext } from '../navigation/character-section-context';

interface SheetSectionProps {
  id: CharacterSectionId;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SheetSection({
  id,
  eyebrow,
  title,
  description,
  actions,
  children,
  className = '',
}: SheetSectionProps) {
  const navigation = useCharacterSectionContext();
  const sectionRef = useRef<HTMLElement>(null);
  const disclosureRef = useRef<HTMLButtonElement>(null);
  const definition = characterSectionById.get(id);
  const expanded =
    !navigation ||
    !navigation.isNarrowLayout ||
    navigation.expandedSections.has(id);
  const contentId = `${id}-content`;
  const headingId = `${id}-heading`;
  const collapse = () => {
    if (!navigation) {
      return;
    }
    if (
      expanded &&
      sectionRef.current?.contains(document.activeElement) &&
      document.activeElement !== disclosureRef.current
    ) {
      disclosureRef.current?.focus();
    }
    navigation.setSectionExpanded(id, !expanded);
  };

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`sheet-section character-section ${
        expanded
          ? 'character-section--expanded'
          : 'character-section--collapsed'
      } ${className}`.trim()}
      aria-labelledby={headingId}
    >
      <div className="sheet-section__heading">
        <div>
          {eyebrow ? (
            <p
              className="eyebrow"
              hidden={navigation?.isNarrowLayout && !expanded}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={headingId}
            tabIndex={-1}
            aria-label={navigation ? title : undefined}
          >
            {navigation && definition ? (
              <>
                <span className="character-section__desktop-title">
                  {title}
                </span>
                <CharacterSectionDisclosure
                  ref={disclosureRef}
                  label={title}
                  summary={navigation.summaries[id]}
                  expanded={expanded}
                  contentId={contentId}
                  onToggle={collapse}
                />
              </>
            ) : (
              title
            )}
          </h2>
          {description ? (
            <p
              className="sheet-section__description"
              hidden={navigation?.isNarrowLayout && !expanded}
            >
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div
            className="sheet-section__actions"
            hidden={navigation?.isNarrowLayout && !expanded}
          >
            {actions}
          </div>
        ) : null}
      </div>
      <div id={contentId} hidden={!expanded}>
        {children}
      </div>
    </section>
  );
}
