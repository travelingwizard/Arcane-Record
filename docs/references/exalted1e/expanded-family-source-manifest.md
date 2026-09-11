# Exalted First Edition expanded-family source manifest

Status: **in progress**. The five family books are image-only PDFs. Page ranges
below were visually verified against each book's table of contents; individual
definitions require page-by-page inventory before they may drive runtime rules.

| Source ID | Book | Required for | Verified player-facing ranges | Runtime status |
| --- | --- | --- | --- | --- |
| `core` | Exalted First Edition | Shared rules, Solar | Existing foundation; re-audit creation and advancement | Required |
| `lunars` | The Lunars | Lunar | Character Creation 86-93; Traits 94-115; Charms 116-193 | Inventory required |
| `abyssals` | The Abyssals | Abyssal | Character Creation 118-127; Traits 128-153; Charms 154-229; Arts of the Dead 230-261 | Inventory required |
| `fair-folk` | The Fair Folk | Fair Folk | Character Creation 90-101; Traits 102-125; Raksha Magic 126-221 | Inventory required |
| `autochthonians` | The Autochthonians | Alchemical | Character Creation and Traits 56-85; Charms 86-141 | Inventory required |
| `sidereals` | The Sidereals | Sidereal | Character Creation 94-101; Traits 102-125; Charms and Martial Arts 126-201; Astrology 202-235 | Inventory required |
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
