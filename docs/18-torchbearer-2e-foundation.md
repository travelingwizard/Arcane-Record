# Torchbearer Second Edition foundation

## Scope

Torchbearer Second Edition is registered as the `torchbearer2e` game system.
This first milestone is an editable two-page adventurer record, not an automated
character-creation or advancement rules engine. Character data remains in the
existing browser-local repository and uses the shared JSON/YAML interchange.

## Source mapping

The field map was derived from the supplied `TB2_Character_blank.pdf` and
checked against the Anatomy material on printed pages 7-14 of the supplied
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

No source art, logo, or PDF page is used at runtime. The interface uses original
CSS decoration and the established Arcane Record themes.

## Deferred rules

Automatic stock/class packages, character-creation questionnaires, starting
equipment, spell and relic catalogs, condition recovery logic, advancement
calculation, and level-benefit enforcement are deferred. The current controls
store user-entered records without implying those rules are validated.
