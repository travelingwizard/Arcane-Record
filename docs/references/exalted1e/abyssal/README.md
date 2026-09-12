# Exalted 1e — Abyssal source intake

**Status: source intake in progress.** `Exalted: The Abyssals` has been
supplied and 27 inventory rows are checked in under `inventory/`. See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory follows.

## What's inventoried so far

- `source-manifest.json` — the one source book in scope so far
  (`exalted-the-abyssals`); supplements (necromancy-heavy books like *Blood
  and Salt* or *Book of Bone and Ebony*) are not yet added.
- `inventory/exalted-the-abyssals.json` — 27 rows covering:
  - The Chapter Three character-creation overview (Attributes/Abilities/
    Backgrounds/Charms/Virtues/Willpower/Essence).
  - The universal, caste-agnostic Anima Effect (Caste Mark flare, anima
    flare, Underworld sensing, feeding via fangs).
  - All five Castes (Dusk, Midnight, Daybreak, Day, Moonshadow) with their
    Anima Banners, Anima Effects, Caste Abilities, Associations, Sobriquets,
    and Concepts.
  - The Abyssal Curse, the Virtues of Death, and the full Resonance mechanic
    (the Limit-Trait analog): gaining Resonance (Litany of Sins), losing it
    (Castigation/Communion), and the 1-10 Resonance Manipulation Effects
    table.
  - The Title (name sacrifice), Useful Crafts, and the Cult-and-Abyssals
    exclusion sidebar.
  - The six new deathknight-only Backgrounds (Abyssal Command, Liege,
    Necromancy, Spies, Underworld Manse, Whispers) and the altered
    Backgrounds (Artifact, Backing/Mentor, Familiar, Followers, Manse).

## What's still needed

1. Chapter Five's Charm trees (not yet inventoried at all).
2. Chapter Six: The Arts of the Dead — necromancy spells (Shadowlands and
   Labyrinth Circles), the Craft (Necrosurgery/Jadecrafting/Soulforging)
   rules referenced but not detailed in Chapter Four.
3. Necromancy-heavy supplements (*Blood and Salt*, *Book of Bone and Ebony*)
   if their Abyssal-facing mechanics are in scope.
4. Merits/Flaws specific to Abyssals, if any exist beyond the standard set.

Note: the Dragon-Blooded import explicitly excluded necromancy from its
standard catalog scope (`docs/references/exalted1e/dragon-blooded/README.md`).
Abyssal necromancy circles/paths/spells need their own full inventory here —
nothing from the Dragon-Blooded package can be reused for that content.

## Do not add yet

- Do not add a production catalog under `src/games/exalted1e/reference/` for
  this family — that only happens after inventory rows are visually reviewed
  against the rendered source page.
- Do not add `abyssal` to `exaltedSheetTypes` in
  `src/games/exalted1e/definitions.ts` — that stays out of scope until all
  five planned families are certified together.
