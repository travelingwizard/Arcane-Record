import { useCallback, useEffect } from 'react';
import {
  getCharacterSectionFromHash,
  type CharacterSectionId,
} from '../../systems/mage-m20/character-sections';

export function useCharacterSectionNavigation({
  activeSection,
  setActiveSection,
  expandSection,
}: {
  activeSection: CharacterSectionId;
  setActiveSection: (sectionId: CharacterSectionId) => void;
  expandSection: (sectionId: CharacterSectionId) => void;
}) {
  const scrollToSection = useCallback(
    (sectionId: CharacterSectionId, focusHeading: boolean) => {
      window.requestAnimationFrame(() => {
        const section = document.getElementById(sectionId);
        if (!section) {
          return;
        }
        const reducedMotion =
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
          false;
        section.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
        if (focusHeading) {
          document.getElementById(`${sectionId}-heading`)?.focus({
            preventScroll: true,
          });
        }
      });
    },
    [],
  );

  const navigateToSection = useCallback(
    (
      sectionId: CharacterSectionId,
      options: {
        focusHeading?: boolean;
        history?: 'push' | 'none';
      } = {},
    ) => {
      expandSection(sectionId);
      setActiveSection(sectionId);
      if (
        options.history !== 'none' &&
        window.location.hash !== `#${sectionId}`
      ) {
        window.history.pushState(null, '', `#${sectionId}`);
      }
      scrollToSection(sectionId, options.focusHeading ?? false);
    },
    [expandSection, scrollToSection, setActiveSection],
  );

  useEffect(() => {
    const restoreHashTarget = () => {
      const sectionId = getCharacterSectionFromHash();
      if (sectionId) {
        navigateToSection(sectionId, {
          history: 'none',
          focusHeading: false,
        });
      }
    };

    restoreHashTarget();
    window.addEventListener('hashchange', restoreHashTarget);
    window.addEventListener('popstate', restoreHashTarget);
    return () => {
      window.removeEventListener('hashchange', restoreHashTarget);
      window.removeEventListener('popstate', restoreHashTarget);
    };
  }, [navigateToSection]);

  return { activeSection, navigateToSection };
}
