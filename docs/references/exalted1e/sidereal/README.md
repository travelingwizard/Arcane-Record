# Exalted 1e — Sidereal source intake

**Status: source intake in progress.** `Exalted: The Sidereals` plus the
cross-splat supplements `Savant and Sorcerer`, `Book of Three Circles`,
`Exalted Storyteller's Companion`, `Exalted: Savage Seas`, and
`Exalted: Blood and Salt` have been supplied and 583 inventory rows are
checked in under `inventory/`. The core book was confirmed to have no
Merits/Flaws section of its own; that universal gap is now filled from a
sixth source book, the **Exalted Players Guide**'s Chapter One, "Merits and
Flaws" — 80 rows derived for Sidereal from Lunar's already-verified
transcription of that chapter (487 → 567 rows), and a final cross-splat
supplement-triage pass then added 16 more rows from *Exalted: Blood and
Salt* (567 → 583 rows total). See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory follows.

## What's inventoried so far

- `source-manifest.json` — six source books in scope: `exalted-the-sidereals`
  (primary), `savant-and-sorcerer` (cross-splat sorcery/artifice supplement),
  `book-of-three-circles` (superseded cross-splat supplement, used only
  as the primary Hearthstone-catalog source since Savant and Sorcerer's own
  intro sidebar states it does not reprint that catalog), and
  `exalted-storytellers-companion` (cross-splat sourcebook; its Sidereal
  section's only mechanical content, four "Sample Charms," turned out to be
  verbatim reprints of Charms already inventoried from Chapter Five, so that
  citation contributed zero new rows on its own — but its Chapter Four
  universal artifact catalog was later derived into six new rows, see
  below), `savage-seas` (cross-splat naval/nautical sourcebook; its
  universal "Artifacts of the Waves" catalog was transcribed in full, see
  below), and `exalted-players-guide` (the universal Merits/Flaws chapter,
  derived rather than independently transcribed; see below).
