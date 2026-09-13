# Exalted 1e — Alchemical source intake

**Status: source intake in progress.** `Exalted: The Autochthonians` has been
supplied and 175 inventory rows are checked in under `inventory/`. See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory follows.

Note: the family in this repository's data model is `alchemical`, but its
source book's real title is *Exalted: The Autochthonians* (not "The
Alchemicals"); `bookId`/`bookLabel` in `source-manifest.json` use the real
title, matching this project's prior naming correction.

## What's inventoried so far

- `source-manifest.json` — the one source book in scope so far
  (`exalted-the-autochthonians`); supplements are not yet added.
- `inventory/exalted-the-autochthonians.json` — 175 rows covering:
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

## What's still needed

1. **Resume point: the rest of Chapter Four, "Miracles of the Machine
   God"** (printed pp. 159-195/PDF 160-196), immediately after the
   weaving-protocol catalog above — Autochthonia setting/artifact/mortal
   material not yet reviewed for additional inventoriable
   character-creation-relevant mechanics.
2. Martial Arts Charms specific to Alchemicals: covered so far via
   Perfected Lotus Matrix (which grants access to ordinary published
   Martial Arts Charms, out of this book's scope) and the Alchemical
   Martial Artists style-availability sidebar; no separate Alchemical-only
   Martial Arts Charm system was found anywhere in Chapter Three.
3. Chapters Five through Seven (The Locust War, The Quest for the Great
   Source, Engines of Extinction, pp. 196-297/PDF 197-298) — these are
   presented as adventure-seed chapters, not further character-creation
   rules, and have not been reviewed for any additional inventoriable
   mechanics.
4. Any Alchemical-facing supplements, if their mechanics are complete and
   in scope.
5. Alchemical-specific Merits/Flaws beyond Gremlin Syndrome: checked, none
   found anywhere in Chapter Two's edges, the whole of Chapter Three, or
   the weaving-protocol catalog reviewed so far; worth one more pass once
   the rest of Chapter Four is reviewed in case any appear there.

## Do not add yet

- Do not add a production catalog under `src/games/exalted1e/reference/` for
  this family — that only happens after inventory rows are visually reviewed
  against the rendered source page.
- Do not add `alchemical` to `exaltedSheetTypes` in
  `src/games/exalted1e/definitions.ts` — that stays out of scope until all
  five planned families are certified together.
