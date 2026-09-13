# Exalted 1e — Sidereal source intake

**Status: source intake in progress.** `Exalted: The Sidereals` has been
supplied and 38 inventory rows are checked in under `inventory/`. See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory follows.

## What's inventoried so far

- `source-manifest.json` — the one source book in scope so far
  (`exalted-the-sidereals`); no supplements are added yet.
- `inventory/exalted-the-sidereals.json` — 38 rows covering:
  - The Chapter Three character-creation overview (Attributes/Abilities/
    Backgrounds/Charms/Colleges/Virtues/Willpower/Essence), including the
    reduced-scope Ronin Sidereal variant.
  - The five Auspicious-Ability groups tied to the celestial constellations
    (Journey, Serenity, Battle, Secret, Ending Abilities) and the Celestial
    Hierarchy's baseline Ability minimums.
  - The universal, caste-agnostic Anima Effect (Caste Mark flare, anima
    flare, sensing gateways to Heaven).
  - All five Castes (Chosen of Journeys, Serenity, Battles, Secrets, Endings)
    with their Anima Banners, Anima Effects, Auspicious Abilities,
    Associations, Sobriquets, and Concepts.
  - Arcane Fate — the Sidereal signature trait mechanic (a passive
    forgetting/disguise effect, not a rated Limit-Trait analog) — and its
    associated Sidereal Anima Banner visibility/Paradox table.
  - The Craft (Fate) Ability specialty.
  - The altered Backgrounds (Allies, Artifact, Backing, Familiar, Manse) and
    the new Backgrounds exclusive to Sidereals (Acquaintances, Celestial
    Manse, Connections, Salary, Savant, Sifu).
  - **Chapter Five's general Charm framework (9 rows, pp. 128-132, PDF
    131-135)**: Manipulating Fate (the core dice-pool/target-number rules
    that make Sidereal Charms strictly weaker than Solar Charms at raw
    dice inflation but strong at target-number reduction and perfect
    success, plus the Sidereal Martial Arts exception that reverts to
    Solar-style Charm rules), Creatures Outside of Fate (Primordials/Yozis/
    Malfeans/Deathlords/Second-and-Third-Circle demons' partial immunity),
    Restricted Charms (Maiden-authority Charms requiring a Celestial
    Bureaucracy petition for non-Sidereals), Unusual Charms (the
    stunt-based-Charm-repurposing note), Matters of Personality (the four
    Virtue-linked Charm-supplement categories), Prayer Strips (the
    Sidereal-specific Charm-fuel item: crafting cost, concealment,
    infused-strip soak/health/dodge stats, and audit/censure risk for
    misuse), Spotting Active Prayer Strips (the detection-range mechanic;
    the underlying difficulty table itself was not transcribed row-by-row),
    On Memory (how Sidereal Charms alter perceived normalcy rather than
    memory itself), and the Presentation Format note (confirms Sidereal
    Charms use the same Cost/Duration/Type/Minimum Ability/Minimum
    Essence/Prerequisite Charms format as Solar Charms).
  - **The complete Journeys Caste Endurance tree ("The Mast," 7 Charms,
    pp. 132-134/PDF 135-137)**: Ox-Body Technique (Sidereal), Unswerving
    Juggernaut Principle and Optimistic Security Practice and Unwavering
    Well-Being Meditation (three parallel roots), Forward-Thinking
    Technique (from Unswerving Juggernaut Principle), Heartless Maiden
    Trance (from Optimistic Security Practice + Unwavering Well-Being
    Meditation), and the capstone One Direction Invocation (from
    Forward-Thinking Technique + Heartless Maiden Trance).

## What's still needed

1. **24 of the 25 Ability-line Charm trees** (5 Castes x 5 Auspicious
   Abilities each, following the same per-Ability "Scripture" + tree-diagram
   format as the completed Endurance tree above) remain uninventoried.
   **Resume with the Journeys Caste's second tree, "Ride: The Messenger"
   (Ordained Bridle of Mercury → Spirit-Shape Companion → Godly Companion →
   Breaking the Wild Mortal/Riding the Dragon, also fed by side branches
   Yellow Path and Glory Path), starting at printed p. 134/PDF 137**,
   immediately after One Direction Invocation.
2. Sidereal Martial Arts forms/Charms, referenced by the Sifu Background and
   explicitly called out in the Manipulating Fate framework as following
   Solar Charm rules instead of the restricted Sidereal rules above — not
   yet located/inventoried.
3. The Colleges / astrology system in full (the Charm-tree equivalent for
   Sidereal sorcery-adjacent magic); only the character-creation point-buy
   rule (7 dots, at least 4 in the character's own Maiden's Colleges) is
   captured so far.
4. Resplendent Destinies (pp. 215-218) — referenced repeatedly from the
   Arcane Fate mechanic as the means by which a Sidereal can bypass her own
   Arcane Fate, but not yet rendered or inventoried in its own right.
5. Merits/Flaws specific to Sidereals, if any exist beyond the standard set
   — not yet checked.

Note: the Sidereal Curse (this splat's expression of the Great Curse) is
confirmed to have no discrete mechanical trigger of its own — the book states
outright that it "has no mechanical aspect and is, instead, a matter entirely
for roleplaying" (Storytelling chapter, p. 253) — so no row was created for
it. See `rulesNotes` in `source-manifest.json` for the citation.

Note: the Dragon-Blooded import already cites this same book once for a
single externally-sourced Dragon-Blooded spell (`open-the-spirit-door`),
flagged `external-source` because the Sidereals PDF was not supplied at the
time (`docs/references/exalted1e/dragon-blooded/source-manifest.json`). That
spell is Dragon-Blooded catalog content, not a Sidereal inventory row — it
does not satisfy any part of this family's inventory and was not touched.

## Do not add yet

- Do not add a production catalog under `src/games/exalted1e/reference/` for
  this family — that only happens after inventory rows are visually reviewed
  against the rendered source page.
- Do not add `sidereal` to `exaltedSheetTypes` in
  `src/games/exalted1e/definitions.ts` — that stays out of scope until all
  five planned families are certified together.
