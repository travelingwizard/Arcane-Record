# 01. Product requirements

## Library

The opening view lists locally stored characters with last-updated information. Users can create, open, rename, duplicate, and delete characters. Delete requires explicit confirmation. Empty state copy explains that records stay in this browser.

## Editor

The editor provides:

- all nine identity fields;
- nine Attributes grouped into Physical, Social, and Mental;
- 33 Abilities grouped into Talents, Skills, and Knowledges;
- all nine Spheres as integer ratings from 0 to 5;
- one nullable affinity Sphere selected with an unboxed star;
- four local display sort modes;
- an optional circular wheel at desktop widths that edits the same Sphere data;
- Arete, Willpower, Quintessence, and Paradox tracks from 0 or 1 through 10, plus a temporary Willpower box track;
- seven sequential Health boxes with bashing, lethal, and aggravated damage;
- optional Merits and Flaws selected from a searchable, cited catalog, with projected and current point totals;
- validated local JSON and YAML import/export;
- debounced autosave status;
- placeholders for deferred sheet sections.

## Persistence language

Success reads "Saved in this browser". Pending and failure states read "Unsaved changes", "Saving locally...", and "Local save failed". The interface never suggests online backup.

## Accessibility

All inputs have programmatic labels. Dot tracks expose the trait and current value, work with pointer and keyboard, show focus, and support disabled/read-only modes. Controls remain usable under browser zoom and at narrow widths.

## Acceptance scenarios

The core acceptance scenario creates a character, names it, sets Strength, Alertness, Forces, Arete, and Health damage, marks Forces as affinity, selects a Merit and a Flaw, refreshes, and observes the same values and point totals. File exchange scenarios export the active character and import a validated copy under a fresh ID.

## Merits and Flaws

Nothing is selected by default. The catalog searches names, aliases, and descriptions; filters by type, category, source, and point cost; and supports name or cost sorting. Fixed-cost entries add directly. Variable-cost entries require an explicit legal cost before Add is enabled.

The section displays current totals and projected totals before addition. Standard character creation grants benefits for at most seven Flaw points. Exceeding that amount produces a warning but never blocks editing, saving, or import. Selected entries support notes, legal cost changes, removal, and one-step Undo.
