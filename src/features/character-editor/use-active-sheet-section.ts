import { useEffect, useState } from 'react';
import {
  getSheetSectionFromHash,
  type SheetNavigationSectionDefinition,
} from '../../components/navigation/sheet-navigation';

const READABLE_TOP_OFFSET = 80;

export function useActiveSheetSection(
  sections: readonly SheetNavigationSectionDefinition[],
  defaultSectionId: string,
) {
  const [activeSection, setActiveSection] = useState(
    () => getSheetSectionFromHash(sections) ?? defaultSectionId,
  );

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const sectionIds = sections.map(({ id }) => id);
    const visibleSections = new Map<string, IntersectionObserverEntry>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!sectionIds.includes(entry.target.id)) return;
          if (entry.isIntersecting) {
            visibleSections.set(entry.target.id, entry);
          } else {
            visibleSections.delete(entry.target.id);
          }
        });
        const nearest = [...visibleSections.entries()].sort(
          ([leftId, left], [rightId, right]) =>
            Math.abs(left.boundingClientRect.top - READABLE_TOP_OFFSET) -
              Math.abs(right.boundingClientRect.top - READABLE_TOP_OFFSET) ||
            sectionIds.indexOf(leftId) - sectionIds.indexOf(rightId),
        )[0]?.[0];
        if (nearest) setActiveSection(nearest);
      },
      {
        rootMargin: `-${READABLE_TOP_OFFSET}px 0px -55% 0px`,
        threshold: [0, 0.01, 0.25, 0.5],
      },
    );
    sectionIds.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [sections]);

  return { activeSection, setActiveSection };
}
