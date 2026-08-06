import { createContext, useContext } from 'react';
import type {
  SheetNavigationGroupDefinition,
  SheetNavigationSectionDefinition,
  SheetNavigationSummary,
} from './sheet-navigation';

export interface CharacterSectionContextValue {
  activeSection: string;
  expandedSections: Set<string>;
  isNarrowLayout: boolean;
  summaries: Record<string, SheetNavigationSummary>;
  sections: readonly SheetNavigationSectionDefinition[];
  groups: readonly SheetNavigationGroupDefinition[];
  groupOrder: readonly string[];
  canCollapseSections: boolean;
  setSectionExpanded: (sectionId: string, expanded: boolean) => void;
  navigateToSection: (
    sectionId: string,
    options?: { focusHeading?: boolean; history?: 'push' | 'none' },
  ) => void;
  expandAllSections: () => void;
  collapseAllSections: (keepSection: string) => void;
  moveGroup: (groupId: string, direction: 'earlier' | 'later') => void;
}

export const CharacterSectionContext =
  createContext<CharacterSectionContextValue | null>(null);

export function useCharacterSectionContext() {
  return useContext(CharacterSectionContext);
}
