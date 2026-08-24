# Combat and Do Maneuvers Feature

## Structure

Add a **Maneuvers** section with two tabs or subsections:

1. **Combat Reference**
2. **Special Do Techniques**

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

### Special Do Techniques

Support:

- Nine official Mage 20 Special Do Techniques from pp. 427-430
- Search across names, alternate names, summaries, and mechanics
- Structured Roll, Difficulty, Damage, Actions, and source-page fields
- A limit of one technique per Do dot above the first
- Preserved over-limit selections if Do is lowered
- Add/remove
- Structured custom techniques
- Notes
- Official/Custom/Legacy labels
- Source and page
- Expand/collapse

Older Do entries are excluded from the default catalog but remain bundled as
Legacy definitions so existing saved selections keep their names and sources.
Unknown retired IDs are also preserved and labeled Legacy. Ordinary Martial
Arts maneuvers, Peaceful Way, the Eight Limbs, Catching Bullets, and The Final
Blow are not part of the official catalog.

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
  customSummary?: string;
  customRoll?: string;
  customDifficulty?: string;
  customDamage?: string;
  customActions?: string;
  customSourceTitle?: string;
  customSourcePage?: string;
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
older records migrate with empty Maneuver collections. The richer custom fields
are optional additions to those records, so existing schema-version-8 through
10 characters require no destructive migration.

Official catalog descriptions, mechanics, sources, pages, and citations remain
in reference data and are excluded from character exports. Custom mechanics are
character-owned and therefore participate in JSON/YAML exchange. The section is
always visible because Combat Reference is universal. Add operations enforce
the Do allowance in both the UI and editor store; lowering Do never deletes a
selection.
