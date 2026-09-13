# Exalted 1e — Abyssal source intake

**Status: source intake in progress.** `Exalted: The Abyssals` has been
supplied and 175 inventory rows are checked in under `inventory/`. See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory follows.

## What's inventoried so far

- `source-manifest.json` — the one source book in scope so far
  (`exalted-the-abyssals`); supplements (necromancy-heavy books like *Blood
  and Salt* or *Book of Bone and Ebony*) are not yet added.
- `inventory/exalted-the-abyssals.json` — 175 rows covering:
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
  - **148 Chapter Five Charm rows (pp. 157-200, PDF 158-201)**, covering
    every Ability line for the Dusk, Midnight and Daybreak Castes:
    - **Dusk Caste** (pp. 157-174): Archery (11 Charms, two root lines
      converging on the capstone `piercing-ghost-barb`), two Brawl trees
      (`dead-mans-grasp` → `owl-seizes-mouse`, 4 Charms; `ravaging-strike`
      → `writhing-blood-chain-technique`, 7 Charms), Martial Arts
      (`essence-discerning-glance` → `soul-flaying-strike`, 10 Charms),
      three Melee trees (an offense line `furious-blade` →
      `soul-cleaving-strike`, a weapon-summoning line
      `blade-summoning-gesture` → `resplendent-shadow-blade`, and a
      defense line `elegant-flowing-deflection` → `eye-of-the-tempest`;
      27 Charms total, see caveat below), and Thrown (two root lines
      converging on capstone `ravening-crimson-chakram`, 9 Charms).
    - **Midnight Caste** (pp. 174-187): two Endurance trees (Ox-Body
      Technique plus `ghost-armor-prana` → `relentless-revenant-spirit`,
      4 Charms; `pain-eating-focus` → `insensible-corpse-technique` /
      `agony-savoring-spirit`, 3 Charms), Performance
      (`haunting-inflection-trick` → `hardened-killer-training-style`,
      8 Charms), Presence (`elegant-tyrants-majesty` →
      `heart-stopping-mien`, 7 Charms), Resistance (an armor/toughness
      line `spirit-hardened-frame` → `flowing-wound-defense` plus a
      poison/disease-resistance trio and a second armor-summoning line
      `armor-calling-kata` → `inauspicious-shadow-plate`, 11 Charms
      total), and Survival (`essence-engorgement-technique` /
      `enduring-huntsman-method` → `ghost-leaves-no-trail`, 10 Charms).
    - **Daybreak Caste** (pp. 187-200): Craft (`fault-finding-scrutiny` →
      `form-restoring-touch`, 5 Charms), Investigation
      (`excellent-inquisitor-attitude` → `lingering-echo-meditation`,
      7 Charms), Lore (`crypt-bolt` → `wyld-slaying-burst`, 7 Charms),
      Medicine (a disease sub-tree `infallible-ailment-sense` →
      `unsurpassed-plague-kiss` plus a healing sub-tree
      `flesh-mending-discipline` → `fivefold-wound-absorbing-method`,
      11 Charms total), and Occult (the two sorcery-access Charms
      `terrestrial-circle-sorcery`/`celestial-circle-sorcery`, the three
      necromancy-access Charms `shadowlands-circle-necromancy`/
      `labyrinth-circle-necromancy`/`void-circle-necromancy`, and five
      spirit-perception/spirit-combat Charms ending in the capstone
      `spirit-draining-ward`; 10 Charms total).
    - **Caveat**: a handful of rows have summary text copied verbatim from
      the book's prose that labels more than one Charm as a tree
      "capstone" in the same Ability line (notably in Dusk Caste Melee
      around `attunement-shattering-block`/`eye-of-the-tempest`, and the
      Daybreak Medicine sub-tree numbering jumps from "second" to
      "third" without an identified second sub-tree). These rows are
      individually accurate to the page but the exact tree-branch
      topology in those spots has not been fully disambiguated — flagged
      for a dedicated review pass before any of this content is promoted
      to a production catalog.

## What's still needed

1. Two of the five Castes' Chapter Five Charm trees remain: **Day Caste**
   (Athletics, Awareness, Dodge, Larceny, Stealth — starts at printed p. 200
   / PDF 201 with the Athletics tree `raiton's-nimble-perch` → ... →
   `soaring-raptor-prana`, confirmed by rendering PDF pages 201-208) and
   **Moonshadow Caste** (Bureaucracy, Linguistics, Ride, Sail, Socialize —
   not yet located/rendered). **Resume with Day Caste Athletics at printed
   p. 200 / PDF 201.**
2. Chapter Six: The Arts of the Dead — necromancy spells (Shadowlands and
   Labyrinth Circles), the Craft (Necrosurgery/Jadecrafting/Soulforging)
   rules referenced but not detailed in Chapter Four. (Chapter Five —
   Charms — continues past printed p. 200 through at least the two
   remaining Castes; Chapter Six's exact start page has not been located
   yet.)
3. Necromancy-heavy supplements (*Blood and Salt*, *Book of Bone and Ebony*)
   if their Abyssal-facing mechanics are in scope.
4. Merits/Flaws specific to Abyssals, if any exist beyond the standard set —
   not yet located; Chapters One through Four have not surfaced a distinct
   Merits/Flaws section, so it may live in Chapter Six or not exist as its
   own section in this book.

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
