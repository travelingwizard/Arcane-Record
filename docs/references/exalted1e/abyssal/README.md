# Exalted 1e — Abyssal source intake

**Status: source intake in progress.** `Exalted: The Abyssals` and its
supplement *The Book of Bone and Ebony* have both been supplied, and 440
inventory rows are checked in under `inventory/`. See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory follows.

## What's inventoried so far

- `source-manifest.json` — two source books in scope
  (`exalted-the-abyssals` and `book-of-bone-and-ebony`); the remaining
  necromancy-heavy supplement (*Blood and Salt*) is not yet added.
- `inventory/exalted-the-abyssals.json` — 440 rows covering:
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
      9 fully-verified Charms; `ghost-warding-glyph`'s prerequisite
      `corpus-rending-blow` is a Daybreak Caste Occult Charm, counted
      there, not a tenth Linguistics row), Ride (`soul-reins` → ...
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
  - **Chapter Six necromancy spell system — now complete.** The framework
    overview (three circles: Shadowlands, Labyrinth, Void, paralleling
    Terrestrial/Celestial/Solar Circle Sorcery) plus all **26 spells**
    across all three circles:
    - **Shadowlands (First) Circle, 9 spells** (pp. 222-227, PDF 223-228):
      Hungry Creeping Shadow, Iron Countermagic, Piercing the Shroud,
      Raise the Skeletal Horde, Rune of Sweet Passing, Shade Prison
      Amulet, Soul Brand, Summon Ghost, Walking War Machine.
    - **Labyrinth (Second) Circle, 9 spells** (pp. 225-228, PDF 226-229):
      Exquisite Undead Aide, Hundred Shade Breath, Arisen Legion and Call
      the Greater Servitor (two named variants of a Labyrinth-level Raise
      the Skeletal Horde upgrade, presented inline within that spell's own
      entry rather than as separately headed blocks), Ivory Razor Forest,
      Reaping the Fallen, Spiteful Passing, Stealing the Gathered Breath,
      Striking Spectre Lash.
    - **Void (Third) Circle, 8 spells** (pp. 227-229, PDF 228-230): Blood
      from the Slaughter (a named Void-Circle variant of Reaping the
      Fallen, appearing before the formal section heading), Abyssal
      Aegis, Anguished Shade Harvest, Blood Monsoon, Dimming of the
      Light, Inauspicious Citadel, Lord of the Dead, Poisoning the Well.
    - The per-circle gating Charms (`shadowlands-circle-necromancy`,
      `labyrinth-circle-necromancy`, `void-circle-necromancy`) were
      inventoried as part of the Daybreak Caste's Occult tree above.
    - Confirmed via the printed folio ("229") at the bottom of PDF page
      230 that Poisoning the Well is the last spell; a full-page
      illustration, a short-fiction interlude, and the real Chapter Six
      title page ("THE ARTS OF THE DEAD," printed p. 232/PDF 233) follow.
  - **Chapter Six: The Arts of the Dead — Crafts of the Dead (4 of 5
    Crafts).** `craft-moliation`, `craft-pandemonium`, `craft-soulforging`,
    and `craft-jadecrafting` (pp. 232-234, PDF 233-235), each with its
    specialties and Standard/Challenging/Legendary use examples. Craft
    (Necrosurgery) — the fifth Craft named in the Chapter Four "Useful
    Crafts" summary — has no dedicated framework block anywhere in the
    book; per that summary it is used only by living Abyssal Exalted, not
    ghosts, so this ghost-focused chapter omits it. Its only mechanical
    detail remains via the already-inventoried Walking War Machine spell
    and Bone Graft Technique Charm.
  - **Abyssal-specific Merits/Flaws — confirmed absent.** Checked across
    Chapters One through Seven (Chapter Seven, "Storytelling," is
    Storyteller-facing Deathlord/sample-series advice, not
    character-creation mechanics) and against the book's printed character
    sheet (pp. 288 and 291, PDF 289 and 292), which has no Merits/Flaws
    fields at all. Documented as its own excluded row
    (`abyssal-specific-merits-and-flaws-absent`).
  - The Moonshadow Linguistics `ghost-warding-glyph` row was corrected to
    add a missing **Minimum Occult 4** requirement, found during a
    dedicated re-check of its prerequisite gap.
  - **The `corpus-rending-blow` gap is resolved.** The Charm that
    `ghost-warding-glyph` lists as a prerequisite is the Daybreak Caste
    Occult-tree Charm at printed p. 199/PDF 200 — an earlier pass had
    mistranscribed that Charm's own name as "Corpse-Rending Blow" and
    treated the two spellings as distinct, unresolved Charms. A zoomed
    re-check of the rendered page header plus a cross-check against the
    book's own Index (printed p. 285/PDF 286, Daybreak Caste > Occult
    column) confirmed the correct spelling — the Index lists exactly one
    entry, "Corpus-Rending Blow, 198," not two. The mistranscribed
    duplicate row was removed, `corpus-rending-blow` was populated with
    its full stat block and marked `selectable`/`reviewed`, and every
    cross-reference and in-text mention across the file
    (`spirit-sensing-technique`, `soul-eating-strike`, `through-dead-eyes`,
    `ghost-warding-glyph`) was corrected. `ghost-warding-glyph` is no
    longer blocked by an unresolved prerequisite.

