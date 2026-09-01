# Torchbearer Second Edition guided creator

## Scope

Torchbearer Second Edition is registered as the `torchbearer2e` game system.
It combines the editable adventurer record with a 14-step guided creator for
the six core classes. Character data remains in the existing browser-local
repository and uses the shared JSON/YAML interchange.

## Source mapping

The field map was derived from the supplied `TB2_Character_blank.pdf`. Creator
choices, starting packages, Nature questions, equipment, magic tables, and
level benefits were checked against the supplied
`Torchbearer - Dungeoneers Handbook.pdf`.

The sheet records:

- Who You Are: name, stock, class, age, home, raiment, parents, mentor, friend,
  enemy, and level.
- What You Fight For: belief, creed, goal, and instinct.
- Traits, beneficial uses, and checks.
- Fate and Persona current, total, and total-spent values.
- The eight conditions.
- Will, Health, Nature, Resources, Circles, Precedence, and Might, including
  passed/failed advancement where the source sheet provides it.
- The printed skill list, Beginner's Luck roots, custom skills, and Wises.
- Inventory locations and item state, allies and enemies, relics, and arcane
  spell record fields.
- Current/total Experience as Arcane Record's shared campaign field, level
  benefit notes, advancement history, and general notes.

The creator supports Burglar, Magician, Outcast, Ranger, Theurge, and Warrior;
human upbringing; homes; social graces; specialties; Wises; Nature questions;
relationships; Resources; containers and gear; weapons and armor; and starting
spells or relics. A pure rules engine produces the preview and explained
validation issues. Official restrictions block finalization by default, while
explicit Storyteller overrides are recorded with the character.

Starting magic supports cryptographically random browser rolls and clearly
labeled manual selections. Roll history, individual dice, result IDs, method,
and timestamps remain part of the local character record.

Schema version 2 stores stable creator choice IDs, source provenance, creation
origins, starting ratings, overrides, roll history, and a finalization baseline.
Version-1 sheets migrate as manual legacy records without inferring historical
creation choices. Reopening the creator shows a rebuild comparison and
preserves manual additions and advancement beyond starting ratings.

## Catalog and extension boundary

Core character-facing Skills, Traits, Wises, gear, weapons, spells,
invocations, relics, starting tables, and class level benefits use stable
`tb2.core.*` definition IDs and source/page metadata. Future books must use a
separate namespace so saved core IDs remain stable. Unknown future definition
IDs remain preservable through import/export.

Condition recovery, conflict procedures, advancement-cost calculation,
monsters, adventures, and general town/camp procedure tables remain outside
this milestone. Party-wide specialty uniqueness is advisory because Arcane
Record has no party or cloud coordination model.

No source art, logo, PDF page, or long source passage is used at runtime. The
interface uses original CSS decoration and the established Arcane Record
themes.
