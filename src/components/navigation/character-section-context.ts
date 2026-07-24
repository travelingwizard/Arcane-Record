import { createContext, useContext } from 'react';
import type { CharacterSectionSummaries } from '../../features/character-editor/character-section-summaries';
import type { CharacterSectionId } from '../../systems/mage-m20/character-sections';

export interface CharacterSectionContextValue {
  activeSection: CharacterSectionId;
  expandedSections: Set<CharacterSectionId>;
  isNarrowLayout: boolean;
  summaries: CharacterSectionSummaries;
  setSectionExpanded: (
    sectionId: CharacterSectionId,
    expanded: boolean,
  ) => void;
  navigateToSection: (
    sectionId: CharacterSectionId,
    options?: { focusHeading?: boolean; history?: 'push' | 'none' },
  ) => void;
  expandAllSections: () => void;
  collapseAllSections: (keepSection: CharacterSectionId) => void;
}

export const CharacterSectionContext =
  createContext<CharacterSectionContextValue | null>(null);

export function useCharacterSectionContext() {
  return useContext(CharacterSectionContext);
}
