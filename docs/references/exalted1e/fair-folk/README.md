# Exalted 1e — Fair Folk source intake

**Status: source intake in progress.** `Exalted: The Fair Folk` has been
supplied and 34 inventory rows are checked in under `inventory/`. See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory follows.

## What's inventoried so far

- `source-manifest.json` — the one source book in scope so far
  (`exalted-the-fair-folk`); supplements are not yet added.
- `inventory/exalted-the-fair-folk.json` — 34 rows covering:
  - The Chapter Three character-creation overview, split into two rows
    because common and noble raksha use materially different baselines:
    `fair-folk-creation-overview-common` (0-dot starting Attributes, 0 free
    Background dots, 1 Favored Ability, a single feeding Virtue/Grace/caste)
    and `fair-folk-creation-overview-noble` (3-dot starting Attributes, 10
    free Background dots, 3 Favored Abilities, two feeding Virtues/Graces/
    castes).
  - The four base castes — Diplomat (Staff/Conviction), Entertainer
    (Cup/Compassion), Warrior (Sword/Valor) and Worker (Ring/Temperance) —
    each with its Caste Abilities, Grace, Controlling Grace, Associations
    and Sobriquets.
  - `noble-castes-hybrid`, a single consolidated row covering all twelve
    named noble hybrid archetypes (the ascendant/shadowed pairing of each
    pair of base castes: Anarch, Luminary, Panjandrum, Artisan, Courtier,
    Xia, Eshu, Imperial Raksha, Strategos, Scribe, Ornamental Raksha,
    Cataphract).
  - The five Graces — Cup, Ring, Staff, Sword and Heart — each with its full
    dot-by-dot rating table, plus a `graces-overview` row covering the
    general forging/ownership/breaking rules that apply to all of them.
  - Bedlam, the raksha's Limit-Trait analog: a `bedlam-overview` row for the
    channel-spending/Lure general rules, and a `virtue-bedlam-curses` row
    covering all four Virtue-specific Curses (Hubris/Compassion,
    Namelessness/Conviction, Alienation/Temperance, Meekness-or-Terror/
    Valor) with their triggers, recovery conditions and sample Lures.
  - The five new Fair Folk Backgrounds — Birth, Freehold, Gossamer, Retinue
    and Style — each with its full dot table.
  - The altered Backgrounds — Artifact, Familiar, Manse, and Backing/
    Contacts/Influence — plus the Followers-and-Resources exclusion (raksha
    do not use those two Backgrounds at all; they use Retinue and Gossamer
    instead).
  - A set of core signature mechanics: innate immunity to sub-real Wyld
    damage (with the offensive shaping-attack extension for nobles/heroic
    commoners), the Craft (Glamour) specialty, Wyld Stunts and Wyld Bonuses,
    the Gossamer-and-Glamour Charm-fuel mechanic (works of glamour,
    permanent glamours, true names), Mutation (converting Charms into
    permanent traits), Shaping Actions and Reality Shaping (the general
    once-per-scene innate action), Shaping Combat basics (Heart 2+
    requirement, shaping weapons, initiative, attacker/defender flow),
    Oaths, and Cold-Wrought Iron.

## What's still needed

1. Chapter Five's per-Grace Charm trees (not yet inventoried at all) —
   deliberately out of scope for this pass, matching how the Abyssal
   inventory deferred Chapter Five's Charm trees. Only the top-level
   mechanical-overview rows that govern how Fair Folk magic works (shaping
   actions, shaping combat, gossamer/glamour, mutation) are inventoried
   here.
2. The Storyteller-only "unshaped" Charm-suggestion sidebar in Chapter
   Three (pp. 96-97 / PDF 97-98) — full of specific named Charms for
   building unshaped NPCs, and explicitly GM-facing, not a player-facing
   creation rule. Not inventoried, consistent with the Charm-tree
   exclusion above.
3. Chapter One: Rakshastan (setting/geography — Freeholds, the
   Middlemarches, the Five Courts, the Church of Balor as story-hook
   flavor) and Chapter Two: The Raksha (broader lore) — not yet
   inventoried; only the character-creation-relevant mechanical content
   from Chapters Three and Four (plus the general-rules portion of Chapter
   Five) is covered so far.
4. Chapter Six: The Mountain Folk (a separate non-raksha playable-adjacent
   race) and Chapter Seven: Storytelling — not yet inventoried, and not
   necessarily in scope for the Fair Folk sheet family at all.
5. Merits/Flaws specific to Fair Folk, if any exist beyond the standard
   set — not found in the chapters reviewed so far.

## Do not add yet

- Do not add a production catalog under `src/games/exalted1e/reference/` for
  this family — that only happens after inventory rows are visually reviewed
  against the rendered source page.
- Do not add `fair-folk` to `exaltedSheetTypes` in
  `src/games/exalted1e/definitions.ts` — that stays out of scope until all
  five planned families are certified together.