- `inventory/exalted-the-sidereals.json` — 583 rows covering:
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
  - **The complete Journeys Caste (all five Charm trees, pp. 132-142/PDF
    135-145)**:
    - Endurance ("The Mast," 7 Charms): Ox-Body Technique (Sidereal),
      Unswerving Juggernaut Principle and Optimistic Security Practice and
      Unwavering Well-Being Meditation (three parallel roots),
      Forward-Thinking Technique (from Unswerving Juggernaut Principle),
      Heartless Maiden Trance (from Optimistic Security Practice +
      Unwavering Well-Being Meditation), and the capstone One Direction
      Invocation (from Forward-Thinking Technique + Heartless Maiden
      Trance).
    - Ride ("The Messenger," 7 Charms): Ordained Bridle of Mercury and
      Yellow Path (two parallel roots), Spirit-Shape Companion and
      Breaking the Wild Mortal and Glory Path (each fed by one of the
      roots), Godly Companion (from Spirit-Shape Companion), and the
      capstone Riding the Dragon (from Godly Companion + Breaking the
      Wild Mortal + Glory Path).
    - Sail ("The Captain," 4 Charms): Salt Into Ash Sleight and Stone
      Skipping Spirit (two parallel roots), Mirror Shattering Method
      (from Stone Skipping Spirit), and the capstone Five Ordeals Odyssey
      (from Salt Into Ash Sleight + Mirror Shattering Method).
    - Survival ("The Ship's Wheel," 6 Charms): Becoming the Wilderness and
      Sky and Rain Mantra (two parallel roots), Adopting the Untamed Face
      (from Becoming the Wilderness) and Sky Spirit Demand (from Sky and
      Rain Mantra), Dreaming the Wild Lands (from Adopting the Untamed
      Face), and the capstone Wilderness-Commanding Practice (from
      Dreaming the Wild Lands + Sky Spirit Demand).
    - Thrown ("The Gull," 5 Charms): Willful Weapon Method and Pain
      Amplification Stratagem (two parallel roots) and Life Gets Worse
      Approach (a third root), Essence Thorn Practice (from Life Gets
      Worse Approach), and the capstone Unrelenting Torment Technique
      (from Willful Weapon Method + Essence Thorn Practice + Pain
      Amplification Stratagem).
  - **The complete Serenity Caste (all five Charm trees, pp. 143-153/PDF
    146-156)**:
    - Craft ("The Peacock," 7 Charms): Elemental Vision, Elegant Patterns of
      Fate, World-Shaping Artistic Vision, and Mending Warped Designs (four
      parallel roots), Excellent Implementation of Objectives (from Elegant
      Patterns of Fate) and Destiny-Knitting Entanglement (from
      World-Shaping Artistic Vision), and the capstone Implicit
      Construction Methodology (from Excellent Implementation of
      Objectives + Destiny-Knitting Entanglement + Mending Warped Designs).
    - Dodge ("The Ewer," 5 Charms): Absence (root) feeding Duck Fate, Avoiding
      Kata, and Trouble Reduction Strategy in a chain, with the capstone
      Neighborhood Relocation Scheme (from Avoiding Kata + Trouble Reduction
      Strategy).
    - Linguistics ("The Pillar," 4 Charms): Favorable Inflection Procedure,
      Blue Vervain Binding, and Ice and Fire Binding (three parallel roots)
      feeding the capstone Lover's Oath.
    - Performance ("The Musician," 7 Charms): Compassionate Essence
      Replenishment (root) feeding Faultless Ceremony, Perfection in Life,
      and Heart-Brightening Presentation Style; Perfection in Life also
      feeds Defense of Shining Joy and Song of Spirit Persuasion; all
      converge on the capstone Harmonic Completion.
    - Socialize ("The Lovers," 7 Charms): Stern Essence Replenishment, Shun
      the Smiling Lady, and Hot-Eyed Snake Whispering (three parallel
      roots) feeding Cash and Murder Games, You and Yours Stance, and the
      capstone Wanting and Fearing Prayer (from Life Without Compunction +
      You and Yours Stance + Hot-Eyed Snake Whispering), with Life Without
      Compunction fed by Cash and Murder Games.
  - **The complete Battles Caste (all five Charm trees, pp. 153-162/PDF
    156-165)**:
    - Archery ("The Quiver," 6 Charms): Generalized Ammunition Technique and
      Any Direction Arrow (two parallel roots) feeding Every Direction
      Arrow and Opportune Shot, converging on the capstone Five Seasons
      Approach, plus the standalone Many Missiles Bow Technique.
    - Brawl ("The Gauntlet," 5 Charms): Unobstructed Blow and Tolerant
      Strife (two parallel roots) feeding Horrific Wreath and the capstone
      Crimson Palm Counterstrike, plus the standalone Easily Accepted
      Proposition Stance.
    - Melee ("The Spear," 7 Charms): Impeding the Flow and Harmony of Blows
      (two parallel roots) feeding Serenity in Blood, Orchestration of
      Conflict, Meditation on War, and Smiling at the Damned, converging on
      the capstone Perfection of the Visionary Warrior.
    - Presence ("The Banner," 8 Charms): Heroic Essence Replenishment (root)
      feeding Presence-in-Absence Technique, Impose Nature, and Force
      Decision, converging on the capstone Predestined Triumph Practice,
      plus the standalone Essence-Draining/Demon-Blocking/Spirit-Binding
      Battle Pattern trio.
    - Resistance ("The Shield," 5 Charms): Red Haze, Someone Else's Destiny,
      Water and Fire Legion, and Shield of Mars (four parallel roots)
      converging on the capstone Storm's Eye Stance.
  - **The complete Secrets Caste (all five Charm trees, pp. 163-173/PDF
    166-176)**:
    - Investigation ("The Key," 5 Charms): Efficient Secretary Technique,
      Marvelous Inclusion of Details, and the standalone Auspicious
      Prospects for (Caste) (three roots), with Efficient Secretary
      Technique feeding Research Assistant Invocation, which combines with
      Marvelous Inclusion of Details for the capstone Embracing Life
      Method.
    - Larceny ("The Guardians," 6 Charms): Creation Smuggling Procedures,
      Name Pilfering Practices, and Honorable Thief Spirit (three parallel
      roots) feeding Sidereal Shell Games and Dream Confiscation Approach,
      converging on the capstone Conning Chaos Technique.
    - Lore ("The Treasure Trove," 9 Charms): Systematic Understanding of
      Everything (root) feeding The Methodology of Secrets, Of Truths Best
      Unspoken, Of the Shape of the World, Of Things Desired and Feared,
      and Of Secrets Yet Untold; Of the Shape of the World also feeds Of
      Horrors Best Unknown; all (plus the standalone root Avoiding the
      Truth Technique) converge on the capstone Transcendent Hatchet of
      Fate.
    - Occult ("The Sorcerer," 7 Charms across two tree diagrams): Part I
      (Mark of Exaltation and Incite Decorum as parallel roots, feeding
      Tell-Tale Symphony and the capstone Unweaving Method via Innocuous
      Maneuver) and Part II (Terrestrial Circle Sorcery as root, feeding
      Celestial Circle Sorcery).
    - Stealth ("The Mask," 5 Charms): Soft Presence Practice and Blinding
      the Boar (two parallel roots), with Soft Presence Practice feeding
      Walking Outside Fate and Subordinate Inspiration Technique, which
      converge with Blinding the Boar on the capstone Ceasing to Exist
      Approach.
  - **The complete Endings Caste (all five Charm trees, pp. 174-184/PDF
    177-187) — closing out all 25 of Chapter Five's Caste-and-Ability Charm
    trees**:
    - Athletics ("The Rising Smoke," 5 Charms): Burn Life, Forgotten Earth,
      and Inexorable Advance (three parallel roots), with Burn Life feeding
      Hungry Touch, converging with Forgotten Earth and Inexorable Advance
      on the capstone Invisible Motion.
    - Awareness ("The Crow," 6 Charms): Prior Warning and Wise Choice and
      Inevitable Pursuit (three parallel roots), with Prior Warning feeding
      Expected Pain, which combines with Wise Choice's follow-up Supernal
      Awareness and Inevitable Pursuit on the capstone Conclusive Wisdom.
    - Bureaucracy ("The Haywain," 5 Charms): Slick Essence Replenishment
      (a standalone root with no followers), Icy Hand, and Underling
      Invisibility Practice (two more parallel roots), with Icy Hand
      feeding Terminal Sanction, which converges with Underling Invisibility
      Practice on the capstone End Debate.
    - Martial Arts ("The Sword," 9 Charms; the Violet Bier of Sorrows Style,
      also called the Endings Form): Secrets of Future Strife (root)
      feeding Flight of Mercury, Blade of the Battle Maiden, and Joy in
      Adversity Stance, which converge on the Form Charm Violet Bier of
      Sorrows Form; that Form feeds Death-Parrying Stroke and Life-Severing
      Blow, the latter feeding Metal Storm, with Death-Parrying Stroke and
      Metal Storm converging on the capstone Conclusion-Pursuing Approach.
    - Medicine ("The Corpse," 5 Charms): Smooth Transition and Terminate
      Illness (two roots), with Smooth Transition feeding Peaceable
      Conclusion and Invocation of the Storm-Following Silence, all three
      (Peaceable Conclusion, Invocation of the Storm-Following Silence,
      Terminate Illness) converging on the capstone Earth and Sky Bargain.
  - **The general "Sidereal Martial Arts" secret-style framework** (pp.
    184-185/PDF 187-188): the section overview plus the Sutras resonance
    mechanic (how a Sidereal's own secret-style Charms interact with the
    Maidens' domains).
  - **The complete Charcoal March of Spiders Style** (pp. 185-190/PDF
    188-193; 12 Charms plus its tree-overview row): three roots (Unnatural
    Many-Step Stride, Maw of Dripping Venom, Rain of Unseen Threads)
    feeding Dance of the Hungry Spider, Charcoal March of Spiders Form,
    and Nest of Living Strands, converging through Cannibalistic Heritage
    Technique on Jumping Spider Strike, which spreads to Thumbnail Spider
    March and Water Spider Bite and the capstone Grandmother Spider
    Mastery via Pattern Spider Touch.
  - **The complete Prismatic Arrangement of Creation Style** (pp. 190-194/
    PDF 193-197; 16 Charms plus its tree-overview row): four roots (Deadly
    Starmetal Offensive, Orichalcum Sheathing Stance, Flickering Moonsilver
    Approach, Five Jade Fury) converge on Four Magical Materials Form,
    which feeds two branches — Charm Redirection Technique leading to
    Sequential Charm Disruption and Spell-Shattering Palm, and Astrology
    Interruption Method leading to Soul Fire Shaper Form — both branches
    converge on God Ways/(Type) Exalt Ways, which feeds Games of Divinity
    Form, Demesne Emulation Practice, and Demesne and Manse Form, all
    converging on the capstone Prismatic Arrangement of Creation Form.
  - **The complete Citrine Poxes of Contagion Style** (pp. 195-201/PDF
    198-204; 13 Charms across two linked tree diagrams, plus its
    tree-overview row and a separate Infectious Martial Arts/Spiritual
    Diseases framework row) — the book's third and final named secret
    Sidereal Martial Arts style, closing out all three (Charcoal March of
    Spiders, Prismatic Arrangement of Creation, Citrine Poxes of
    Contagion): first diagram — three infectious-atemi roots (Feverish
    Essence Discharge Atemi, Disjointed Essence Infectious Atemi,
    Convulsive Displacement Infectious Atemi) converge on
    Essence-Disrupting Infectious Atemi, while two curative roots (Perfect
    Reconstruction Method, Spirit and Body Purification Touch) converge on
    Flare of Invulnerability Method, with Spirit and Body Purification
    Touch also feeding Inner Dragon Unbinding, all three branches
    converging on the Form Charm Citrine Poxes of Contagion Form; second
    diagram — that Form feeds Spiritual Perfection, which feeds both
    Gentle Touch of the Wicked Hand and Glorious Sidereal Protection,
    converging on the capstone Essence-Shattering Typhoon.
  - **The Sidereal Astrology (Colleges/constellations) rules framework**
    (pp. 204-218/PDF 207-221): the section overview, Petitions (the
    paperwork/calligraphy/co-and-countersignature procedure for casting an
    astrology effect), the Effect Roll (Determining, Formulating, and
    Activating Effects), the Blessing/Curse Effect Types split, the Effect
    Scope/Duration/Power tables, Multiple Effects and Canceling Effects,
    Censure (the penalty for illicit/unauthorized use), Paradox
    (astrology's equivalent to sorcerous backlash), and Pattern Bite (a
    lingering-consequence mechanic).
  - **Resplendent Destinies** (p. 215/PDF 218) — the full system by which a
    Sidereal can bypass her own Arcane Fate and don a memorable identity,
    as a single calculated row.
  - The **Procedure for Sidereal Astrology and Catalog of Colleges**
    lead-in (p. 218/PDF 221) plus the **full named-College catalog** that
    closes Chapter Six (pp. 220-235/PDF 223-238): the House of Journeys
    (The Captain, The Gull, The Mast, The Messenger, The Ship's Wheel —
    Journeys Caste), the House of Leisure (The Ewer, The Lovers, The
    Musician, The Peacock, The Pillar — Serenity Caste; the book names
    this house "Leisure," not "Serenity"), the House of War (The Banner,
    The Gauntlet, The Quiver, The Shield, The Spear — Battles Caste; named
    "War," not "Battles"), the House of Secrets (The Guardians, The Key,
    The Mask, The Sorcerer, The Treasure Trove — Secrets Caste; the Mask
    is the college damaged by Arcane Fate, so Sidereals can't self-target
    its ascending/descending effects), and the House of Endings (The
    Corpse, The Crow, The Haywain, The Rising Smoke, The Sword — Endings
    Caste), plus the five **Greater Signs** of the Maidens (Mercury/
    Travel, Venus/Serenity, Mars/War, Jupiter/Secrets, Saturn/Endings, p.
    235/PDF 238). Each house is one reference-only row (matching a
    tree-overview template) rather than one row per college, given the
    volume of near-identical Trappings/Correlations/Resplendent-Effect
    prose; write-ups are paraphrased rather than verbatim.
  - Three Terrestrial/Celestial Circle sorcery **spells** cross-referenced
    from the Chapter Five Charm framework and Occult tree (Open the Spirit
    Door, Gift of Knowledge, Summoning the Heavenly Portal) and one
    **Specialized Prayer** (Prayer of the Chosen, automatically known by
    any Sidereal with two or more combined dots in Occult and Savant),
    printed pp. 122-124/PDF 125-127.

The remaining 220 rows come from the two cross-splat sorcery/artifice
supplements:

- **Savant and Sorcerer's complete Chapter Five Terrestrial and Celestial
  Circle spell catalog** (84 selectable spells, printed pp. 100-143/PDF
  101-144) — this book explicitly supersedes _Book of Three Circles_ as the
  edition's official magic book, and no gaps were found against the
  chapter's own page-by-page spell-header count.
- A **102-entry Hearthstone catalog**, all selectable and cross-referenced
  to the Manse Background: 15 Sample Hearthstones from Savant and Sorcerer
  Chapter Three (printed pp. 46-49/PDF 47-50, three per level across Levels
  One through Five) plus 87 more from _Book of Three Circles_ Chapter Six's
  image-based 'long roll' (rendered page-by-page), since Savant and
  Sorcerer's own intro sidebar states it does not reprint the Hearthstone
  catalog. Near-duplicate names/effects between the two books are
  disambiguated with a `hearthstone-botc-*` id prefix and a cross-reference
  note; exact reprints (e.g. the Snakeskin Stone) were skipped in favor of
  a note on the original entry.
- A **13-row Artifice and Enchantment catalog** from Savant and Sorcerer
  Chapter Two (printed pp. 23-44/PDF 24-45): the Artifact rating framework
  (Power/Usefulness/Game Impact/Script Immunity/Drawback), the Drawback-
  subtype and alternate-power-source rules, the five-step creation process,
  Sidereal-specific creation notes (starmetal scarcity, Bronze Faction/
  Yu-Shan workshop access), two selectable named Merits (Starting Workshop,
  Moonsilver Initiate), a reference-only Magical Materials catalog (the
  Sidereal-specific starmetal-origin lore included), an Exotic Ingredients
  examples row, and five selectable Sample Artifacts (Collar of Dawn's
  Cleansing Light, Mask, Ring of Being, Wings of the Raptor, Soul Mirror).
- A **13-row Warstriders appendix** (Savant and Sorcerer's version, printed
  pp. 144-160/PDF 145-161): the overview/design-classes, operation/Essence-
  cost, benefits/limitations, and maintenance rules; all five basic
  warstrider design classes as selectable Artifact-rated equipment (Scout,
  Common, Noble, Royal, Juggernaut); reference-only weapon-mounting/mundane-
  weapon/artifact-weapon catalogs; and the Proteus Gauntlet as a selectable
  named artifact.
- An **8-row skim of Chapter One (Magical Theory) and Chapter Four
  (Practical Summonings)**, both bundled as gm-only or reference-only given
  their non-selectable, Storyteller-procedural nature: the Limits of
  Sorcery, the Black and White Treatises acquisition mechanic, the Five
  Unavoidable Challenges initiation framework, and Sidereal-specific
  initiation notes (Chapter One); the demon/elemental summoning-procedure
  overview, social/political/licensing context, mass summoning project
  rules, and the Bound Spirit Limit Profile system (Chapter Four).

- **Exalted Storyteller's Companion** — the entire Sidereal portion of
  Chapter Two ("The Celestial Exalted," printed pp. 34-41/PDF 35-42, running
  up to where the Abyssal Exalted section begins) was rendered and read.
  It is almost entirely narrative on post-Usurpation Sidereal society (Caste
  social roles, the Immaculate Order relationship, Loom of Fate culture)
  with no new Charms of its own; its only mechanical content, a "Sample
  Charms" sidebar (Force Decision, Absence, Wise Choice, Prior Warning, all
  on printed p. 41/PDF 42), is a set of exact verbatim reprints of Charms
  already inventoried from Chapter Five, so no new rows were added for that
  citation — each existing row's `notes` field was updated to cite the
  reprint instead. A quick skim of Chapter One ("The Scarlet Empire") and
  Chapter Three ("Spirits and Spirit Courts") found only Dragon-Blooded
  sample Charms and Spirit/NPC stat blocks respectively — no player-facing
  Sidereal (or Lunar) exceptions in either chapter. Separately, this book's
  Chapter Four universal, cross-splat artifact catalog ("Further Wonders,"
  printed pp. 77-80/PDF 78-81) was derived into six new rows (`artifact-`
  prefixed: Ghost Cestus, Sling Bow of Ice, The Golden Viper, Land Ship,
  Singing Staff, Eye of Autochthon) directly from Lunar's own already-
  verified transcription of the same universal chapter — same id, name,
  mechanics, cost, and citation, with a note flagging each as derived. No
  splat-specific restriction excludes Sidereal from any of the six.
