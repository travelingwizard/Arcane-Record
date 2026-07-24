# 12. Character section navigation

## Registry and anchors

`src/systems/mage-m20/character-sections.ts` is the single source for section
IDs, labels, groups, and order. Rendering, desktop navigation, mobile
navigation, summaries, hashes, and preference validation consume that
registry.

| Group      | Section         | Anchor           |
| ---------- | --------------- | ---------------- |
| Character  | Identity        | `#identity`      |
| Traits     | Attributes      | `#attributes`    |
| Traits     | Abilities       | `#abilities`     |
| Advantages | Backgrounds     | `#backgrounds`   |
| Advantages | Merits & Flaws  | `#merits-flaws`  |
| Magick     | Spheres         | `#spheres`       |
| Magick     | Enlightenment   | `#enlightenment` |
| Magick     | Focus           | `#focus`         |
| Magick     | Wonders         | `#wonders`       |
| Magick     | Rotes           | `#rotes`         |
| Condition  | Health          | `#health`        |
| Records    | Import & export | `#import-export` |

The current editor implements one combined Enlightenment section instead of
separate Arete/Willpower and Quintessence/Paradox sections. Focus, Wonders, and
Rotes are real editable sections with independent summaries and anchors.
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
