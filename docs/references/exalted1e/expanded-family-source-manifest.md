# Exalted First Edition expanded-family source manifest

Status: **in progress**. Creation summaries for all five added families have
been visually checked and transcribed into the pure rules layer. Fair Folk and
Autochthonians contain extractable text; Lunar, Abyssal, and Sidereal remain
image scans and require page-by-page power inventory before their selectors can
be enabled.

| Source ID | Book | Required for | Verified player-facing ranges | Runtime status |
| --- | --- | --- | --- | --- |
| `core` | Exalted First Edition | Shared rules, Solar | Existing foundation; re-audit creation and advancement | Required |
| `lunars` | The Lunars | Lunar | Creation rules and summary verified at printed 86-93 / PDF 91-98; Traits 94-115; Charms 116-193 | Creation verified; power inventory required |
| `abyssals` | The Abyssals | Abyssal | Creation rules and summary verified at printed 118-127 / PDF 121-130; Traits 128-153; Charms 154-229; Arts of the Dead 230-261 | Creation verified; power inventory required |
| `fair-folk` | The Fair Folk | Fair Folk | Creation rules and summary verified at printed 90-101 / PDF 91-102; Traits 102-125; Raksha Magic 126-221; experience printed 321 / PDF 322 | Creation, 201-Charm inventory, and native advancement verified |
| `autochthonians` | The Autochthonians | Alchemical | Creation rules and summary verified at printed 56-64 / PDF 57-65; Traits 65-85; Charms 86-141 | Creation, 87-Charm inventory, and core advancement verified |
| `sidereals` | The Sidereals | Sidereal | Creation rules and summary verified at printed 94-101 / PDF 97-104; Traits 102-125; Charms and Martial Arts 126-201; Astrology 202-235 | Creation verified; power inventory required |
| `players-guide` | Exalted Player's Guide | Optional shared rules and verified playable templates | Pending page inventory | Disabled by default |
| `storytellers-companion` | Exalted Storyteller's Companion | Verified playable templates only | Pending page inventory | Disabled by default |
| `book-of-three-circles` | Book of Three Circles | Sorcery and character-facing magic | Pending page inventory | Disabled by default |
| `book-of-bone-and-ebony` | Book of Bone and Ebony | Necromancy and character-facing equipment | Pending page inventory | Disabled by default |
| `blood-and-salt` | Blood and Salt | Character-facing regional options | Pending page inventory | Disabled by default |
| `games-of-divinity` | Games of Divinity | Spirits and complete playable templates, if any | Pending page inventory | Disabled by default |

## Classification contract

Every extracted entry must be classified as `selectable`, `calculated`,
`reference-only`, `gm-only`, `unresolved`, or `out-of-scope`. A definition is
not `selectable` until its name, requirements, mechanics, cost, family
compatibility, printed page, and PDF page have been checked. Only `selectable`
and `calculated` entries may affect budgets, prerequisites, derived values, or
advancement quotes.

## Current ambiguities and blockers

- Printed and PDF page offsets must be recorded independently for every source.
- Existing Solar Charm entries cite secondary references and remain marked for
  source review until compared with the supplied primary books.
- Existing Dragon-Blooded catalogs retain their stable IDs; consolidation must
  use aliases or replacement mappings.
- Supplemental character types require a complete creation procedure, starting
  values, power access, and advancement rules. Partial NPC templates remain
  reference-only.
- No family may borrow another family's Background, Charm, Merit/Flaw, Combo,
  or advancement rules merely because the underlying UI is shared.
- Lunar Casteless, Abyssal fugitive, Sidereal ronin, and Fair Folk
  noble/common creation packages are modeled separately; their variant budgets
  must not be flattened into the standard profile.
- Dragon-Blooded advancement remains manual until its family table is
  individually reverified. Supplemental advancement categories not named by a
  family table remain manual rather than inheriting a superficially similar
  price.
- Lunar, Abyssal, and Sidereal Charm books are image scans. Their creation and
  advancement tables have been visually verified, but their complete power
  inventories still require page-by-page transcription and prerequisite review.

## Implemented verified runtime rules

- Lunar creation: printed p. 92 (PDF 95), including caste/casteless budgets and
  Essence pools.
- Abyssal creation: printed pp. 124-125 (PDF 125-126), including loyal/fugitive
  Background budgets and Essence pools.
- Sidereal creation: printed pp. 100-101 (PDF 103-104), including standard/ronin
  budgets, Colleges, and Essence pools.
- Alchemical creation and advancement: printed pp. 63-64 (PDF 64-65), including
  Caste/Favored Attribute allocation, Charm Slots, pools, health, and verified
  XP prices.
- Fair Folk noble/common creation: printed pp. 99-101 (PDF 100-102), including
  Graces, commoner variants, and the single Essence pool.
- Solar advancement: printed p. 270 (PDF 273).
- Lunar advancement: printed p. 251 (PDF 254).
- Abyssal advancement equivalence and training exception: printed p. 282 (PDF
  283), using the Solar table it explicitly references.
- Sidereal family-specific advancement: printed p. 265 (PDF 268).
- Fair Folk family-specific advancement: printed p. 321 (PDF 322).
