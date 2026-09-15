# Exalted 1e — Fair Folk source intake

**Status: source intake in progress.** `Exalted: The Fair Folk` has been
supplied and 351 inventory rows are checked in under `inventory/`. The book
has now been reviewed cover to cover — every one of its seven chapters has
either been fully inventoried (Three, Four, Five) or triaged (One, Two, Six,
Seven) — and Fair Folk Merits/Flaws are definitively confirmed absent
anywhere in the book. That universal gap is now filled from a second source
book, the **Exalted Players Guide**'s Chapter One, "Merits and Flaws" — 73
rows (37 merits + 36 flaws) derived for Fair Folk from Lunar's
already-verified transcription of that chapter. A later pass added two more
small, universal artifact catalogs: 6 rows derived from Lunar's
already-verified transcription of the **Exalted Storyteller's Companion**'s
"Further Wonders" chapter, and 9 rows freshly transcribed from **Savage
Seas**'s "Artifacts of the Waves" section (336 → 351 rows total). See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory follows.

## What's inventoried so far

- `source-manifest.json` — four source books in scope: `exalted-the-fair-folk`
  (the primary sourcebook), `exalted-players-guide` (the universal
  Merits/Flaws chapter, derived rather than independently transcribed; see
  below), `exalted-storytellers-companion` (a universal artifact catalog,
  also derived from Lunar's transcription), and `savage-seas` (a universal
  naval-artifact catalog, freshly transcribed).
- `inventory/exalted-the-fair-folk.json` — 351 rows covering:
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
    - **Greater Arts of Glamour** (pp. 185-192, PDF 186-193; 18 Charms),
      which finishes the entire Ring Grace tree: `forging-the-heart-grace`
      (root, off `shape-forged-servant`) branches to the four
      "Forging the (Grace) Grace" Charms (`forging-the-cup-grace`,
      `forging-the-ring-grace`, `forging-the-staff-grace`,
      `forging-the-sword-grace`, each letting a raksha grant a
      Creation-born character one Grace as an artifact, with a matching
      Curse if that Grace is later stripped or destroyed) and to
      `forging-the-arcane-redoubt` (which anchors a Freehold's eternal
      "bonefire" and in turn branches to the four parallel Freehold-anchor
      Charms `forging-the-stronghold`/`forging-the-glory`/
      `forging-the-fountainhead`/`forging-the-throne-room`, each pairing
      one of the four Grace-granting Charms with the Redoubt). All four
      Grace-granting Charms together also feed `gaping-virtue-mouth` (→
      `iron-nightmare-muzzle`, `ecstatic-reproduction-style`, and the
      Staff-shaping crossover `akshata-sexual-methodology`).
      `forging-the-heart-grace` additionally feeds the consolidated
      `great-works-of-the-grace` row (Great Works of the Cup/Ring/
      Staff/Sword, packed into one row the way `bastion-of-the-self`
      packs its four Grace variants) → the consolidated
      `unshaped-grace-transformation` row (its four Cup/Ring/Staff/Sword
      variants) → the Sword-crossover `behemoth-forging-meditation` (also
      requiring `shape-forged-servant`) and the self-annihilating
      capstone `extinction-of-desire`.
  - **The Sword Grace tree, in full** (shinma Nishkriya; pp. 196-205, PDF
    197-206; 42 Charms), the fifth and final per-Grace Charm tree — **all
    five of Chapter Five's per-Grace Charm trees (Heart, Staff, Cup, Ring,
    Sword) are now completely inventoried**:
    - Two independent roots, `god-humbling-victory-sword` (→
      `scourging-wind-raid` → `dream-sacrificing-method`;
      `unparalleled-terror-technique`; `pincer-of-transcendent-time-and-fate`
      → `endless-armies-of-the-storm`) and
      `host-summoning-glory-of-command` (→ `sundering-the-gates-of-death`;
      `transient-work-of-flesh-and-bone`).
    - A third root, `scattering-the-foe`, feeding two further lines:
      `radiance-of-the-invincible-warrior` (→ `waypoint-sealing-technique`;
      `unconquerable-truth`), with `sundering-the-gates-of-death` +
      `radiance-of-the-invincible-warrior` converging on
      `rarefied-air-of-inevitable-victory`, and `unconquerable-truth` +
      `rarefied-air-of-inevitable-victory` converging on the capstone
      `defining-the-parameters-of-battle`; and
      `all-inclusive-nightmare-defense` → `tension-building-warriors-advance`
      → `fearsome-mien`.
    - The named sub-style "**World-Devouring Warlord Style**" (9 Charms):
      `aegis-of-a-martial-destiny` (root) → two branches
      (`antagonist-naming-technique`; `thematic-stunting-methodology`)
      converging on `world-devouring-warlord-stance` (a Stance-type
      Charm), which in turn feeds `gathering-the-crows` (a cross-tree
      convergence with `transient-work-of-flesh-and-bone`),
      `army-supporting-behemoth-invocation`, and
      `harmony-of-fortune-and-hate`; `gathering-the-crows` +
      `army-supporting-behemoth-invocation` converge on `avatar-of-war`,
      which together with `harmony-of-fortune-and-hate` feeds the
      capstone `preemptive-declaration-of-victory`.
    - One diagram/header naming mismatch flagged in `notes`: the "Sword
      Combat Charms 2" tree diagram labels one box "Waypoint Sealing
      Stance," but the Charm's own header and stat block both read
      "Waypoint-Sealing Technique" with Type: Reflexive
      (`waypoint-sealing-technique`).
    - **Mutation Charms** (pp. 202-205, PDF 203-206; 15 Charms): a set of
      individually purchasable Charms of Shape rather than a branching
      combat tree — nearly all `Prerequisite Charms: None`
      (`pox-charm`, `affliction-charm`, `blight-charm`,
      `long-arm-technique`, `gossamer-wing-flight`,
      `hiding-the-wylds-touch`, and the mutation-point-cost permanent
      afflictions `armament-of-flesh`, `surpassing-excellence`,
      `glorious-hero-form`, `racing-dragon-speed`,
      `root-of-the-perfected-lotus`), except the one linear sub-line
      `hundred-hand-style` → `millipede-mind` → two branches
      (`grace-of-the-infinite-revolving-spheres`;
      `harmonious-primordial-spirit`), which explicitly stack with their
      own prerequisites rather than superseding them. `racing-dragon-speed`
      is flagged in `notes` as an outlier: it is repurchasable up to once
      per dot of the raksha's **Compassion**, not her Sword or Valor like
      every other repurchasable Charm in this Sword-Grace section.
