import { useCallback, useEffect } from 'react';
import {
  getSheetSectionFromHash,
  type SheetNavigationSectionDefinition,
} from '../../components/navigation/sheet-navigation';

export function useSheetSectionNavigation({
  sections,
  setActiveSection,
}: {
  sections: readonly SheetNavigationSectionDefinition[];
  setActiveSection: (sectionId: string) => void;
}) {
  const navigateToSection = useCallback(
    (
      sectionId: string,
      options: {
        focusHeading?: boolean;
        history?: 'push' | 'none';
      } = {},
    ) => {
      if (!sections.some((section) => section.id === sectionId)) return;
      setActiveSection(sectionId);
      if (
        options.history !== 'none' &&
        window.location.hash !== `#${sectionId}`
      ) {
        window.history.pushState(null, '', `#${sectionId}`);
      }
      window.requestAnimationFrame(() => {
        const section = document.getElementById(sectionId);
        if (!section) return;
        const reducedMotion =
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
          false;
        section.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
        if (options.focusHeading) {
          document.getElementById(`${sectionId}-heading`)?.focus({
            preventScroll: true,
          });
        }
      });
    },
    [sections, setActiveSection],
  );

  useEffect(() => {
    const restoreHashTarget = () => {
      const sectionId = getSheetSectionFromHash(sections);
      if (sectionId) {
        navigateToSection(sectionId, { history: 'none' });
      }
    };
    restoreHashTarget();
    window.addEventListener('hashchange', restoreHashTarget);
    window.addEventListener('popstate', restoreHashTarget);
    return () => {
      window.removeEventListener('hashchange', restoreHashTarget);
      window.removeEventListener('popstate', restoreHashTarget);
    };
  }, [navigateToSection, sections]);

  return { navigateToSection };
}
