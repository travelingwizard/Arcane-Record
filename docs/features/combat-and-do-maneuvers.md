# Combat and Do Maneuvers Feature

## Structure

Add a **Maneuvers** section with two tabs or subsections:

1. **Combat Reference**
2. **Known Do Maneuvers**

### Combat Reference

Standard combat maneuvers are available to all characters as rules references.

Support:

- Search
- Filter by General, Defensive, Close Combat, or Ranged
- Favorite/unfavorite
- Name, description, source, and page
- Expand/collapse
- Custom reference maneuvers

Favorites are character-specific shortcuts but do not mean the character has purchased or learned the maneuver.

### Known Do Maneuvers

Support:

- 12 Revised maneuvers
- 3 optional Legacy maneuvers
- Add/remove
- Custom Do maneuver
- Notes
- Revised/Legacy labels
- Source and page
- Expand/collapse

Do not include The Final Blow as a maneuver.

## Suggested Character Data

```ts
interface CharacterManeuvers {
  favoriteCombatManeuverIds: string[];
  customCombatManeuvers: CustomManeuver[];
  selectedDoManeuvers: SelectedDoManeuver[];
}

interface CustomManeuver {
  id: string;
  name: string;
  description: string;
  notes: string;
  addedAt: string;
}

interface SelectedDoManeuver {
  id: string;
  definitionId: string | null;
  customName: string;
  notes: string;
  isCustom: boolean;
  addedAt: string;
}
```

## UI

- Add the Maneuvers section to desktop and mobile navigation.
- Use compact tables or cards on desktop.
- Use stacked cards on mobile.
- Show favorited combat maneuvers first when requested.
- Use accessible Add, Favorite, Remove, and disclosure controls.
- Persist through IndexedDB.

## Implemented data and boundary

Schema version 8 stores Combat favorite IDs, custom Combat references, and
selected Do records under `repeatableEntries.maneuvers`. Schema-version-7 and
older records migrate with empty Maneuver collections.

Catalog descriptions, sources, pages, and citations remain in reference data
and are excluded from character exports. The section is always visible because
Combat Reference is universal. Do ratings and maneuver limits are not
enforced.
