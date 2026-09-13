# Exalted 1e — Abyssal source intake

**Status: source intake in progress.** `Exalted: The Abyssals` has been
supplied and 265 inventory rows are checked in under `inventory/`. See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory follows.

## What's inventoried so far

- `source-manifest.json` — the one source book in scope so far
  (`exalted-the-abyssals`); supplements (necromancy-heavy books like *Blood
  and Salt* or *Book of Bone and Ebony*) are not yet added.
- `inventory/exalted-the-abyssals.json` — 265 rows covering:
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
  - **228 Chapter Five Charm rows (pp. 157-222, PDF 158-223)**, covering
    every Ability line for all five Castes:
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
    - **Day Caste** (pp. 200-205): Athletics (`raitons-nimble-perch` → ...
      → `strength-stealing-technique`, 12 Charms), Awareness
      (`fivefold-sensory-exercise` → `incomparable-sense-technique`,
      6 Charms), Dodge (`flitting-shadow-form` → `flowing-evasion-assault`,
      6 Charms), Larceny (two root lines, `theft-of-face` →
      `solar-impersonation-style` and `cunning-criminal-style` →
      `striking-snake-grab`, 9 Charms), and Stealth
      (`concealing-distraction-discipline` → `unseen-wisp-method`,
      7 Charms).
    - **Moonshadow Caste** (pp. 212-223): Bureaucracy
      (`authority-eroding-technique`/`corruption-sensing-scrutiny` →
      `iron-tyrant-mien`, 7 Charms), Linguistics (two root lines,
      `language-absorbing-method` → `words-beneath-a-whisper` and
      `blood-inscription-technique` → `scathing-cynic-attitude`,
      9 fully-verified Charms plus 1 unresolved placeholder for
      `corpus-rending-blow`, 10 rows total), Ride (`soul-reins` → ...
      → `foundering-foal-gesture`, 7 Charms), Sail
      (`master-sailors-memory` → `unsinkable-derelict-preservation`,
      9 Charms), and Socialize (`exquisite-etiquette-style` /
      `passion-unveiling-glance` → `intimations-of-mortality`, 7 Charms).
    - **Caveat**: a handful of rows have summary text copied verbatim from
      the book's prose that labels more than one Charm as a tree
      "capstone" in the same Ability line (notably in Dusk Caste Melee
      around `attunement-shattering-block`/`eye-of-the-tempest`, and the
      Daybreak Medicine sub-tree numbering jumps from "second" to
      "third" without an identified second sub-tree). These rows are
      individually accurate to the page but the exact tree-branch
      topology in those spots has not been fully disambiguated — flagged
      for a dedicated review pass before any of this content is promoted
      to a production catalog. Two Day/Moonshadow rows
      (`soaring-raptor-prana`, `striking-snake-grab`) are marked
      `unreviewed` because their full rules-text paragraphs were not
      legibly captured; their headers/costs/prerequisites are confirmed.
  - **Chapter Six: The Arts of the Dead** — the necromancy framework
    overview (three circles: Shadowlands, Labyrinth, Void, paralleling
    Terrestrial/Celestial/Solar Circle Sorcery) plus all **9 Shadowlands
    (First) Circle spells**: Hungry Creeping Shadow, Iron Countermagic,
    Piercing the Shroud, Raise the Skeletal Horde, Rune of Sweet Passing,
    Shade Prison Amulet, Soul Brand, Summon Ghost, and Walking War Machine
    (pp. 222-227, PDF 223-228).

## What's still needed

1. Chapter Six necromancy: the **Labyrinth (Second) Circle** and **Void
   (Third) Circle** spell lists remain, past printed p. 227 / PDF 228.
   **Resume with the Labyrinth Circle** (already partially visible via the
   `Raise the Skeletal Horde` spell's cross-reference to `Call the Greater
   Servitor` and `Exquisite Undead Aide`). The specific gating Charm named
   per circle (e.g. "Shadowlands Circle Necromancy") was not found as its
   own stat block in the rendered pages and needs a follow-up look.
2. The Craft (Necrosurgery/Jadecrafting/Soulforging/Moliation/Pandemonium)
   rules referenced but not detailed in Chapter Four.
3. Resolve the `corpus-rending-blow` unresolved placeholder (Moonshadow
   Linguistics) — find its actual write-up or confirm it is an errata/
   cross-reference slip in the source book.
4. Necromancy-heavy supplements (*Blood and Salt*, *Book of Bone and Ebony*)
   if their Abyssal-facing mechanics are in scope.
5. Merits/Flaws specific to Abyssals, if any exist beyond the standard set —
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