- **The Book of Bone and Ebony** (`book-of-bone-and-ebony`) — a
  necromancy/Abyssal-focused supplement, now added as a second source
  book. 153 new rows:
  - **Chapter Two: The Arts of the Dead — excluded (1 row).** Despite its
    "Charms for the dead" framing, this entire chapter (printed pp. 34-53,
    PDF 35-54) turned out to be ghost Arcanoi — Common and Uncommon
    Arcanoi chains (including the Lintha-originated `Evoke the Ancient
    Clay` chain) gated by Minimum Virtue + Essence, never by Minimum
    Ability + Essence like a real player-facing Abyssal Charm. Documented
    as a single chapter-level excluded row
    (`book-of-bone-and-ebony-chapter-two-arcanoi-excluded`) rather than
    transcribed Arcanos-by-Arcanos, matching the precedent already set for
    the core book's own Chapter Six Arcanoi trees.
  - **Chapter Five: Necromancy — 77 new spells (pp. 116-145, PDF
    117-146), fully inventoried.** Every spell was cross-checked by id
    against the core book's existing 26 spells to confirm no duplication.
    Covers the Shadowlands, Labyrinth, and Void Circles, including named
    variant spells presented inline within a "parent" spell's own prose
    (e.g. `white-shard`/`the-barless-gate` under `blood-mirror-speech`,
    `black-vial`/`empty-night-future` under `silent-masters-pollen`,
    `walking-gore-titan`/`void-cocoon-warrior` under
    `rattled-bones-of-war`) — each given its own row per this project's
    one-row-per-named-heading convention. Two spells
    (`brick-by-brick-solitude`, the Labyrinth upgrade of Ringing Hun
    Rebuke; and `barred-tomb`, the Void upgrade of Denying the Call) never
    restate an explicit mote cost in their source prose and are marked
    `unresolved` with an in-text `[FLAG]` rather than a guessed number.
    Mortal Thaumaturgy rituals and a Solar Circle Sorcery counterpart
    spell found in this chapter were intentionally excluded as out of
    scope for an Abyssal-specific inventory. The chapter's closing
    GM-facing content (a sample hekatonkhire NPC stat block and an Exalted
    Power Combat weapon table) was likewise excluded, though the
    player-facing casting/duel mechanics for `summon-hekatonkhire` itself
    are captured as a normal selectable spell row.
  - **Chapter Three: The Wonders of the Dead — 69 artifacts, fully
    inventoried at summary granularity (pp. 58-79, PDF 59-80).** Every
    catalog entry (Artifact ratings one through four, plus one
    Resources-rated item, `stomach-weighting-powder`) is captured as name,
    rating, a one-paragraph mechanical summary, and its full Artifact
    Traits line, rather than exhaustive verbatim text — matching how this
    project handles other large procedural artifact catalogs. Extraction
    relied on this PDF's confirmed-accurate text layer (unlike the
    image-based core `Exalted: The Abyssals` PDF); several entries were
    additionally spot-checked against rendered page images with no
    discrepancies found.
  - **Chapter Four: Creations of Bone — partially covered (5 named
    artifacts + 1 embedded spell; the larger war-machine subsystem is
    NOT yet transcribed).** This chapter turned out to be a full
    nemissary-crafting and war-machine-construction rules subsystem, not
    a simple catalog — see "What's still needed" below for its scope.
    What *is* covered: `sarcophagus-of-restoration`,
    `loathsome-osseous-shell`, `bonestrider`, `the-insidious-ebon-xoanon`,
    and `manifestation-engine` (pp. 93-113, PDF 94-114), plus one Void
    Circle necromancy spell found embedded in the chapter's "War Machines
    of the Dead" section, `oblivions-avatar` (p. 102, PDF 103) — filed
    alongside the Chapter Five spells for consistency even though it
    physically appears in Chapter Four.

## What's still needed

All four scope items from the previous inventory pass (finishing the
Void Circle, locating the Craft rules, resolving `corpus-rending-blow`, and
checking for Abyssal-specific Merits/Flaws) are complete, and the Book of
Bone and Ebony supplement pass above closed out this family's two
highest-priority remaining items (its new Charms/Arcanoi chapter and its
new necromancy spells). What remains is either out-of-core-scope, optional,
or a smaller resume item:

1. **Book of Bone and Ebony, Chapter Four's nemissary/war-machine
   subsystem (resume point).** Roughly printed pp. 87-115 (PDF 88-116) is
   a full rules subsystem covering armies-of-the-dead troop types
   (zombies, ghosts, hungry ghosts, moliated ghosts), "Custom Corpses"
   nemissary-crafting rules (repair/augmentation/options packages), a
   "Nemissary Arcanoi and Wonders" section, and a complete war-machine
   construction toolkit (frame/size-class/weapon-mount/passenger/
   animation rules, Deathlord-specific "Oblivion's Warstriders" templates,
   and sample necro-drones/airships). Only the chapter's self-contained
   named artifacts and one embedded spell were transcribed this pass (see
   above); the subsystem itself still needs its own inventory pass,
   likely at the same "reasonable summary granularity" used for Chapter
   Three, given its size.
2. Two Book of Bone and Ebony necromancy-spell rows
   (`brick-by-brick-solitude`, `barred-tomb`) are marked `unresolved`
   because their source prose never restates an explicit mote cost;
   resolving these would require locating an official errata/FAQ source,
   since the printed book itself simply omits the number.
3. The necromancy-heavy supplement *Blood and Salt*, if its Abyssal-facing
   mechanics are in scope.
4. Optional/out-of-core-scope: Chapter Six's Arcanoi (ghost-power) trees
   (pp. 235-263, PDF 236-264 — e.g. Shifting Ghost-Clay Path,
   Mortal-Shadowing Technique, Puppeteer's Masterful Hand, Six Demon Bag)
   are ghost/NPC powers, not player-facing Abyssal Charms, and likely fall
   outside this family's core scope, but are flagged in case a future pass
   wants ghost-antagonist stat support.
5. Optional/out-of-core-scope: Chapter Seven's Storytelling content
   (Deathlords, sample series, pp. 264-287, PDF 265-288) is GM-facing
   narrative material, not character-mechanical content.

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
