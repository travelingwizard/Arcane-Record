# Earthdawn Fourth Edition module

Arcane Record’s Earthdawn module is a local-first First Circle builder and play
sheet. The Steps application and its user manual are behavioral references only;
no Steps code, visual assets, catalogs, or portraits are bundled.

## Rules sources

The Player’s Guide is always enabled. The Gamemaster’s Guide, Travar, Questors,
Deeper Secrets, Iopos, Vasgothia, Mystic Paths, and Elven Nations are optional
official sources and default off. Source ownership is stored in the browser and
on each character. A disabled source never deletes an already-selected record.

Every selectable catalog definition has a stable namespaced ID and a book/page
citation. Catalog extraction is deliberately limited to confirmed,
character-facing rules. Ambiguous headings and categories are not turned into
invented selectable rules; they remain candidates for a later reviewed catalog
expansion.

## Character and creator

The version 1 schema separates permanent selections, creator decisions,
mutable play state, and derived calculations. The ten-step creator covers
Discipline, race, Attributes, derived characteristics, racial abilities,
Talents, Skills, equipment, identity, and final review. Enforced errors block
finalization unless a recorded GM Approved override is present.

Edit mode controls permanent definitions. Play mode keeps damage, wounds,
recovery, Karma, Legend Points, equipment use, spell and thread state,
conditions, temporary modifiers, rolls, and notes available.

## Dice and interchange

The Step/Dice section provides Steps 1–105 and a local exploding-dice roller.
Roll records include the dice chain, modifiers, target number, total, success
level, context, and timestamp.

Arcane Record JSON and YAML are authoritative. The legacy importer accepts
Steps-shaped JSON, removes portrait/image fields, maps recognized official
records, retains custom text, and presents mapped, ignored, and unresolved
fields for review. Arcane Record does not export Steps JSON.
