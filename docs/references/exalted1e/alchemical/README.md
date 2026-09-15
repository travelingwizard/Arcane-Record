# Exalted 1e — Alchemical source intake

**Status: source intake in progress.** `Exalted: The Autochthonians` has been
supplied and reviewed cover-to-cover, and the `Exalted Players Guide`'s
universal Merits & Flaws chapter has been derived on top of it. Two more
small universal artifact catalogs have since been layered on: six rows
derived from the `Exalted Storyteller's Companion`'s universal Chapter Four,
and eight rows freshly transcribed from `Savage Seas`' naval artifact
catalog. 291 inventory rows are checked in under `inventory/`. See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory follows.

Note: the family in this repository's data model is `alchemical`, but its
source book's real title is *Exalted: The Autochthonians* (not "The
Alchemicals"); `bookId`/`bookLabel` in `source-manifest.json` use the real
title, matching this project's prior naming correction.

## What's inventoried so far

- `source-manifest.json` — four source books in scope: the primary
  `exalted-the-autochthonians`; `exalted-players-guide` for the universal
  Merits & Flaws chapter; `exalted-storytellers-companion` for six rows of
  its universal artifact catalog (derived from Lunar's transcription); and
  `savage-seas` for eight freshly transcribed naval artifact rows.
- `inventory/exalted-the-autochthonians.json` — 291 rows covering:
  - The Chapter Two character-creation overview (Concept/Caste/Nature,
    Caste-linked Attributes, the flat 23-dot Ability pool with no Caste or
    Favored discount, Charm Slots and Advantages, Virtues, and Willpower/
    Essence/the two Essence-pool formulas), plus the separate bonus-point
    and experience-cost tables.
  - The universal, caste-agnostic Anima Effect: the five-tier Alchemical
    Anima Banner display table and the Attribute-boost anima power
    available to every Caste.
  - The Alchemical Physiology section: Artificial Metabolism (feeding,
    starvation penalties, disease/toxin immunity), Life and Death (post-
    Incapacitated dissolution and the soulgem), and Refitting/Essence
    Advancement/Evolution (Vat-only growth, and the Essence 6-10 body
    transformations culminating in metamorphosis into a living city-core).
  - All five Castes (Orichalcum, Moonsilver, Jade, Starmetal, Soulsteel)
    with their Caste Attributes, Anima Effects, Associations, Sobriquets,
    and Concepts, plus the apocryphal, Storyteller-only sixth "Adamant"
    Caste sidebar.
  - The full Clarity Trait (the Limit-Trait analog): gaining Clarity
    (Inhuman Essence, Suppressing Virtues, Forsaking Humanity, Charms),
    losing it (Human Contact, Embracing Virtue), the 0-10 Effects of
    Clarity table, and the Playing/Storytelling Clarity guidance — plus
    Clarity's corrupted mirror Trait, Dissonance (the Gremlin Syndrome
    Flaw, confirmed the only Alchemical-specific Merit/Flaw in the book
    after a full-text check of Chapter Two's edges and all of Chapter
    Three).
  - The two new Backgrounds (Class, which subsumes Followers/Influence/
    Resources; and Vats, plus its Building Vats in Creation sidebar) and
    the four altered Backgrounds (Artifact, Backing, Familiar, Manse), and
    the Followers/Influence/Resources exclusion note.
  - Chapter Three's Charm-system framing: Charm Slots and Panoplies,
    Submodules, Arrays (the Alchemical Combo analog), Designing New
    Charms, Eclipse/Moonshadow Caste access to Alchemical Charms, and the
    chapter's Charm-format/limitations conventions (the "permanent" Type,
    Prerequisite Charms meaning already-installed/Panoply-held Charms, the
    lack of a universal perfect defense, and Essence 8+ "municipal"
    Charms).
  - The two General Charms (Transitory Augmentation of (Attribute) and
    Sustained Augmentation of (Attribute), each a set of nine
    per-Attribute Charms).
  - The complete Close Combat Charms tree (15 Charms: Tactical Analysis
    Engrams, Accelerated Response System, Dynamic Reaction Enhancement
    System, Celerity Enabling Module, Anticipatory Simulation Processor,
    Polymodal Joint Bearings, Limb Extension Armatures, Multi-Limb Frame,
    Hyperdextrous Tentacle Apparatus, Integrated Arsenal Upgrade,
    (Material) Synthesis Wave Emitter, Transcendent Multimodal Weapon
    Matrix, Electrification Onslaught Dynamo, Chemical Fog Generator, and
    Perfected Lotus Matrix — the Charm that grants Alchemicals access to
    ordinary Martial Arts Charms), plus the Alchemical Martial Artists
    sidebar listing the specific styles available (Snake, Tiger, Mantis,
    Ebon Shadow, Celestial Monkey, Righteous Devil, Violet Bier of Sorrows,
    Five Dragon, Jade Mountain).
  - The complete Ranged Combat Charms tree (11 Charms: Aim-Calibrating
    Sensors, Paramagnetic Tether Beam, Essence Pulse Cannon (with its ten
    named submodules), Interceptor Spark Emitter, Pulseweb Entanglement
    Burst, Protosynthetic Ammunition Replicator, Repeating Pneumatic Bow
    (with its two submodules), Subluminous Onslaught Missile, Hundredfold
    Strafing Methodology, Transmodal Rapid Targeting System, and Dedicated
    Harmonic Targeting).
  - The complete Might and Mobility Charms tree (14 Charms across its two
    tree diagrams: Strain Resistant Chassis Modification, Pain Suppression
    Nodes, Subcutaneous/Exoskeletal Armor Plating, Aegis Integration
    System, Essence Shield Projector, (Element-)Inured Frame (one row
    covering all five per-element variants: Crystal/Lightning/Oil/Metal/
    Steam), Insectile Locomotion Upgrade, Alloyed Reinforcement of Flesh,
    Personal Gravity Manipulation Apparatus, Parabolic Leap Overcharger
    Device, Plasma Thruster Assembly, Fluidic Impeller Drive, Electroneural
    Control Spurs, and Universal Pilot Key).
  - The complete Social Charms tree (12 Charms across its two diagrams:
    Pattern Facilitation Module, Synergy-Promoting Upgrade, Perfection of
    Assembly, Thousandfold Courtesan Calculations, Emotive Aesthetics of
    the Body Electric, Empathy Simulation Engine, Transcendent Brutality
    Programming, Conceptual Entropy Module, Motivational Vocoder,
    Personality Override Spike, Mind-Ripping Probe, and Memory
    Implantation Surge), plus the "Identifying Charms" general sidebar
    rule (Intelligence + Occult to deduce an installed Charm's function)
    that sits between the Social and Stealth/Disguise trees.
  - The complete Stealth and Disguise Charms tree (9 Charms: Integrated
    Artifact Transmogrifier, Voice Distortion Field, Pheromone Regulation
    Systems, Husk-Sculpting Apparatus, Essence Dormancy Mode, Optical
    Shroud, Essence Veil, Dynamic Cloaking Module, and Aura-Dampening
    Component).
  - The complete Sensory and Spiritual Charms tree (10 Charms across its
    two diagrams: Optical Enhancement (with its seven ocular submodules),
    Chemical Analysis System, Tympanal Receptor Upgrade, Deception
    Recognition Module, Mobile Sensory Drone (with its seven drone
    submodules), Interpolative Situational Analysis Processor, Soulgem
    Detector, Cross-Phase Scanner, Transphase Engine, and God-Ward
    Projector).
  - The complete Medical Charms tree (11 Charms across its two diagrams:
    Sustenance Replication Engine, Toxicity Filtration Subsystems,
    Biofunction Inhibitor, Restorative Fusion Transponder, Body-Reweaving
    Matrix, Diagnostic Sensor Apparatus, Biosight Reticle, Biostasis Field
    Projector, Multifunction Hypodermic Apparatus (with its 14-formula
    drug catalog), Regenerative Essence Transfusion, and Metabolic
    Augmentation Injection).
  - The complete Cognitive Charms tree (9 Charms: Imprinted Data Cluster,
    Clarified Data Assimilator, Abstract Abacus Implant, Technological
    Analysis Engrams, Omnitool Implant, Synaptic Acceleration Node,
    Incomparable Efficiency Upgrade, Logic Engineering Lobe, and Eidetic
    Processing Core).
  - The complete Essence and Weaving Charms tree (3 Charms: Auxiliary
    Essence Storage Unit, Man-Machine Weaving Engine, and God-Machine
    Weaving Engine) — this is Chapter Three's final Charm tree, so **all of
    Chapter Three (pp. 87-141/PDF 88-142) is now fully inventoried.**
  - **The full Alchemical weaving-protocol catalog from Chapter Four (49
    rows, printed pp. 142-159/PDF 143-160)**: the framing/overview rows
    (`alchemical-protocols-overview`, `man-machine-protocols-framing`,
    `god-machine-protocols-framing`, the `what-works-where-sidebar` and
    `spells-that-crossed-over-sidebar` GM-facing notes), the six elemental
    Golem/automaton Man-Machine protocols (Engine/Glass/Magnet/Oil/
    Smudge/Steel Golem), and the full remaining list of named Man-Machine
    and God-Machine weaving protocols (e.g. Automaton Override Protocol,
    Binding Filament System, Crystal Lotus of Repose, Docility Assurance
    Field, Driving the Shadow Machine, Elsewhere-Evoking Asana, Entropy
    Manipulation Protocol, Essence Reallocation Protocol, Lightning
    Elemental Concatenation Protocol, the Maker's Basic/Advanced Defense
    Array, the Maker's Instantaneous Forge, Optimized Component
    Integration Protocol, Phlogiston Web, Plague of Bronze Snakes,
    Probability Degradation Matrix, Sonic Hammer Vocalization, Soul
    Archiving Protocol, Static Essence Absorption Protocol, Summon
    Autochthonian Elemental, Summon Machine Spirit, Theoplastic
    Engineering Protocol, Vat-Surrogate Reweaving Technique,
    Vision-Transmitting Protocol, Auspicious Reformatting Mudra, Destiny
    Optimizing Meditation, Essence Matrix Inversion Procedure, Executive
    Filature Protocol, Homuncular Drone Deployment, Incarnation of
    Bestial Malice, Instantaneous Transfer Protocol, Machine-Soul Essence
    Baffle, Maser Palm Technique, Passenger-Hosting Protocol, Pattern
    Suspension Protocol, Radiant Matrix Transmutation, Transcendent
    Consciousness Protocol, and Transcendent Pattern-Weaving Protocol),
    all cross-referenced back to the Man-Machine/God-Machine Weaving
    Engine Charms they run through. This closes out the catalog
    explicitly promised by those two Chapter Three Charms.
  - **The rest of Chapter Four, "Miracles of the Machine God" (31 more
    rows, printed pp. 161, 180-195/PDF 162, 181-196)**: the three
    Autochthonian-only alchemical formulae (Sweet Sleep Surrogate Syrup,
    Friction Banishing Preparation, and the restricted The Maker's
    Inertial Bile), the Machines in the Machine God Efficiency/Inspiration
    sidebar, and the complete Autochthonian Technology, Warfare, and
    Transportation sections: 15 Artifact-rated (or mortal Resources-rated)
    items — Artificial Textiles, Filter Mask, Photo-Resonant Gel, Arc
    Protector, Autolabe, Essence Capacitor, Flaw Scanner, Light
    Amplification Visor, Light Sphere, Omnimodal Wardrobe Unit, Portable
    Nutriment Recycling Engine, Respirator Module, Courier Drone,
    Soulgem, and Industrial Exoskeleton — plus the Warfare-section
    Crossbows, Fiber-Weave Bodysuit, Gyroscopic Chakram (with all six
    Magical Material variants), the Thousand Wounds Gear Style martial
    art built around it, and the signature Beam Klave (with its
    beam-axe/beam-lance/beam-talon conversions), and the
    Transportation-section Pneumatic Trams, Mechanical Rickshaw,
    Skimmercraft, and Aerial Skiff (with its oil-diver and
    combat-reconnaissance/transport variants). Chapter Four's remaining
    Storyteller-side lore, NPC stat blocks, and pure setting flavor
    (Autochthonian Thaumaturges' Summoning/Warding/Exorcism/Enchantment/
    Geomancy subsections, the Eight Divinities and The Core, Custodians,
    Drones, Design Weavers, Destroyers, Gremlins, Autochthonian
    Elementals, Spirit Charms, the Alternative Machine Virtues sidebar,
    and The Secret of Soulsteel lore sidebar) was reviewed and
    intentionally excluded as having no character-creation relevance for
    Alchemical player characters, the same way this project scopes out
    pure-lore material elsewhere. All of Chapter Four (printed pp.
    142-195/PDF 143-196) has now been reviewed; the parts of it worth
    inventorying are inventoried.
  - **Chapters Five through Seven** (The Locust War, The Quest for the
    Great Source, Engines of Extinction, printed pp. 196-297/PDF 197-298)
    have now been reviewed as a scan/triage pass, as befits their nature
    as adventure-seed/campaign chapters rather than further
    character-creation rules chapters. Nearly all of their content —
    war/invasion timelines and plot, Storyteller/NPC stat blocks (named
    Alchemical Storyteller characters and their personal bound artifacts,
    the Deathlord First and Forsaken Lion's full stat block, mortal NPCs),
    creature templates built purely as GM antagonists (Alchemical beasts,
    glass beasts), Alchemical Manse adventure-site/puzzle-room
    descriptions, and mortal/Deathlord-side body-augmentation technology
    and necrotechnology — was reviewed and intentionally excluded as
    adventure plot, GM advice, or NPC/antagonist-only content, the same
    way pure lore and Storyteller-side material is scoped out elsewhere in
    this book. Exactly **one** genuinely player-facing,
    character-creation-relevant mechanic was found and added: the
    **Steamcar, Refurbished** (printed p. 238/PDF 239, Chapter Six), a
    fully stat-blocked Autochthonian expedition vehicle (soak, health
    levels, speed, maintenance/repair rules, and Charm ports for the
    Electroneural Control Spurs and Universal Pilot Key Charms) of the
    same kind as Chapter Four's Mechanical Rickshaw, Skimmercraft, and
    Aerial Skiff. **All seven chapters of Exalted: The Autochthonians (the
    entire book) have now been reviewed** for Alchemical
    character-creation-relevant material.

- **The Exalted Players Guide's universal Chapter One, "Merits and Flaws"**
  (70 rows: 35 merits + 35 flaws, `pg-merit-*`/`pg-flaw-*` ids). *Exalted:
  The Autochthonians* itself has no dedicated Merits/Flaws chapter beyond
  the Alchemical-exclusive Gremlin Syndrome/Dissonance Flaw (see above); the
  universal Players Guide chapter fills that gap. These 70 rows were
  **derived from Lunar's already-verified transcription** of all 88
  `pg-merit-*`/`pg-flaw-*` rows
  (`docs/references/exalted1e/lunar/inventory/exalted-the-lunars.json`)
  rather than independently re-read from the source PDF, per the project
  owner's instructions: that chapter is explicitly universal across all
  five planned Exalted families, and each Lunar row's own `notes` field
  already documents any splat-specific eligibility/cost caveats verbatim.
  Each of the 88 rows was evaluated against those caveats plus Alchemical's
  own core-book rules to decide inclusion, exclusion, or adaptation. 18 of
  the 88 were skipped as wholly inapplicable to a soulless, vat-built
  construct Exalt: 9 merits (Selective Conception, Mutation, Prodigy,
  Terrestrial Bloodline, Past Lives, Taint's Warning, Legendary Breeding,
  Eternal Vow, Brigid's Heir) and 9 flaws (Sterile, Limited Forms, Known
  Anathema, Child, Chimera, Permanent Caste Mark, Greater Curse,
  Death-Taint, Throwback) — either explicitly restricted to other splats by
  the source's own header text, or ruled out by Alchemical's construct
  nature (no blood/breeding lineage, no reincarnation cycle, no Sorcery
  access, already-baseline sterility, no childhood growth phase). Several
  included rows required adaptation, each flagged verbatim in that row's
  own `notes` field: Large Size/Small reframed against Alchemical's own
  Essence-linked size growth instead of Lunar shapechanging; Disfigured/
  Unusual Appearance reframed around chassis damage/material finish instead
  of flesh; Dying reframed as a fatal structural/Essence-flow failure
  instead of biological illness; Sun-Seared flagged as only directly
  relevant once a story reaches Creation, since Autochthonia has no natural
  sun; Cache/Debt adapted to use the Class Background instead of Resources
  (which Alchemicals do not have); Heir Apparent adapted to a
  patron/benefactor instead of parents; Vice/Derangement cross-referenced
  to Clarity instead of the Great Curse; and Hidden Manse kept selectable
  but flagged as conditional on the Manse Background's own
  post-Locust-Crusade availability (see `manse-background-altered`).

- **Six rows derived from the Exalted Storyteller's Companion's universal
  Chapter Four, "Further Wonders"** (`artifact-ghost-cestus`,
  `artifact-sling-bow-of-ice`, `artifact-the-golden-viper`,
  `artifact-land-ship`, `artifact-singing-staff`,
  `artifact-eye-of-autochthon`). This chapter is a universal, non-splat-
  restricted artifact catalog; Lunar's inventory already records these six
  rows as the verified master copy for exactly this kind of cross-family
  derivation, so they were not independently re-read here. Each row keeps
  the same id/name/mechanics/cost/citation as the Lunar source and adds an
  Alchemical-specific note. All six transfer essentially cleanly, since
  none of their mechanics depend on a biological body (unarmed combat,
  Essence + Archery/Sailing/Performance rolls, or an autonomous owned
  servant). Two judgment calls are flagged in their own notes: **The
  Golden Viper**'s bite turns a victim's "flesh" to gold, which is
  ambiguous for a vat-built Alchemical body that already incorporates the
  Five Magical Materials rather than ordinary flesh (kept selectable since
  its primary owned-servant use case has no flesh dependency at all); and
  the **Eye of Autochthon**, despite being literally "created by the
  Primordial Autochthon" — the very god who built the Alchemical Exalted —
  is written entirely in Creation-native terms (usurping Manses and
  Demesnes, reshaping "the stable lands of the Realm and Threshold"), none
  of which exist inside Autochthonia; kept selectable as the same
  Storyteller-adjudicated plot-device relic Lunar's row frames it as, with
  a note that its stated powers are only meaningful once a story reaches
  Creation.

- **Eight rows freshly transcribed from Savage Seas' Chapter Four,
  "Artifacts of the Waves"** (`artifact-cargo-preservation-spindles`,
  `artifact-armor-of-aquatic-puissance`, `artifact-steelsilk-sails`,
  `artifact-storm-sapphire`, `artifact-cord-of-winds`,
  `artifact-wavecleaver-daiklaive`, `artifact-light-implosion-bow`,
  `artifact-lightning-ballista`), covering the entire naval artifact
  catalog (printed pp. 123-127/PDF 124-128) through to the end of the
  book's content. This PDF has no text layer, so every row was read from
  pages rendered to PNG images, with the Storm Sapphire Effect Table and a
  couple of dense paragraph endings re-rendered at higher zoom to confirm
  exact wording. All eight are kept `selectable` but flagged with the same
  Autochthonia-has-no-Creation-style-oceans caveat already established for
  Sun-Seared and Hidden Manse above: none of these items have any
  mechanical dependency on a biological body, so an Alchemical can use
  them exactly like any other Exalt, but naval/nautical equipment is only
  obtainable and meaningfully usable once a story reaches Creation's seas,
  since Autochthonia has no equivalent oceans or maritime trade routes. One
  further judgment call: the **Armor of Aquatic Puissance**'s headline
  underwater-breathing benefit is substantially redundant for an
  Alchemical wearer, who already cannot drown and does not breathe except
  to speak (see `alchemical-artificial-metabolism`); its other benefits
  (buoyancy control, doubled swim speed, underwater vision, soak, and two
  Hearthstone sockets) are unaffected. The chapter's earlier "Magics of the
  Sea" Charms section (printed pp. 114-122), which the book's own text
  restricts to Solar/Dragon-Blooded, was intentionally left untranscribed
  as out of scope for Alchemical.

## What's still needed

1. Martial Arts Charms specific to Alchemicals: covered so far via
   Perfected Lotus Matrix (which grants access to ordinary published
   Martial Arts Charms, out of this book's scope), the Alchemical
   Martial Artists style-availability sidebar, and the Thousand Wounds
   Gear Style sidebar (named but with no Charms given); no separate
   Alchemical-only Martial Arts Charm system with actual Charms was found
   anywhere in this book.
2. Any Alchemical-facing supplements, if their mechanics are complete and
   in scope.
3. Alchemical-specific Merits/Flaws beyond Gremlin Syndrome: checked, none
   found anywhere in this book — Chapter Two's edges, the whole of Chapter
   Three, all of Chapter Four (including both the weaving-protocol
   catalog and the material reviewed in that pass), and now Chapters Five
   through Seven (including a dedicated full-text search for
   "Merit"/"Flaw" across all three adventure chapters). Gremlin
   Syndrome/Dissonance remains the only Alchemical-specific Merit or Flaw
   found anywhere in the book.

## Do not add yet

- Do not add a production catalog under `src/games/exalted1e/reference/` for
  this family — that only happens after inventory rows are visually reviewed
  against the rendered source page.
- Do not add `alchemical` to `exaltedSheetTypes` in
  `src/games/exalted1e/definitions.ts` — that stays out of scope until all
  five planned families are certified together.
