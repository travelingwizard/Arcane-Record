import type { ReactNode } from 'react';
import {
  CharacterSectionContext,
  type CharacterSectionContextValue,
} from './character-section-context';

export function CharacterSectionProvider({
  value,
  children,
}: {
  value: CharacterSectionContextValue;
  children: ReactNode;
}) {
  return (
    <CharacterSectionContext.Provider value={value}>
      {children}
    </CharacterSectionContext.Provider>
  );
}
