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
- schema version: `5`;
- sheet variants: `solar`, `dragon-blooded`;
- create route: `/create/exalted1e`; choosing a variant creates and opens it;
- character data uses integer ratings rendered through the shared dot control.

The schema stores sheet type, identity, Attributes, Abilities, favored Ability
IDs, selected Background definition IDs and records, Virtues, permanent and
temporary Willpower, Essence and pools, Limit/Virtue Flaw, initial free-form
notes, Dragon-Blooded Merit/Flaw and Charm/spell selections, and a complete
section-group order. Trait selections contain a UUID, stable definition ID,
chosen cost, choice label, and character notes. Power selections contain a
UUID, stable definition ID, and character notes; catalog rules and sources
remain reference data. Shared equipment stores character-owned state separately
from definitions, and saved Combos retain only their component Charm IDs and
character-authored text. Zod validates all new, stored, and imported records
through the shared registry boundary. Version-one records migrate by receiving
the default section order, version-one/two records receive empty power
selections, version-one through three receive empty Merit/Flaw selections, and
version-one through four receive empty shared equipment and Combo collections
plus the Classic combat profile.

## Implemented foundation

- two-step creation where choosing Solar or Dragon-Blooded opens that sheet;
- shared desktop left navigation and mobile Sections sheet;
- pencil-gated group ordering that reorders and persists the sheet;
- Solar and Dragon-Blooded identity fields;
- all Attributes and Abilities with accessible dot editing;
- favored Ability markers;
- sheet-specific Background selection, ratings, and notes;
- Virtues, Willpower, Essence, pools, Solar Limit Break, and Virtue Flaw;
- Anima, weapons, and experience notes;
- a Dragon-Blooded-only Charms & Sorcery section with 320 Charms and 99
  Terrestrial/Emerald Circle spells, search and filters, source-review labels,
  expanded reference details, and character notes;
- advisory display of minimums and sorcery access without blocking edits;
- a Dragon-Blooded-only Merits & Flaws section with 80 selectable definitions,
  separate Merit and Flaw totals, category/search filters, citations, expanded
  rules, legal fixed and variable costs, repeat-purchase labels, character
  notes, removal Undo, and Storyteller-approval advisories;
- a shared Exalted Equipment group for catalog and custom weapons, armor,
  shields, and ammunition, with separate character names, quality allocations,
  Magical Material, equipment/attunement state, committed Essence, and notes;
- separate Classic and Power Combat weapon profiles sourced from the core rules
  and Player's Guide, with natural attacks, equipped attacks, calculation
  breakdowns, ammunition effects, armor protection, material affinities, and
  combat specialties;
- a shared Combo builder with Add/Remove/reorder controls, dynamic cost display,
  saved character Combos, explicit Charm-text exceptions, and a
  Dragon-Blooded-only elemental surcharge extension;
- generic IndexedDB autosave, library summary/search, duplication, rename, and
  JSON/YAML exchange;
- an original Exalted-specific responsive visual token set;
- no horizontal page overflow at 320 CSS pixels.

## Deferred, visibly labeled areas

The editor identifies but does not yet claim to implement Solar Merits and
Flaws, Solar Charms and Sorcery, a sourced shield catalog, Power Combat
Hardness, full exceptional/perfect quality presets, expanded Background
narratives, general possessions, languages, derangements, detailed experience
history, character history/description, or a sketch surface. Custom shields and
quality allocations remain editable, but no missing modifier is guessed.

The Dragon-Blooded catalog provenance, readable catalog, special-case policy,
and review queue are preserved under
`docs/references/exalted1e/dragon-blooded/`. The Merit/Flaw JSON is the runtime
source of truth; its Markdown and CSV forms support human review. Entries marked
for power source review remain selectable and visibly labeled; uncertain rules
are not silently reconstructed.
