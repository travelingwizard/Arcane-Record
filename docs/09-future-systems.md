# 09. Future systems

The architecture keeps Mage definitions under `src/systems/mage-m20` so reusable controls, editor state, persistence, and shell layout can later support other game systems.

A future system adapter should provide:

- a unique system ID and display name;
- its current schema and migration chain;
- a default-character factory;
- field/group definitions and rating limits;
- system-specific editor sections;
- import/export serializers.

The repository stores the system identifier with each character. Cross-system UI must branch through registered adapters, not scattered label checks. Mage-only features such as affinity Spheres remain inside the Mage system layer.
