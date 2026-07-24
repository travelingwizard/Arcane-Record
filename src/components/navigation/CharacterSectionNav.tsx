import {
  characterSectionGroups,
  characterSections,
} from '../../systems/mage-m20/character-sections';
import { useCharacterSectionContext } from './character-section-context';

export function CharacterSectionNav() {
  const navigation = useCharacterSectionContext();
  if (!navigation) {
    return null;
  }

  return (
    <nav
      className="character-section-nav"
      aria-label="Character sheet sections"
    >
      <p className="character-section-nav__title">Sheet sections</p>
      {characterSectionGroups.map((group) => {
        const sections = characterSections.filter(
          (section) => section.group === group.id,
        );
        if (sections.length === 0) {
          return null;
        }
        return (
          <div className="character-section-nav__group" key={group.id}>
            <h2>{group.label}</h2>
            <ul>
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
