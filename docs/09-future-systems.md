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

Focus, Wonders, and Rotes remain Mage-specific deferred systems. Their supplied
research, proposed stable reference records, character-owned data shapes,
migration strategy, section anchors, and testing requirements are organized in
[13. Focus, Wonders, and Rotes implementation plan](13-magick-sections-plan.md).

The implementation is deliberately staged: Focus first, Wonders second, and
Rotes third. Reference descriptions and citations belong in Mage catalog data;
character records store stable references and character-specific values. Rules
guidance remains non-blocking unless a later milestone explicitly adds optional
rules assistance.
