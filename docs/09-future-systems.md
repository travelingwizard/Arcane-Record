# 09. Game systems

Game modules register through `GameSystemRegistry`. Mage 20 is registered under
the stable outer ID `mage20`; its definitions remain under
`src/systems/mage-m20` and its adapter under `src/games/mage20`.
Exalted First Edition is registered as `exalted1e` with stable `solar` and
`dragon-blooded` sheet variants.
Burning Wheel Gold + Codex is registered as `burning-wheel` with seven stock
variants. Torchbearer Second Edition is registered as `torchbearer2e` with one
shared adventurer sheet for all stocks and classes.

A system adapter provides:

- a unique system ID and display name;
- its current schema and migration chain;
- a default-character factory;
- field/group definitions and rating limits;
- system-specific editor sections;
- summary, search, rename, duplicate, editor, and migration adapters;
- isolated reference catalogs and selection rules where the system needs them.

The shared repository treats game data as opaque. Cross-system UI resolves a
registered adapter instead of branching on labels or IDs. Mage-only features
such as affinity Spheres remain inside the Mage module.

## Mage Magick sections

Focus, Wonders, and Rotes are Mage-specific implemented systems. Their supplied
research, stable reference records, character-owned data shapes, migration,
section anchors, testing requirements, and remaining content-verification work
are documented in
[13. Focus, Wonders, and Rotes implementation plan](13-magick-sections-plan.md).

Reference descriptions and citations belong in Mage catalog data; character
records store stable references and character-specific values. Rules guidance
remains non-blocking unless a later milestone explicitly adds optional rules
assistance.

## Mage Equipment

Equipment is implemented as Mage reference data plus character-owned
selections. The catalog is not a combat calculator and does not mutate traits.
See [14. Equipment implementation record](14-equipment-implementation.md).

## Combat and Do Maneuvers

`Do*` is the final Skill. Maneuvers are implemented as a universal Combat
Reference plus character-specific known Do selections. Combat favorites do not
mean a maneuver was purchased or learned. Do selection is non-blocking and
does not depend on or enforce an Ability rating.

The Final Blow remains a Rote and is intentionally excluded from Maneuvers.
See
[Combat and Do Maneuvers](features/combat-and-do-maneuvers.md).
