import { useCallback, useState } from 'react';
import {
  characterSectionIds,
  getCharacterSectionFromHash,
  isCharacterSectionId,
  type CharacterSectionId,
} from '../../systems/mage-m20/character-sections';

const SECTION_PREFERENCE_PREFIX = 'arcane-ledger:section-preferences:';

export interface CharacterSectionPreferences {
  characterId: string;
  expandedSections: CharacterSectionId[];
}

export function getCharacterSectionPreferenceKey(characterId: string) {
  return `${SECTION_PREFERENCE_PREFIX}${characterId}`;
}

export function readCharacterSectionPreferences(characterId: string) {
  try {
    const stored = window.localStorage.getItem(
      getCharacterSectionPreferenceKey(characterId),
    );
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as Partial<CharacterSectionPreferences>;
    if (
      parsed.characterId !== characterId ||
      !Array.isArray(parsed.expandedSections)
    ) {
      return null;
    }
    return parsed.expandedSections.filter(
      (sectionId): sectionId is CharacterSectionId =>
        typeof sectionId === 'string' && isCharacterSectionId(sectionId),
    );
  } catch {
    return null;
  }
}

function defaultExpandedSections() {
  const hashSection = getCharacterSectionFromHash();
  return new Set<CharacterSectionId>([
    'identity',
    ...(hashSection ? [hashSection] : []),
  ]);
}

export function useCharacterSectionPreferences(characterId: string) {
  const [expandedSections, setExpandedSections] = useState<
    Set<CharacterSectionId>
  >(() => {
    const stored = readCharacterSectionPreferences(characterId);
    return stored ? new Set(stored) : defaultExpandedSections();
  });

  const persist = useCallback(
    (next: Set<CharacterSectionId>) => {
      const preference: CharacterSectionPreferences = {
        characterId,
        expandedSections: characterSectionIds.filter((id) => next.has(id)),
      };
      try {
        window.localStorage.setItem(
          getCharacterSectionPreferenceKey(characterId),
          JSON.stringify(preference),
        );
      } catch {
        // Preference persistence is best-effort and never blocks character use.
      }
    },
    [characterId],
  );

  const setSectionExpanded = useCallback(
    (sectionId: CharacterSectionId, expanded: boolean) => {
      setExpandedSections((current) => {
        const next = new Set(current);
        if (expanded) {
          next.add(sectionId);
        } else {
          next.delete(sectionId);
        }
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const expandAllSections = useCallback(() => {
    const next = new Set(characterSectionIds);
    setExpandedSections(next);
    persist(next);
  }, [persist]);

  const collapseAllSections = useCallback(
    (keepSection: CharacterSectionId) => {
      const next = new Set([keepSection]);
      setExpandedSections(next);
      persist(next);
    },
    [persist],
  );

  return {
    expandedSections,
    setSectionExpanded,
    expandAllSections,
    collapseAllSections,
  };
}