- **Exalted: Savage Seas** — the naval/nautical "Artifacts of the Waves"
  catalog in Chapter Four ("Creatures, Gods, Charms and Artifacts," printed
  pp. 123-127/PDF 124-128, ending at the last content page before the back
  cover on PDF p. 129) was rendered page-by-page (this PDF has no text
  layer) and transcribed in full: Cargo Preservation Spindles, Armor of
  Aquatic Puissance, Steelsilk Sails, Storm Sapphire, Cord of Winds,
  Wavecleaver Daiklaive, Light Implosion Bow, and Lightning Ballista (eight
  selectable named artifacts), plus a reference-only "Artifact Ship
  Weapons" summary table cross-referenced from the two ship-weapon rows.
  None carry any splat-specific restriction excluding Sidereal. This
  book's earlier "Magics of the Sea" Charms section (printed pp. 114-122/
  PDF 115-123) is explicitly Solar/Dragon-Blooded-only per the book's own
  text and was confirmed out of scope for Sidereal without being rendered.
- **Exalted: Blood and Salt** — a final cross-splat supplement-triage pass,
  16 rows, bringing the inventory to 583. This regional An-Teng/Lintha
  Family sourcebook (real text layer, no rendering needed) was read cover
  to cover; as expected, the vast majority of its Background/Artifact/
  Charm/Sorcery/Hearthstone keyword hits sit inside NPC/monster stat
  blocks (GM-only), but a smaller genuinely player-facing set was found:
  a Lintha Character Backgrounds reinterpretation sidebar and a Bluehaven
  approach-navigation rule (both reference-only, printed p. 63/PDF 65), a
  bundled regional Character Concepts row (four lists, printed pp.
  27/32/36/63, PDF 29/34/38/65), seven new Artifacts from Chapter Three's
  "Wonders of the Southwest" (Automaton Assassin, Sailcutter Chakram,
  Ancestor Sash, the Seven Lotus Crown, the Masks That Command the
  Animals, the Coral Crown, and the Talisman of the Cult of Dukantha —
  the last granting Infernal sorcery access independent of Sidereal's own
  sorcery Charms), one new Hearthstone (`hearthstone-jewel-of-stability`,
  Earth Manse •••), three mundane equipment items (Fire Arrow, Southern
  Fire Arrow, Water Shoes), and two new Terrestrial Circle spells
  (`spell-terrestrial-song-of-the-lintha`, `spell-terrestrial-waters-ally`,
  cross-referenced to `terrestrial-circle-sorcery`). Four artifacts already
  carried from Savage Seas (Cord of Winds, Light Implosion Bow, Steelsilk
  Sails, Storm Sapphire) plus the Book of Three Circles-sourced Gem of
  Desire Hearthstone are reprinted verbatim in Blood and Salt; a REPRINT
  NOTE was appended to each existing row instead of creating duplicates,
  and Calling the Wind's Kiss/Mast-Shattering Spell likewise received a
  citation note confirming the identical reprint rather than a new row.
  The Seven Lotus Crown and Coral Crown are marked selectable but flagged
  as narrowly restricted to a specific narrative title-holder rather than
  freely purchasable. The remainder of the book was confirmed out of scope.

