# 17. Exalted First Edition foundation

## Source sheets

The module structure was mapped from the supplied four-page editable Solar and
Dragon-Blooded character sheets. The PDF artwork and logos are reference-only;
the application uses original CSS decoration and does not embed either PDF.

Both sheets share nine Attributes, 25 Abilities, Backgrounds, Virtues,
Willpower, Essence pools, Anima, weapons, experience, and later-page records.
Their primary first-page differences are:

- Solar: Caste identity, Dawn/Zenith/Twilight/Night/Eclipse Ability groupings,
  Solar Backgrounds, and Limit Break;
- Dragon-Blooded: Aspect and House identity, Air/Earth/Fire/Water/Wood Ability
  groupings, and additional Backgrounds including Breeding, Connections,
  Family, and Henchmen.

The same 25 stable Ability IDs are regrouped for each sheet; labels and layout
are not persisted as character data.

## Registered structure

- game system ID: `exalted1e`;
- schema version: `1`;
- sheet variants: `solar`, `dragon-blooded`;
- create route: `/create/exalted1e/:variantId`;
- character data uses integer ratings rendered through the shared dot control.

The schema stores sheet type, identity, Attributes, Abilities, favored Ability
IDs, selected Background definition IDs and records, Virtues, permanent and temporary Willpower,
Essence and pools, Limit/Virtue Flaw, and initial free-form notes. Zod validates
all new, stored, and imported records through the shared registry boundary.

## Implemented foundation

- generic three-step creation flow when a game has variants;
- Solar and Dragon-Blooded identity fields;
- all Attributes and Abilities with accessible dot editing;
- favored Ability markers;
- sheet-specific Background selection, ratings, and notes;
- Virtues, Willpower, Essence, pools, Solar Limit Break, and Virtue Flaw;
- Anima, weapons, and experience notes;
- generic IndexedDB autosave, library summary/search, duplication, rename, and
  JSON/YAML exchange;
- an original Exalted-specific responsive visual token set;
- no horizontal page overflow at 320 CSS pixels.

## Deferred, visibly labeled areas

The editor identifies but does not yet claim to implement Merits and Flaws,
Charms and Sorcery, Combos, full combat/armor, expanded Background narratives,
possessions, languages, derangements, detailed experience history, character
history/description, or a sketch surface. These correspond to source pages two
through four and should be implemented in focused later milestones.
