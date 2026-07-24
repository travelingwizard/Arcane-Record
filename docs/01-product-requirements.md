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
- optional Backgrounds selected from a searchable, cited catalog, with dot ratings and creation-point totals;
- seven sequential Health boxes with bashing, lethal, and aggravated damage;
- optional Merits and Flaws selected from a searchable, cited catalog, with projected and current point totals;
- editable Focus with catalog or custom Paradigms, Practices, Instruments,
  personal Need, cultural context, notes, and significant-instrument markers;
- editable Wonders with catalog or custom names, types, optional ratings,
  powers, and notes;
- editable Rotes with catalog or custom names, structured Sphere requirements,
  free-form alternatives, Effects, Focus notes, and character notes;
- validated local JSON and YAML import/export;
- debounced autosave status;
- explicit reference-preview labeling for supplied Magick citations that still
  require source verification.

The editor exposes every visible major section through stable URL fragments.
At 70rem and wider, a grouped sticky rail identifies the active section. Below
70rem, a sticky Sections button opens a modal navigation sheet and major
sections become independent disclosures. Identity opens by default; hash
targets open automatically; multiple sections may remain expanded.

## Persistence language

Success reads "Saved in this browser". Pending and failure states read "Unsaved changes", "Saving locally...", and "Local save failed". The interface never suggests online backup.

## Accessibility

All inputs have programmatic labels. Dot tracks expose the trait and current value, work with pointer and keyboard, show focus, and support disabled/read-only modes. Section navigation uses semantic links and `aria-current`; disclosures expose `aria-expanded` and `aria-controls`; the mobile sheet traps focus, closes with Escape, restores focus on dismissal, and prevents background scrolling. Collapsing a section containing focus moves focus to its disclosure. Controls remain usable under browser zoom and at narrow widths.

## Acceptance scenarios

The core acceptance scenario creates a character, names it, sets Strength, Alertness, Forces, Arete, Backgrounds, and Health damage, marks Forces as affinity, selects a Merit and a Flaw, refreshes, and observes the same values and point totals. File exchange scenarios export the active character and import a validated copy under a fresh ID.

A Magick acceptance scenario records a catalog Paradigm, a custom significant
Instrument, a custom Wonder, and a Rote with structured Sphere requirements;
refreshes; and observes the same values in both the editor and a local export.

## Focus, Wonders, and Rotes

Reference catalogs are inspiration and selection aids, not a rules engine.
Unverified entries are labeled as previews, mature material is excluded by
default, and custom entries are always available. Seven starting Instruments
is advisory. The editor does not calculate Effect legality, difficulty,
vulgarity, Paradox, Wonder cost, or automatic Focus transcendence.

Character records store stable catalog IDs and character-specific values.
Reference descriptions and citations remain outside exports. Unknown imported
definition IDs stay visible and preserved.

## Backgrounds

Nothing is selected by default. The catalog searches names, alternate names, and descriptions; filters by source, rating range, points per dot, restriction, and repeatability; and supports name or cost sorting. Every result has an explicit Add button.

Selected Backgrounds have independent UUIDs, character-specific labels, integer ratings, notes, and optional local pooling state. Eight reviewed definitions support multiple instances; all others prevent accidental duplicates. Ratings above five are available only for definitions marked `1–5+`, up to an interface safety maximum of ten, with a Storyteller-approval notice.

Creation cost equals rating multiplied by the definition's one- or two-point multiplier. The standard allowance is seven points with warning-only enforcement. Unknown imported definitions remain visible and repairable but are excluded from totals until their multiplier is known.

## Merits and Flaws

Nothing is selected by default. The catalog searches names, aliases, and descriptions; filters by type, category, source, and point cost; and supports name or cost sorting. Fixed-cost entries add directly. Variable-cost entries require an explicit legal cost before Add is enabled.

The section displays current totals and projected totals before addition. Standard character creation grants benefits for at most seven Flaw points. Exceeding that amount produces a warning but never blocks editing, saving, or import. Selected entries support notes, legal cost changes, removal, and one-step Undo.
