# Changeling: The Dreaming 20th Anniversary module

The `changeling20` module is a local-first adaptive creator and play sheet. Its required authority is _Changeling: The Dreaming 20th Anniversary Edition_. The official interactive sheet is used only to check field hierarchy. _Book of Storyteller Secrets_, _The Autumn People_, and _The Enchanted_ are optional legacy sources and default off.

## Source and automation policy

- Every selectable definition has a stable `c20.*` identifier, source ID, printed page, compatibility state, and verification state.
- Core C20 rules win conflicts. Legacy identifiers are retained as aliases when a reconciled definition exists.
- Disabled sources hide new choices but never remove saved records.
- Only `rules-reviewed` definitions may drive automatic budgets or XP pricing. Citation-only material remains reference-only.
- Dauntain and Thallain require mature-content opt-in plus a specific Storyteller approval before objective exceptions may be finalized.

## Implemented lifecycle

The module exposes guided and blank entry actions, Mage-style navigation and fields, Build/Play modes, creator allocations, structured Tempers, separate real and chimerical damage, Society and Possession records, a ledger-derived XP workflow, local autosave, and JSON/YAML export. Backgrounds are intentionally excluded from XP purchases.

The runtime never loads source PDFs, portraits, artwork, logos, textures, fonts, telemetry, or remote character data.
