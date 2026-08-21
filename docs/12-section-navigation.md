# 12. Character section navigation

## Registry and anchors

The components under `src/components/navigation` provide core application
chrome for every game: a desktop left rail, a mobile Sections sheet, hash
navigation, and pencil-gated section-group ordering. Each game supplies stable
section and group definitions. Mage definitions live in
`src/systems/mage-m20/character-sections.ts`; Exalted definitions live in
`src/games/exalted1e/definitions.ts`; Burning Wheel definitions live in
`src/games/burning-wheel/definitions.ts`.

Mage currently registers these groups and anchors:

| Group      | Section        | Anchor           |
| ---------- | -------------- | ---------------- |
| Character  | Identity       | `#identity`      |
| Traits     | Attributes     | `#attributes`    |
| Traits     | Abilities      | `#abilities`     |
| Traits     | Maneuvers      | `#maneuvers`     |
| Advantages | Backgrounds    | `#backgrounds`   |
| Advantages | Merits & Flaws | `#merits-flaws`  |
| Magick     | Spheres        | `#spheres`       |
| Magick     | Enlightenment  | `#enlightenment` |
| Paradigm   | Focus          | `#focus`         |
| Paradigm   | Wonders        | `#wonders`       |
| Paradigm   | Rotes          | `#rotes`         |
| Gear       | Equipment      | `#equipment`     |
| Condition  | Health         | `#health`        |
| Records    | Experience     | `#experience`    |
| Records    | Save           | `#import-export` |

The current editor implements one combined Enlightenment section instead of
separate Arete/Willpower and Quintessence/Paradox sections. Focus, Wonders, and
Rotes are real editable sections with independent summaries and anchors.
Equipment is a real editable section in its own Gear group.
Maneuvers is always registered because Combat Reference is available to every
character; known Do selections remain optional.
Import/export is visible and receives a Records group instead of being omitted
from navigation.

Future major sections must first receive a stable literal ID in the registry.
Then add the matching `SheetSection`, summary selector, and registry-order
rendering. Do not derive IDs from visible labels.

## Responsive behavior

At 70rem (1120 CSS pixels) and wider, a 14rem semantic navigation rail sits
beside the sheet. It is sticky, internally scrollable, and marks the section
nearest the readable top edge using one shared `IntersectionObserver`.
Navigation sets the active item immediately; observation then follows normal
scrolling. The root margin accounts for sticky controls, and the final
intersecting section can become active near the page bottom.

Each desktop rail group heading is a disclosure button. It can collapse or
reveal that group’s section links without changing section content or character
data. Focus, Wonders, and Rotes are grouped under Paradigm. The top Build/Play
switch selects a per-character group order. A pencil button in the desktop rail
and mobile Sections sheet enters a transient order-editing mode. Up/down
controls appear only in that mode and reorder groups for the active mode; the
page and both navigators follow the same order. The mobile edit state resets
when the Sections sheet closes so normal navigation remains uncluttered.

Build mode keeps every rating editable. Play mode renders character-building
ratings as view-only controls across desktop and mobile: Attributes, Abilities,
Spheres, Arete, permanent Willpower, and Backgrounds. Health, Temporary
Willpower, Quintessence, Paradox, and Equipment remain editable for use during
play. This prevents accidental touch changes without locking resource and
condition tracking.

Below 70rem, the rail is hidden and the sticky Sections button opens a modal
bottom sheet. The sheet traps focus, closes with Escape or its close button,
restores trigger focus when dismissed, prevents background scrolling, and uses
the same registry and real fragment links. Expand All and Collapse All affect
only interface preferences.

Major sections use the shared `SheetSection` disclosure. Multiple sections may
remain open. Content remains mounted, so collapse does not reset inputs,
interrupt autosave, change character data, or remove validation state. If
focus is inside a section being collapsed, focus moves to its disclosure
button. Collapsed summaries retain useful values and warning-only point-limit
messages.

## URL and focus behavior

Navigation changes only the fragment; there are no per-section routes. A valid
initial hash expands and scrolls to its target after the character editor
mounts. Unknown hashes are ignored safely. Hash and popstate events restore
section navigation for Back and Forward.

Pointer navigation scrolls without unexpectedly moving focus. Keyboard
navigation and mobile-sheet selection focus the programmatically focusable
section heading. Scroll behavior respects `prefers-reduced-motion`, and every
section has a sticky-header-aware scroll margin.

## Preference boundary

Mobile expansion is stored under
`arcane-ledger:section-preferences:<character-id>`:

```ts
interface CharacterSectionPreferences {
  characterId: string;
  expandedSections: CharacterSectionId[];
}
```

With no saved preference, Identity and a valid hash target are expanded. Other
sections start collapsed. Unknown stored IDs are ignored. Desktop content is
always expanded, although mobile preferences remain available when the
viewport narrows again.

This data is a local view preference. It is separate from Zustand character
state, the repository, IndexedDB records, schema migrations, autosave, and
JSON/YAML serialization. The active desktop section is transient.

By contrast, `sheetLayout` is character data: it stores Build/Play mode and a
complete group order for each mode. It is validated, saved in IndexedDB, and
included in JSON/YAML character files.

Exalted First Edition currently has one complete group order rather than
Build/Play-specific orders. It uses Character, Traits, Advantages, and Records
groups. The same pencil interaction reorders its navigation and DOM section
order; schema migration supplies the default order to version-one Exalted
records.
