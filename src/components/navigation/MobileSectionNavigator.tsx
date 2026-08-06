import { useEffect, useRef, useState } from 'react';
import {
  getOrderedNavigationGroups,
  getSheetSectionFromHash,
} from './sheet-navigation';
import { useCharacterSectionContext } from './character-section-context';
import { SectionOrderEditToggle } from './SectionOrderEditToggle';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function MobileSectionNavigator() {
  const navigation = useCharacterSectionContext();
  const [open, setOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const sheet = sheetRef.current;
    const firstFocusable = sheet?.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        setEditingOrder(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
        return;
      }
      if (event.key !== 'Tab' || !sheet) {
        return;
      }
      const focusable = [
        ...sheet.querySelectorAll<HTMLElement>(focusableSelector),
      ];
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!navigation) {
    return null;
  }

  const activeDefinition = navigation.sections.find(
    (section) => section.id === navigation.activeSection,
  );
  const closeAndRestore = () => {
    setOpen(false);
    setEditingOrder(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const selectSection = (sectionId: string) => {
    setOpen(false);
    setEditingOrder(false);
    window.requestAnimationFrame(() =>
      navigation.navigateToSection(sectionId, { focusHeading: true }),
    );
  };
  const keepSection =
    getSheetSectionFromHash(navigation.sections) ?? navigation.activeSection;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="mobile-section-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-character-sections"
        onClick={() => setOpen(true)}
      >
        <span>Sections</span>
        <strong>
          {activeDefinition?.shortLabel ?? activeDefinition?.label ?? 'Sheet'}
        </strong>
        <span aria-hidden="true">⌄</span>
      </button>

      {open ? (
        <div
          className="mobile-section-sheet-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAndRestore();
            }
          }}
        >
          <div
            ref={sheetRef}
            id="mobile-character-sections"
            className="mobile-section-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-character-sections-title"
          >
            <header>
              <div>
                <p className="eyebrow">Navigate the record</p>
                <h2 id="mobile-character-sections-title">Character Sections</h2>
              </div>
              <div className="mobile-section-sheet__header-actions">
                <SectionOrderEditToggle
                  editing={editingOrder}
                  onToggle={() => setEditingOrder((editing) => !editing)}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Close Character Sections"
                  onClick={closeAndRestore}
                >
                  ×
                </button>
              </div>
            </header>

            {navigation.canCollapseSections ? (
              <div className="mobile-section-sheet__bulk-actions">
                <button
                  type="button"
                  className="small-button small-button--quiet"
                  onClick={navigation.expandAllSections}
                >
                  Expand all sections
                </button>
                <button
                  type="button"
                  className="small-button small-button--quiet"
                  onClick={() => navigation.collapseAllSections(keepSection)}
                >
                  Collapse all sections
                </button>
              </div>
            ) : null}

            <nav aria-label="Mobile character sheet sections">
              {getOrderedNavigationGroups(
                navigation.groups,
                navigation.groupOrder,
              ).map((group) => {
                const sections = navigation.sections.filter(
                  (section) => section.group === group.id,
                );
                if (sections.length === 0) {
                  return null;
                }
                return (
                  <div className="mobile-section-sheet__group" key={group.id}>
                    <div className="mobile-section-sheet__group-heading">
                      <h3>{group.label}</h3>
                      {editingOrder ? (
                        <div>
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`Move ${group.label} earlier`}
                            disabled={
                              navigation.groupOrder.indexOf(group.id) === 0
                            }
                            onClick={() =>
                              navigation.moveGroup(group.id, 'earlier')
                            }
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`Move ${group.label} later`}
                            disabled={
                              navigation.groupOrder.indexOf(group.id) ===
                              navigation.groupOrder.length - 1
                            }
                            onClick={() =>
                              navigation.moveGroup(group.id, 'later')
                            }
                          >
                            ↓
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <ul>
                      {sections.map((section) => {
                        const active = section.id === navigation.activeSection;
                        return (
                          <li key={section.id}>
                            <a
                              href={`#${section.id}`}
                              aria-current={active ? 'location' : undefined}
                              onClick={(event) => {
                                event.preventDefault();
                                selectSection(section.id);
                              }}
                            >
                              <span>{section.label}</span>
                              <small>
                                {navigation.summaries[section.id]?.primary ??
                                  ''}
                              </small>
                              {active ? <strong>Current section</strong> : null}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
