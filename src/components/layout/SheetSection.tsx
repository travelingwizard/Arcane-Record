import { useRef, useState, type ReactNode } from 'react';
import { CharacterSectionDisclosure } from '../navigation/CharacterSectionDisclosure';
import { useCharacterSectionContext } from '../navigation/character-section-context';

interface SheetSectionProps {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  collapsibleOnDesktop?: boolean;
  hideSummaryWhenCollapsed?: boolean;
}

export function SheetSection({
  id,
  eyebrow,
  title,
  description,
  actions,
  children,
  className = '',
  collapsibleOnDesktop = false,
  hideSummaryWhenCollapsed = false,
}: SheetSectionProps) {
  const navigation = useCharacterSectionContext();
  const sectionRef = useRef<HTMLElement>(null);
  const disclosureRef = useRef<HTMLButtonElement>(null);
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const definition = navigation?.sections.find((section) => section.id === id);
  const canUseDisclosure =
    Boolean(navigation) && (navigation?.isNarrowLayout || collapsibleOnDesktop);
  const summary = navigation?.summaries[id] ?? { primary: '' };
  const expanded = !canUseDisclosure
    ? true
    : navigation?.isNarrowLayout
      ? navigation.expandedSections.has(id)
      : desktopExpanded;
  const contentId = `${id}-content`;
  const headingId = `${id}-heading`;
  const collapse = () => {
    if (!canUseDisclosure) {
      return;
    }
    if (
      expanded &&
      sectionRef.current?.contains(document.activeElement) &&
      document.activeElement !== disclosureRef.current
    ) {
      disclosureRef.current?.focus();
    }
    if (navigation?.isNarrowLayout) {
      navigation.setSectionExpanded(id, !expanded);
    } else {
      setDesktopExpanded(!expanded);
    }
  };

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`sheet-section character-section ${
        expanded
          ? 'character-section--expanded'
          : 'character-section--collapsed'
      } ${
        collapsibleOnDesktop ? 'character-section--desktop-collapsible' : ''
      } ${className}`.trim()}
      aria-labelledby={headingId}
    >
      <div className="sheet-section__heading">
        <div>
          {eyebrow ? (
            <p className="eyebrow" hidden={canUseDisclosure && !expanded}>
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={headingId}
            tabIndex={-1}
            aria-label={canUseDisclosure ? title : undefined}
          >
            {canUseDisclosure && definition ? (
              <>
                <CharacterSectionDisclosure
                  ref={disclosureRef}
                  label={title}
                  summary={summary}
                  expanded={expanded}
                  contentId={contentId}
                  onToggle={collapse}
                  showSummary={!hideSummaryWhenCollapsed || expanded}
                />
              </>
            ) : (
              title
            )}
          </h2>
          {description ? (
            <p
              className="sheet-section__description"
              hidden={canUseDisclosure && !expanded}
            >
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div
            className="sheet-section__actions"
            hidden={canUseDisclosure && !expanded}
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
