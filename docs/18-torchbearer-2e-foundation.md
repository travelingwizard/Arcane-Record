# Torchbearer Second Edition guided creator

## Scope

Torchbearer Second Edition is registered as the `torchbearer2e` game system.
Its second entry step offers a guided Build Character path, a blank manual Play
Character path, and a Torchbearer-only JSON/YAML import. It combines the
editable adventurer record with a 14-step guided creator for the six core and
six Scavenger’s Supplement classes. Character data remains in the existing
browser-local repository.

## Source mapping

The field map was derived from the supplied `TB2_Character_blank.pdf`. Creator
choices, starting packages, Nature questions, equipment, magic tables, and
level benefits were checked against the supplied
`Torchbearer - Dungeoneers Handbook.pdf`. The additional classes and their
character-facing rules were mapped from `Torchbearer - ss_new_classes_r10.pdf`.

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

The creator supports Burglar, Magician, Outcast, Ranger, Theurge, Warrior,
Bounder, Dreamwalker, Guide, Noble Scion, Sorcerer, and Stoneteller;
human upbringing; homes; social graces; specialties; Wises; Nature questions;
relationships; Resources; containers and gear; weapons and armor; and starting
spells or relics. A pure rules engine produces the preview and explained
validation issues. Official restrictions block finalization by default, while
explicit Storyteller overrides are recorded with the character. Creator
choices that do not apply to the selected class or Race / Stock are hidden by
default. Each affected step can reveal those choices and enable a GM Approved
switch before selecting an exception.

Starting magic supports cryptographically random browser rolls and clearly
labeled manual selections. Roll history, individual dice, result IDs, method,
and timestamps remain part of the local character record.

Schema version 5 stores stable creator choice IDs, source provenance, creation
origins, starting ratings, overrides, roll history, a finalization baseline,
and the persisted Edit/Play sheet mode. Version-1 sheets migrate as manual
legacy records and version-2 sheets retain their existing behavior in Edit
mode. Version-3 sheets gain an empty supplement class-option record without
inferring a choice. Reopening the creator shows a rebuild comparison and
preserves manual additions and advancement beyond starting ratings.

Version 5 also adds standard/Troll Changeling stock variants and dual-age
fields, optional Advanced Start records, Terrible Price history, and structured
Scholar play state. Version-4 sheets migrate as standard stock with empty play
and legacy records; no historical turns, conflicts, recovery, or advancement
are inferred.

The normal sheet uses compact numeric Ability and Skill disclosures. Edit mode
allows structural and base-rating changes. Play mode protects permanent
character-building fields while leaving conditions, rewards, Goal, advancement
marks, current Nature, Wise use, equipment state, relationship status,
transient magic state, history, and notes available during play.

## Catalog and extension boundary

Core character-facing Skills, Traits, Wises, gear, weapons, spells,
invocations, relics, starting tables, and class level benefits use stable
`tb2.core.*` definition IDs and source/page metadata. Future books must use a
separate namespace so saved core IDs remain stable. Unknown future definition
IDs remain preservable through import/export.

Scavenger’s Supplement definitions use the independent `tb2.scavengers.*`
namespace. Integrated player-facing material includes its six classes, class
restrictions, level benefits, Summoner and referenced Skills, new Traits, Maul,
Half-Moon Glaive, Marshtown, and referenced class homes. Dreamwalkers explicitly
choose their level-one Skill increase or third Wise. Noble Scions receive their
special starting Resources, Might, Precedence, equipment, and required parents.
Summoning procedures are summarized through the cited Summoner entry; denizen
stat blocks and town-event tables are not copied into the character runtime.

Automated narrative resolution, advancement-cost calculation, monsters,
adventures, and GM-only town/camp tables remain outside this milestone.
Party-wide specialty uniqueness is advisory because Arcane
Record has no party or cloud coordination model.

Lore Master’s Manual definitions use the independent `tb2.lore-master.*`
namespace. Its character-facing catalog includes Shaman, Skald, Thief, the
Troll Changeling stock override, Traits, Skills, magic, equipment, and level
benefits. The Scholar’s Guide informs the Adventure State, Conflict, Camp &
Town, light, checks, Grind, lifestyle, and recovery trackers. These tools
calculate ranges and totals and present reminders, but the table decides all
narrative results.

No source art, logo, PDF page, or long source passage is used at runtime. The
interface uses original CSS decoration and the established Arcane Record
themes.
