# 09. Future systems

The architecture keeps Mage definitions under `src/systems/mage-m20` so reusable controls, editor state, persistence, and shell layout can later support other game systems.

A future system adapter should provide:

- a unique system ID and display name;
- its current schema and migration chain;
- a default-character factory;
- field/group definitions and rating limits;
- system-specific editor sections;
- import/export serializers and migration rules.
- isolated reference catalogs and selection rules where the system needs them.

The repository stores the system identifier with each character. Cross-system UI must branch through registered adapters, not scattered label checks. Mage-only features such as affinity Spheres remain inside the Mage system layer.

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

## Maneuvers handoff

`Do*` is the final implemented Skill. A conditional Maneuvers section is
deferred until its Do and Martial Arts maneuver definitions are supplied. The
future section should follow the Merits and Flaws catalog/selection pattern and
remain hidden when its qualifying Ability condition is not met; the exact
trigger and maneuver records will be finalized with that content.