- **The universal, non-Grace-gated Assumption-type Charm tree, in full**
  (shinma Nirakara, "the Mask"; pp. 149-155, PDF 150-156; 21 Charms) — the
  Charms every raksha uses to take shape and exist within Creation at all,
  with no minimum Grace requirement of their own:
  - Two independent gateway roots, `assumption-of-elemental-shape`
    (consolidated 5-variant row for Air/Earth/Fire/Water/Wood, matching
    `bastion-of-the-self`'s precedent) and
    `assumption-of-cerements-and-bone` (lets a raksha exist within the
    Underworld, treated as dead for all effects).
    `assumption-of-elemental-shape` branches to
    `assumption-of-the-persons-heart` (tainting a single visible creature)
    and `assumption-of-the-lands-heart` (tainting a hamlet-sized region by
    sinking the raksha's Heart Grace into the land), which in turn
    branches to `assumption-of-the-citys-heart` and
    `assumption-of-the-living-kingdom` (larger regions), with
    `assumption-of-the-citys-heart` further feeding
    `assumption-of-the-wyld-tainted-land` (claiming a fading Bordermarches
    region). `mad-god-mien` (a permanent, universally-gated "Any
    Assumption-type Charm" prerequisite rather than one specific Charm)
    makes the raksha wholly alien to Creation and is cross-referenced by
    the Ring Grace tree's `extinction-of-desire`, resolving a forward
    reference from an earlier round.
  - The **Elemental Influence** sub-tree (3 further branches off
    `assumption-of-elemental-shape`): `sovereign-elemental-shape` →
    `element-weaving-style` → `elemental-invocation`;
    `world-angering-elemental-mastery` → `teeth-of-the-world` (five
    elemental attack abilities, one per element); and
    `elemental-transformation` (a repeatable Charm building alternate
    animal/elemental forms directly out of already-inventoried Sword Grace
    Mutation Charms like Gossamer Wing Flight and Armament of Flesh), with
    `sovereign-elemental-shape` + `elemental-transformation` converging on
    `mercurial-shape`.
  - The **Emotional Influence** sub-tree (explicitly framed in the book as
    "an example of the type" of personalized non-elemental Assumption-type
    Charm tree a raksha can build): `assumption-of-dreams-and-passion`
    (root) → `elegant-muse-attitude` → `emotion-weaving-style` →
    `emotional-invocation`; and `unwanted-obsession-provocation-technique`
    → `essence-disrobing-passion`, direct emotional-Essence parallels of
    the Elemental Influence Charms above.
  - One naming-slip flagged in `notes`: `assumption-of-the-wyld-tainted-land`'s
    own text says it "functions as Assumption of the Kingdom's Heart," but
    no Charm of that exact name exists anywhere in the book; its stated
    Prerequisite Charms line and the tree diagram both confirm it actually
    branches off `assumption-of-the-citys-heart`, so the reference is
    treated as a naming slip rather than corrected or reinterpreted.
  - The "Vexing" rules (Effects of Damage, Vexing, Vexing Places, Vexing
    the Unshaped, and Vexing Creatures of Creation, folded into one
    `vexing-mechanic` row) and the "Questing" sidebar (raksha ritually
    dueling the unshaped in the Deep Wyld for artifacts/spells/servants,
    `questing-sidebar`) — both on pp. 147-148/PDF 148-149, immediately
    before the Assumption-type Charm tree. The Sword Grace's
    shaping-weapon stat table (Entanglement, Extras, Hazard, Horror,
    Monster, Mutant Warleader, Nishkriya Mask, Personal Prowess) on the
    same page was deliberately not inventoried as its own row, matching
    the individual-shaping-weapon exclusion already applied to
    `shaping-combat-basics`.
  - **The rest of Chapter Five: Raksha Magic** (26 rows, pp. 205-211/PDF
    206-212), which completes the chapter end to end:
    - **Glamour Sorcery** (pp. 205-207/PDF 206-208; 7 rows): the raksha's
      Artifact-Background-purchased spell system, bound to the aspects of
      Dharma (the Cup) and cast by a lorekeeper who may not be the spell's
      owner (`glamour-sorcery-overview`, folding in the "Spell Abilities"
      subsection), the "Glamour Sorcery and Countermagic" sidebar
      (`glamour-sorcery-countermagic`), and the five named Circle tiers as
      purchasable options — `waking-circle-spell` (Artifact •),
      `dreaming-circle-spell` (Artifact ••), `desire-circle-spell`
      (Artifact •••), `samadhi-circle-spell` (Artifact ••••, restricted to
      a raksha who owns his own Heart Grace), and `shinma-circle-spell`
      (Artifact •••••).
    - **Wyld Artifacts** (pp. 207-208/PDF 208-209; 4 rows): the
      Ring-forged-treasure category (`wyld-artifacts-overview`) plus three
      named examples — `resonant-chorus-bow` (Artifact •),
      `hundred-color-shaping-lens` (Artifact ••), and `artifact-waypoint`
      (Artifact •••+, an enchanted mobile Ring-shaping weapon built from
      one or more waypoints).
    - **Adjurations** (pp. 208-210/PDF 209-211; 7 rows): the
      unbreakable-oath category bound to Nirvikalpa (the Staff)
      (`adjurations-overview`), the "How Inconvenient Are a Raksha's
      Oaths?" framing sidebar (`adjurations-how-inconvenient-sidebar`),
      and the five named oath tiers, each aspected to one of the five core
      Graces — `samhara-oath` (Artifact •, Sword), `sthiti-oath` (Artifact
      ••, Ring), `anugraha-oath` (Artifact •••, Cup), `tirobhava-oath`
      (Artifact ••••, Staff), and `srishti-oath` (Artifact •••••, Heart).
    - **Behemoths** (pp. 210-211/PDF 211-212; 5 rows): the Sword-aspected
      monstrous-companion-artifact category plus the "Behemoth Powers"
      subsection (`behemoths-overview`), three named tiers —
      `fey-beast` (Artifact • or ••), `daikaiju` (Artifact •••), and
      `deep-wyld-horror` (Artifact •••• or •••••) — and one unique,
      story-specific example, `ishiika` (Artifact N/A, a legendary
      scorpion-behemoth once tamed by the lost Prince Balor; inventoried
      with disposition `gm-only` rather than `selectable`, since it is a
      one-off creature tied to a named NPC and not a build a player
      follows, unlike the three generic tiers).
    - **Nirupadhika, the Way** (p. 211/PDF 212; 3 rows), the apparent
      sixth Grace flagged by earlier passes: `nirupadhika-the-way`
      documents the shinma itself, and `forging-the-way-grace` /
      `perfect-reckoning-technique` are its only two Charms. Determination:
      this is neither a standard sixth playable Grace nor pure GM lore —
      the book explicitly calls it "an example of one of the other shinma
      the raksha might tame," gives it only two Charms (versus 12-78 for
      each of the five real Graces), and it never appears in the
      character-creation chapters — but its Charms are fully rules-complete
      and usable in play (any raksha who knows the existing
      `forging-the-heart-grace` Charm can learn `forging-the-way-grace` to
      grant a Way Grace to a consenting creature, paralleling the four
      existing "Forging the (Grace) Grace" Charms). It is inventoried as
      real, narrowly-scoped player-facing content rather than folded into
      the five-Grace model or excluded as GM-only. See `source-manifest.json`
      for the full writeup.
    - This pass also corrected a one-page offset in this project's own
      prior page estimates for Behemoths and Nirupadhika (previously
      estimated at pp. 210-212/PDF 211-213 and p. 212/PDF 213
      respectively): direct visual confirmation against the rendered page
      images shows Deep Wyld Horror, Ishiika, and all of Nirupadhika
      actually sit on printed p. 211/PDF 212, one page earlier than
      previously estimated, with printed p. 212/PDF 213 being a full-page
      illustration with no chapter text — the true end of Chapter Five.
  - **A full triage of Chapters One, Two, Six and Seven** (2 new rows),
    completing a review of the entire book. Merits/Flaws specific to Fair
    Folk are **definitively confirmed absent everywhere in this book** — a
    full-text search of all 331 PDF pages found the word "Merit" exactly
    twice and "Flaw" exactly twice, all four incidental references to
    *other* books' Merits/Flaws (the Players Guide's Wyldwalk Merit and
    Enemy Flaw) or to Behemoths borrowing Traits "excluding ... most Merits
    and Flaws" (already inventoried), never to a Fair-Folk-specific
    Merits/Flaws list. Two other genuinely player-facing items surfaced and
    were inventoried: `gossamer-manta` (a purchasable Artifact ••• vehicle
    and Ring-shaping weapon boxed into Chapter One's Rakshastan geography,
    p. 38/PDF 39 — the same Wyld Artifacts category as Chapter Five's named
    examples) and `fair-folk-experience-and-training-time` (Chapter Seven's
    post-creation experience-cost table and no-training-time-delay rule,
    p. 321/PDF 322 — filling a real gap, since no prior pass had covered
    post-creation advancement costs at all). Chapter Two (The Raksha) was
    confirmed to contain zero mechanical content of any kind — pure
    worldbuilding/lore. Chapter One is otherwise entirely Storyteller-facing
    "Hazard Rating" bestiary/environment stat blocks (Flame Gryphon, Lion
    Warrior, Sand Shark, Abacasteri, Gargoyle, Poppet, Homunculus, Stone
    Lion, Wood Wife, Doppelganger, Siaka-Man, the Glittering Desert, the
    Waters of Chaos, Unicorn, etc.), deliberately excluded as GM/encounter
    content. Chapter Seven is otherwise entirely Storytelling advice with no
    further discrete mechanic. Chapter Six: The Mountain Folk was confirmed
    to be exactly what it appeared to be — a separate, non-raksha
    playable-adjacent race (the Jadeborn) with its own extensive,
    wholly self-contained character creation (Enlightened/Unenlightened,
    three castes, its own Attributes/Abilities/Backgrounds/experience-cost
    table), a full Charm section, and its own equipment/artifact catalog,
    followed by a Storyteller-facing "Nameless Hordes" bestiary and
    Storytelling advice. Per this task's scope, none of Chapter Six's
    Mountain Folk material is inventoried in this file — it would be its
    own separate family/module decision, not part of Fair Folk (raksha)
    scope. The one raksha/Mountain-Folk interaction found (p. 237/PDF 238:
    "any attempt by chaotic Fair Folk to feed on Mountain Folk souls
    automatically fails") is a passive setting fact about Jadeborn
    physiology, not a raksha-selectable mechanic, and was not inventoried.
    See `source-manifest.json`'s `rulesNotes` for the complete writeup.

That Merits/Flaws gap is now filled from a second source book: the
**Exalted Players Guide**, Chapter One, "Merits and Flaws" (printed pp.
18-41, PDF pp. 19-42). Rather than an independent re-read, 73 of its 88
`pg-merit-*`/`pg-flaw-*` rows (37 merits + 36 flaws) were **derived for
Fair Folk from Lunar's already-verified transcription** of the same
universal chapter (`inventory/exalted-the-lunars.json`), since the chapter
applies across all five planned Exalted families and each Lunar row's own
`notes` field already captures splat-specific eligibility/cost caveats
verbatim. 15 of the 88 were skipped as inapplicable to a raksha — a being
of pure Wyld/chaos that is **not Exalted at all**, has no
Essence-reincarnation cycle, no anima or Caste Mark, no blood-lineage
concept, and no access to core Exalted Sorcery: **Terrestrial Bloodline**,
**Past Lives**, **Sworn Brotherhood**, **Taint's Warning**, **Legendary
Breeding**, **Eternal Vow**, and **Brigid's Heir** among the merits;
**Limited Forms**, **Known Anathema**, **Chimera**, **Permanent Caste
Mark**, **Greater Curse**, **Beacon of Power**, **Death-Taint**, and
**Throwback** among the flaws. Several included rows were reinterpreted for
the raksha's own framework: **Large Size**/**Small** now key off a raksha's
Assumption-type shapeshifting Charms instead of Lunar forms; **Cache**/
**Debt** now key off the Gossamer Background instead of Resources (which
raksha exclude entirely); **Vice**/**Callous** now cross-reference Bedlam
instead of the Great Curse; and **Unskilled** now keys off Caste Abilities
instead of Favored Abilities. **Mutation** and **Weak Essence** were flagged
as unusually strong fits rather than adaptations, since raksha are
literally Wyld-stuff given shape and every raksha starts with Essence 2
exactly as Weak Essence's own "other magical beings" clause requires. Every
judgment call is flagged verbatim in the affected row's own `notes` field;
see `source-manifest.json`'s `rulesNotes` for the full accounting.

## Two small universal artifact catalogs (336 → 351 rows)

An eleventh pass added two more small, universal (non-splat-restricted)
artifact catalogs, neither requiring a full cover-to-cover re-read of a new
book:

- **6 rows derived from Lunar's transcription** (no independent re-read):
  `artifact-ghost-cestus`, `artifact-sling-bow-of-ice`,
  `artifact-the-golden-viper`, `artifact-land-ship`, `artifact-singing-staff`,
  and `artifact-eye-of-autochthon`, copied with identical id/name/mechanics/
  cost/citation from Lunar's already-verified transcription of the
  **Exalted Storyteller's Companion**'s Chapter Four, "Further Wonders"
  (printed pp. 77-80/PDF 78-81) — a universal artifact catalog explicitly
  usable by "normal humans," not restricted to any splat. Each row's
  `compatibility`/`notes` fields were individually rewritten to check the
  source's "Essence-manipulating wielder" language against a raksha's own
  Essence rating and mote pool (`fair-folk-creation-overview-common` /
  `-noble` both confirm every raksha starts at Essence 2 with a pool of
  Essence x 10, exactly like the Creation-born Exalted), since raksha are
  not Exalted, wear a physical **Mote** (capitalized) as their body in
  Creation, and use Glamour Sorcery rather than core Exalted Sorcery. All
  six transfer cleanly; `artifact-eye-of-autochthon` carries one flagged,
  non-blocking open question about its passive Wyld-turbulence-suppression
  effect possibly interacting with a raksha's own innate Wyld immunity.
- **9 rows freshly transcribed from Savage Seas** (a sixth source book, no
  text layer — rendered via PyMuPDF at 2.2x zoom and read directly):
  `artifact-cargo-preservation-spindles`, `artifact-armor-of-aquatic-puissance`,
  `artifact-steelsilk-sails`, `artifact-storm-sapphire`,
  `artifact-cord-of-winds`, `artifact-wavecleaver-daiklaive`,
  `artifact-light-implosion-bow`, `artifact-lightning-ballista`, and a
  reference-only `artifact-ship-weapons-table` summary row — all from
  Chapter Four's "Artifacts of the Waves" section (printed pp. 123-127/PDF
  124-128, the book's final mechanical content), explicitly **not**
  including that chapter's earlier "Magics of the Sea" Charms section
  (printed pp. 114-122), which the book restricts to Solar/Dragon-Blooded
  Exalted and remains correctly out of scope. `artifact-light-implosion-bow`
  is the strongest fit found: its own text explicitly names "any Exalted
  type and also Fair Folk and possibly others" as capable users.
  `artifact-lightning-ballista` carries the one flagged judgment call in
  this batch — the source calls it "powerless in the hands of the
  unExalted," but its actual mechanical requirement is only that "the
  firer must be able to manipulate Essence," which a raksha satisfies; a
  future reviewer could reasonably read the more pointed "unExalted"
  phrasing as a deliberate exclusion instead. Two low-zoom transcription
  errors (the Storm Sapphire Effect Table's Black Sapphire column, and the
  Lightning Ballista's hearthstone-variant Artifact rating) were caught and
  corrected via high-zoom re-renders before this pass was considered
  complete; both affected rows carry a `CORRECTION` note.

See `source-manifest.json`'s `rulesNotes` for the full accounting of both
parts, including every judgment call and the two corrected transcription
errors.

## What's still needed

**Nothing further from this primary sourcebook.** `Exalted: The Fair Folk`
has now been reviewed cover to cover: Chapters Three, Four and Five are
fully inventoried, and Chapters One, Two, Six and Seven have all been
triaged (see the "full triage of Chapters One, Two, Six and Seven" bullet
above for details). What remains is deliberate, not deferred:

1. The Storyteller-only "unshaped" Charm-suggestion sidebar in Chapter
   Three (pp. 96-97 / PDF 97-98) — full of specific named Charms for
   building unshaped NPCs, and explicitly GM-facing, not a player-facing
   creation rule. Deliberately **excluded from scope**, not merely
   deferred.
2. Chapter Six: The Mountain Folk (a separate non-raksha playable-adjacent
   race, the Jadeborn, with its own complete character creation, Charm
   section, and equipment/artifact catalog) — confirmed to have no
   raksha-specific player-facing mechanics beyond what has already been
   inventoried. Deliberately **excluded from this family's scope**; if the
   Mountain Folk are ever added as a playable option, that is a separate
   family/module decision, not a Fair Folk (raksha) one.
3. **Merits/Flaws specific to Fair Folk: definitively confirmed absent** from
   *Exalted: The Fair Folk* itself. A full-text search of all 331 pages of
   the PDF (not just the chapters reviewed this round) found the word
   "Merit" exactly twice and "Flaw" exactly twice book-wide, and every one
   of those four incidental mentions points to an *externally*-defined
   Merit/Flaw from the Exalted Players Guide, or to Chapter Five's
   Behemoths passage noting that a behemoth's borrowed Traits exclude "most
   Merits and Flaws" (already inventoried) — never to a Fair-Folk-specific
   Merits/Flaws list. No such list exists anywhere in this book, in any of
   its seven chapters. Like Lunar (see
   `docs/references/exalted1e/lunar/README.md`), Fair Folk has no dedicated
   Merits/Flaws subsection in its core sourcebook. **That gap is now filled**
   from the Exalted Players Guide's universal Chapter One, derived from
   Lunar's already-verified transcription (see above) — 73 of 88 rows apply
   to Fair Folk.
4. The project owner's remaining cross-splat supplements (Blood and Salt,
   Book of Bone and Ebony, and Book of Three Circles) are still untriaged
   for any further Fair Folk-relevant material. Two of the previously-listed
   supplements have since been triaged for Fair Folk specifically: the
   **Exalted Storyteller's Companion**'s universal "Further Wonders" artifact
   catalog (6 rows derived from Lunar's transcription) and **Savage Seas**'s
   universal "Artifacts of the Waves" section (9 rows freshly transcribed) —
   see the "Two small universal artifact catalogs" section above. Both
   books' remaining chapters (beyond the sections already mined for
   universal, non-splat-restricted material) are still untriaged for Fair
   Folk. The Players Guide's own remaining chapters (beyond the universal
   Chapter One now covered above) are also still untriaged.

## Do not add yet

- Do not add a production catalog under `src/games/exalted1e/reference/` for
  this family — that only happens after inventory rows are visually reviewed
  against the rendered source page.
- Do not add `fair-folk` to `exaltedSheetTypes` in
  `src/games/exalted1e/definitions.ts` — that stays out of scope until all
  five planned families are certified together.
