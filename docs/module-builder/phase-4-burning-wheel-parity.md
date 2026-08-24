# Phase 4: Burning Wheel parity and large catalogs

## Result

The existing Burning Wheel Gold + Codex editor is the trusted bundled adapter
for this phase. It supports Man, Dwarf, Elf, Orc, Roden, Great Wolf, and Troll
without changing new-character defaults for Mage or Exalted. All seven stocks
share the same versioned Zod character schema, browser-local repository,
navigation chrome, Settings, appearance, autosave, and JSON/YAML interchange.

The normalized Charred Black snapshot contains exactly 613 lifepaths, 493
skills, and 863 Traits with stable unique IDs and indexed lookups. Wizard
material is merged into Man, Path of Spite into Elf, and Roden, Great Wolf, and
Troll content remains stock-specific. Engine tests cover requirements, leads,
age, variable time, repeated lifepaths, diminishing returns, Brutal Life, point
pools, shades, skill roots/opening, Traits, resources, derived attributes,
PTGS, and warnings. An all-stock test proves that every sheet validates and has
legal initial burner choices.

## Play and files

Build mode owns lifepaths and allocations. Play mode protects burn inputs while
leaving Beliefs, Instincts, Artha, wounds, advancement tests, resource tax,
damaged gear, notes, and Experience editable. The original Arcane Record PDF
is generated locally with standard embedded fonts and no source artwork.
Legacy `.char` import/export remains an explicit trusted system adapter and the
UI warns that Arcane Record-only play history is not represented. JSON and YAML
remain the complete lossless formats.

## License and distribution boundary

Charred-derived data stays under `src/games/burning-wheel/gpl-charred-black/`
with GPL-3.0 license text, pinned provenance, source commit, reproducible
catalog-generation scripts, and packaged corresponding-source metadata under
`public/licenses/charred-black/`. Imported modules cannot invoke the `.char`
or PDF adapters and cannot introduce executable content.

This is an engineering compliance inventory, not legal advice. Public release
still requires the project owner's external licensing approval; the application
does not label that approval complete or weaken the GPL notice.
