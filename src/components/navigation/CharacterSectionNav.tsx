import { useState } from 'react';
import {
  characterSections,
  getOrderedSectionGroups,
} from '../../systems/mage-m20/character-sections';
import { useCharacterSectionContext } from './character-section-context';

export function CharacterSectionNav() {
  const navigation = useCharacterSectionContext();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  if (!navigation) {
    return null;
  }

  return (
    <nav
      className="character-section-nav"
      aria-label="Character sheet sections"
    >
      <p className="character-section-nav__title">Sheet sections</p>
      {getOrderedSectionGroups(
        navigation.sheetLayout.groupOrders[navigation.sheetLayout.mode],
      ).map((group) => {
        const sections = characterSections.filter(
          (section) => section.group === group.id,
        );
        if (sections.length === 0) {
          return null;
        }
        const collapsed = collapsedGroups.has(group.id);
        const listId = `character-section-nav-${group.id}`;
        return (
          <div className="character-section-nav__group" key={group.id}>
            <h2>
              <button
                type="button"
                aria-expanded={!collapsed}
                aria-controls={listId}
                onClick={() => {
                  setCollapsedGroups((current) => {
                    const next = new Set(current);
                    if (next.has(group.id)) {
                      next.delete(group.id);
                    } else {
                      next.add(group.id);
                    }
                    return next;
                  });
                }}
              >
                <span>{group.label}</span>
                <span aria-hidden="true">{collapsed ? '+' : '−'}</span>
              </button>
            </h2>
            <div className="character-section-nav__group-order">
              <button
                type="button"
                className="icon-button"
                aria-label={`Move ${group.label} earlier`}
                disabled={
                  navigation.sheetLayout.groupOrders[
                    navigation.sheetLayout.mode
                  ].indexOf(group.id) === 0
                }
                onClick={() =>
                  navigation.moveSheetGroup(
                    navigation.sheetLayout.mode,
                    group.id,
                    'earlier',
                  )
                }
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Move ${group.label} later`}
                disabled={
                  navigation.sheetLayout.groupOrders[
                    navigation.sheetLayout.mode
                  ].indexOf(group.id) ===
                  navigation.sheetLayout.groupOrders[
                    navigation.sheetLayout.mode
                  ].length -
                    1
                }
                onClick={() =>
                  navigation.moveSheetGroup(
                    navigation.sheetLayout.mode,
                    group.id,
                    'later',
                  )
                }
              >
                ↓
              </button>
            </div>
            <ul id={listId} hidden={collapsed}>
              {sections.map((section) => {
                const active = navigation.activeSection === section.id;
                return (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      aria-current={active ? 'location' : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        navigation.navigateToSection(section.id, {
                          focusHeading: event.detail === 0,
                        });
                      }}
                    >
                      <span aria-hidden="true">◆</span>
                      {'shortLabel' in section
                        ? section.shortLabel
                        : section.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