## What's still needed

Nothing outstanding within Chapters One through Six of the core book
(character creation, Traits, Charms/Martial Arts, and Sidereal Astrology are
all fully inventoried). Chapter Seven onward (Storytelling/setting material)
has not been reviewed, since it is out of scope for a Charm/mechanics
inventory.

Savant and Sorcerer and Book of Three Circles are also now fully triaged for
Sidereal scope: no outstanding resume point remains. _Book of Three
Circles_' Chapter Four (Solar Circle Sorcery) is explicitly out of scope and
was skipped entirely, since Sidereals do not have Solar Circle Sorcery
access. The Exalted Storyteller's Companion, Exalted: Savage Seas, and
Exalted: Blood and Salt are likewise now fully triaged for Sidereal scope:
no outstanding resume point remains for any of the three.

**Merits/Flaws:** checked and confirmed absent from this core book. A
dedicated search of Chapter Three (Character Creation, printed pp. 94-101/
PDF 97-104) and Chapter Four (Traits, printed pp. 102-125/PDF 105-128) found
no Sidereal-specific — or generic — Merits & Flaws system in _Exalted: The
Sidereals_ itself; Exalted 1st Edition does not have a Merits & Flaws
chapter comparable to later editions, so no rows were created for it from
this book.

That universal gap is now filled from a second source book: the
**Exalted Players Guide**, Chapter One, "Merits and Flaws" (printed pp.
18-41, PDF pp. 21-44). Rather than an independent re-read, 80 of its 88
`pg-merit-*`/`pg-flaw-*` rows were **derived for Sidereal from Lunar's
already-verified transcription** of the same universal chapter
(`inventory/exalted-the-lunars.json`), since the chapter applies across all
five planned Exalted families and each Lunar row's own `notes` field
already captures splat-specific eligibility/cost caveats verbatim. 8 of the
88 were skipped as inapplicable to Sidereal: **Chimera** and **Limited
Forms** (Lunar Shapechanging-specific, and Sidereal has no analogous
shapeshifting power), **Death Taint** (Abyssals-and-Ghosts-only per its own
header), **Legendary Breeding**, **Taint's Warning**, **Innocuous**, and
**Eternal Vow** (each keyed to Lunar-specific breeding/Tell/mate-bonding
mechanics with no Sidereal analog), and **Past Lives** (its header names
only Solar and Dragon-Blooded, unlike the textually broader Prescient
Dreamer Merit, which does name Sidereal explicitly and was kept). The
remaining 80 rows split into 57 rows transferred verbatim (unchanged
id/name/mechanics/cost/citation, using this project's `pg-merit-*`/
`pg-flaw-*` id scheme shared with Abyssal/Alchemical/Fair Folk) and 23 rows
carrying a Sidereal-specific reinterpretation flagged in that row's own
`notes` — most notably **Priest** (all Sidereal Exalted are automatic,
free 1-pt. priests of their initiating astrological college), **Destiny**
(Sidereal's own Destiny 4+ pre-Exaltation threshold, one point higher than
Solar/Lunar's 3+, and a four-point post-Exaltation reduction instead of
three), **Lucky** (a bespoke Sidereal luck-pool formula/price cap),
**Greater Curse** (Sidereal's own Paradox-pool mechanic, cross-referenced
to `sidereal-astrology-paradox`, replacing the Limit-pool version used by
Solar/Lunar), and **Dark Fate** (kept selectable but flagged as normally
**exempt** for ordinary Sidereals, who serve the Bureau of Destiny —
purchasable only by a renegade Sidereal who has betrayed that role). No new
Sidereal-specific Background or mechanic needed to be invented; every
reinterpretation substitutes an already-inventoried Sidereal row (e.g.
`sidereal-astrology-paradox`, `terrestrial-circle-sorcery`/
`celestial-circle-sorcery`, `savant-background`) for a Lunar-specific one
that was dropped. See `source-manifest.json`'s `notes` field for the full
inclusion/exclusion/reinterpretation writeup.

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
