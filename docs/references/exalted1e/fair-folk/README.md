# Exalted 1e — Fair Folk source intake

**Status: source intake in progress.** `Exalted: The Fair Folk` has been
supplied and 152 inventory rows are checked in under `inventory/`. See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory follows.

## What's inventoried so far

- `source-manifest.json` — the one source book in scope so far
  (`exalted-the-fair-folk`); supplements are not yet added.
- `inventory/exalted-the-fair-folk.json` — 152 rows covering:
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
  - **Two of Chapter Five's five per-Grace Charm trees, in full** (26 Charm
    rows from an earlier round):
    - The **Heart Grace tree** (shinma Nirguna; pp. 155-159, PDF 156-160):
      Name Charms (`imposition-of-law`, `bastion-of-the-self`);
      Bedlam-Influencing Charms, a tree that unusually draws its branches
      from all five Graces (`spectacular-insanity` as the Heart root, then
      `ambrosial-ascension` [Cup], `bedlam-masterworks` [Ring],
      `driven-madness` [Staff], `raging-vortex-form` [Sword]); Dodge
      Charms (`ill-approving-eyes` → `assertion-of-a-greater-vision` +
      `sapphire-emptiness-kata` → `howling-dream-consumption-prana`); and
      Resistance Charms (`writhing-ego-evasion` →
      `swallowed-grace-defense` / `pyre-of-dreams-defense`).
    - The **Staff Grace tree** (shinma Nirvikalpa; pp. 193-196, PDF
      194-197): the 10-Charm "Laughing Monster Style" combat tree
      (`furiously-stalling-destiny` → `deeper-into-trouble-technique` →
      `laughing-monster-stance` → three parallel lines
      [`unitary-being-forge` → `shuffling-the-pieces`;
      `inauspicious-moment-for-attack` → `subtle-hammer`;
      `thieves-fall-out` → `poisoned-whispers`] → all converging on
      `dancing-wind-monster-transformation`); and the separate 2-Charm
      "Society-Forging Charms" tree (`oath-gossamer` →
      `eight-corner-ring-binding`), which raksha use to bind themselves
      into gossamer-producing relationships and alliances.
  - **The Cup Grace tree, in full** (shinma Dharma; pp. 159-171, PDF
    160-172; 48 new Charm rows this round), the third of the five per-Grace
    trees:
    - **Cup Combat Charms** (19 Charms): two independent roots,
      `heart-cutting-style` (→ `untouchable-performer-technique` →
      `swift-wings-of-song` → `furious-maelstrom-craft`; and →
      `dissonance-of-principles` → `thousand-tiny-hooks-technique` →
      `beguilement`, a Staff-shaping crossover Charm) and
      `subversion-and-transformation-artifice` (→
      `overriding-construct-of-fate`); plus a named sub-style within the
      same section, "Spirit-Twisting Obsession Style"
      (`elusive-object-of-desire` → `art-of-corrosion` →
      `spirit-twisting-obsession-stance` → three parallel lines
      [`decaying-principles` → `twisting-spiral-of-collapse`;
      `subtle-breath-of-ruin` → `insidious-distraction-technique`;
      `encouraging-futile-struggle` → `brilliant-glinting-lure`] → all
      converging on `eulogy-for-greatness-lost`).
    - **Feeding Charms** (9 Charms): the ravishment-based tree raksha use
      to feed on Creation, rooted at `ravishing-the-created-form` (→
      `soul-carving-artifice` → `devouring-wings-of-the-wyld`;
      `heart-stealing-kiss`; `extruded-stomach-feeding`; with
      `soul-carving-artifice` + `extruded-stomach-feeding` together
      feeding both `soul-consuming-hunger` and `banquet-of-crumbs` →
      `oneiromantic-conjuration` → `demesne-farming-art`). Includes the
      "THE ENCHANTED" sidebar rules (documented in
      `ravishing-the-created-form`'s notes) for what happens to
      Creation-born victims drained to a Virtue or Willpower rating of 0.
    - **Addiction Charms** (4 Charms): `shiftless-untamed-beauty` →
      `compelling-presence`, plus the separate root `maddening-summons`,
      both converging on `whispers-behind-the-eyes`.
    - **World-Shaping Charms** (11 Charms, the "core Charms for glamour
      sorcery"): two independent roots, `gladdening-visage` (→
      `adored-by-all-the-worlds`, `abandoned-by-all-creatures-curse`,
      `spite-summoning-malediction` [a Staff-shaping crossover]) and
      `heaven-rains-wisdom` (→ `the-naming-of-secrets`,
      `fall-of-night-shadows-the-truth`, `unlimited-resplendence`,
      `prince-and-pauper-approach` [a Staff-shaping crossover]), with
      `abandoned-by-all-creatures-curse` + `fall-of-night-shadows-the-truth`
      + `prince-and-pauper-approach` together feeding twin capstones
      `abiding-gift` and `curse-of-definition`.
    - **Virtue-Shaping Charms** (5 Charms): `unsightly-rigor-approach` →
      `wyld-prince-resilience` and → `manacles-of-virtue` → both
      `chaotic-soul-sledgehammer` and `torn-spirit-mending-technique`.
    - Four Charms in this tree (`beguilement`, `spite-summoning-malediction`,
      `prince-and-pauper-approach`, plus one in the Ring tree below,
      `undetectable-lie`) are explicitly Staff-gated ("Minimum Staff: N")
      and self-declared "Staff-shaping Charm[s]" despite branching directly
      off Cup (or Ring) Charms — the same cross-Grace pattern already noted
      for the Heart tree's Bedlam-Influencing Charms; each has a `notes`
      flag calling this out.
    - Two minor diagram/header spelling mismatches are flagged with
      `notes` on the affected rows as a precedent-following ambiguity: the
      Cup Combat Charms tree diagram labels one box "Swift Winds of Song"
      where the Charm's own header reads "Swift Wings of Song"
      (`swift-wings-of-song`), and the Ring Combat Charms tree diagram
      labels one box "Impinging Web of Dreams" (plural) where the Charm's
      own header reads "Impinging Web of Dream" (singular)
      (`impinging-web-of-dream`).
  - **The Ring Grace tree's first three named sub-sections** (shinma
    Nirvishesha; 30 new Charm rows this round):
    - **Ring Combat Charms** (pp. 171-175, PDF 172-176; 16 Charms): two
      independent roots, `flesh-carved-world` (→ `shuddering-wyld-inference`
      → `waypoint-knife` + `minds-grip-rigor`; and → `creators-fugue` →
      `impinging-web-of-dream`; and → `crippling-destiny-burden`, an explicit
      anti-Sword-caste counter-Charm) and `wyld-curdling-attack` (→
      `endless-yawning-void`, `luminous-exhalation` → `these-dreams-are-clay`,
      `twisting-serpent-shape`, `gaping-wound-lens`,
      `pounding-dream-harmony`), with `waypoint-knife` +
      `pounding-dream-harmony` converging on `sorrowful-firmament-resonance`
      → `undetectable-lie` (the tree's Staff-shaping crossover finale). This
      is the first point in the inventory where Cup/Ring/Staff-shaping
      Charms are consistently interchangeable options on the same Charm text
      (nearly every Ring Combat Charm reads "Ring-shaping or
      Staff-shaping"), not just an occasional crossover leaf.
    - **All-Consuming God-Monster Style** (pp. 175-178, PDF 176-179; 6
      Charms): a Stance-type transformation tree, rooted at `wyld-communion`
      → `spirit-flaying-meditation` → two branches
      (`being-nonbeing-approach`; `all-consuming-god-monster-stance`, the
      purchasable "God-Monster Body" Stance Charm with a paraphrased sample
      gift menu → `nature-eliminating-knife`) reconverging on the capstone
      `chimera-exultation`, which utterly destroys the raksha who casts it as
      a Storyteller-controlled plot device. `chimera-exultation`'s mechanics
      text is displaced ahead of its own header in the PDF's raw
      text-extraction order (it reads as if attached to the "Body-
      Strengthening Charms" section instead); this was confirmed against the
      rendered page image and flagged in that row's `notes`.
    - **Body-Strengthening Charms** (pp. 178-180, PDF 179-181; 5 Charms):
      `knife-hand-dream` → `opalescent-gossamer-raiment` →
      `blade-turning-skin` → `inviolable-presence` (a linear, stacking
      natural-soak progression), plus the standalone, diagrammatically
      unconnected `ox-body-technique` (purchasable up to the raksha's Ring
      rating, distinct from the shaping-combat `wyld-prince-resilience`
      already inventoried in the Cup Grace tree).
    - **Creation-Based Crafting** (pp. 180-181, PDF 181-182; 3 Charms):
      `ordinary-object-conjuration` → two parallel branches,
      `limitless-wealth-conjuration-technique` and `hateful-coin-curse`.
    - **Glamour Charms, first tree** (pp. 181-185, PDF 182-186; 14
      Charms): two independent roots, `essence-forging-art` (→
      `principle-of-worlds`, `gossamer-forging-art` → `crafters-arsenal`;
      with `gossamer-forging-art` + `principle-of-worlds` together
      feeding `translucent-dream-sheathing-technology`) and
      `awakened-dream-manufacture` (→ `shape-forged-servant` →
      `poppet-integrating-spirit`, `tainted-creature-command`), with
      `translucent-dream-sheathing-technology` + `shape-forged-servant`
      together feeding `glamour-charm` (named simply "Glamour" in the
      book) → `monstrous-conceit` (a Staff-shaping crossover Charm that
      also requires the existing `undetectable-lie` Ring Combat Charm)
      and `burden-ghost-glamour`; plus the standalone, diagrammatically
      unconnected pair `workers-gift` → `style-improving-spirit`.

## What's still needed

1. **Two of Chapter Five's five per-Grace Charm trees remain, plus the last
   section of the Ring Grace tree**: the Ring Grace tree (shinma
   Nirvishesha, pp. 172-192 / PDF 173-193 — by far the largest of the five)
   now has Ring Combat Charms, All-Consuming God-Monster Style,
   Body-Strengthening Charms, Creation-Based Crafting, and the first
   Glamour Charms tree inventoried. Still needed: the "**Greater Arts of
   Glamour**" sub-section (pp. 185-192 / PDF 186-193 — three further
   diagrammed trees covering `forging-the-heart-grace`, the four "Forging
   the (Grace) Grace" Charms that let raksha grant Grace Traits to
   Creation-born characters, the Freehold-anchoring Forging the
   Stronghold/Glory/Fountainhead/Throne Room Charms, and capstone
   artifact/behemoth-creation Charms). After the Ring tree finishes, the
   Sword Grace tree remains entirely (shinma Nishkriya, pp. 196-203 / PDF
   197-204 — Sword Combat Charms plus a "Mutation Charms" section of sample
   mutations). **Resume with the Greater Arts of Glamour sub-section at
   printed p. 185 / PDF 186** (immediately after `burden-ghost-glamour` and
   `monstrous-conceit`, the last Charms of the first Glamour tree
   inventoried this round), in that page order (rest of Ring, then Sword).
2. The universal, non-Grace-gated Assumption-type Charm tree (shinma
   Nirakara, "the Mask"; pp. 148-155 / PDF 149-156) that lets any raksha
   take shape and exist within Creation at all — not yet inventoried.
   Referenced by several existing rows (e.g. `birth-background`,
   `innate-powers-wyld-immunity`) but not itself covered.
3. Glamour Sorcery, Wyld Artifacts, and Adjurations (pp. 205-210 / PDF
   206-211) and Behemoths (pp. 210-212 / PDF 211-213) — not yet
   inventoried.
4. A short, apparently sixth Grace called "the Way" (shinma Nirupadhika)
   surfaces on p. 212 (PDF 213), just before Chapter Six, with a "Forging
   the Way Grace" Charm and a "Perfect Reckoning Technique" Charm. It sits
   outside the five-Grace model (Cup/Ring/Staff/Sword/Heart) used
   throughout the rest of this inventory and has not been reviewed or
   reconciled with that model yet — flagged for dedicated review in a
   future pass, likely alongside item 3 above.
5. The Storyteller-only "unshaped" Charm-suggestion sidebar in Chapter
   Three (pp. 96-97 / PDF 97-98) — full of specific named Charms for
   building unshaped NPCs, and explicitly GM-facing, not a player-facing
   creation rule. Deliberately **excluded from scope**, not merely
   deferred.
6. Chapter One: Rakshastan (setting/geography — Freeholds, the
   Middlemarches, the Five Courts, the Church of Balor as story-hook
   flavor) and Chapter Two: The Raksha (broader lore) — not yet
   inventoried; only the character-creation-relevant mechanical content
   from Chapters Three and Four (plus the general-rules content, two full
   per-Grace Charm trees, and one Ring Grace sub-section now covered from
   Chapter Five) is covered so far.
7. Chapter Six: The Mountain Folk (a separate non-raksha playable-adjacent
   race) and Chapter Seven: Storytelling — not yet inventoried, and not
   necessarily in scope for the Fair Folk sheet family at all.
8. Merits/Flaws specific to Fair Folk — checked again this round (the
   edges of Chapters Three and Four where Backgrounds live, and the
   general-rules portion of Chapter Five); still not found anywhere in the
   chapters reviewed so far. May not exist as a distinct section in this
   book at all; keep checking as the remaining Charm trees and chapters
   are reviewed.

## Do not add yet

- Do not add a production catalog under `src/games/exalted1e/reference/` for
  this family — that only happens after inventory rows are visually reviewed
  against the rendered source page.
- Do not add `fair-folk` to `exaltedSheetTypes` in
  `src/games/exalted1e/definitions.ts` — that stays out of scope until all
  five planned families are certified together.
