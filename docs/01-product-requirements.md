# 01. Product requirements

## Library

The opening view lists locally stored characters with last-updated information. Users can create, open, rename, duplicate, and delete characters. Delete requires explicit confirmation. Empty state copy explains that records stay in this browser.

## Editor

The editor provides:

- all nine identity fields;
- nine Attributes grouped into Physical, Social, and Mental;
- all nine Spheres as integer ratings from 0 to 5;
- one nullable affinity Sphere selected with an unboxed star;
- four local display sort modes;
- an optional circular wheel at desktop widths that edits the same Sphere data;
- debounced autosave status;
- placeholders for deferred sheet sections.

## Persistence language

Success reads "Saved in this browser". Pending and failure states read "Unsaved changes", "Saving locally...", and "Local save failed". The interface never suggests online backup.

## Accessibility

All inputs have programmatic labels. Dot tracks expose the trait and current value, work with pointer and keyboard, show focus, and support disabled/read-only modes. Controls remain usable under browser zoom and at narrow widths.

## Acceptance scenarios

The core acceptance scenario creates a character, names it, sets Strength and Forces to 3, marks Forces as affinity, refreshes, and observes the same values.
