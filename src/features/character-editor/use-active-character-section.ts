import { useEffect, useState } from 'react';
import {
  characterSectionIds,
  getCharacterSectionFromHash,
  type CharacterSectionId,
} from '../../systems/mage-m20/character-sections';

const READABLE_TOP_OFFSET = 80;

export function useActiveCharacterSection() {
  const [activeSection, setActiveSection] = useState<CharacterSectionId>(
    () => getCharacterSectionFromHash() ?? 'identity',
  );

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      return;
    }

    const visibleSections = new Map<
      CharacterSectionId,
      IntersectionObserverEntry
    >();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sectionId = entry.target.id;
          if (!characterSectionIds.includes(sectionId as CharacterSectionId)) {
            continue;
          }
          if (entry.isIntersecting) {
            visibleSections.set(sectionId as CharacterSectionId, entry);
          } else {
            visibleSections.delete(sectionId as CharacterSectionId);
          }
        }

        const candidates = [...visibleSections.entries()].sort(
          ([leftId, left], [rightId, right]) =>
            Math.abs(left.boundingClientRect.top - READABLE_TOP_OFFSET) -
              Math.abs(right.boundingClientRect.top - READABLE_TOP_OFFSET) ||
            characterSectionIds.indexOf(leftId) -
              characterSectionIds.indexOf(rightId),
        );
        const nearest = candidates[0]?.[0];
        if (nearest) {
          setActiveSection(nearest);
        }
      },
      {
        rootMargin: `-${READABLE_TOP_OFFSET}px 0px -55% 0px`,
        threshold: [0, 0.01, 0.25, 0.5],
      },
    );

    for (const sectionId of characterSectionIds) {
      const section = document.getElementById(sectionId);
      if (section) {
        observer.observe(section);
      }
    }

    return () => observer.disconnect();
  }, []);

  return { activeSection, setActiveSection };
}
