# 00. Project charter

## Goal

Deliver a trustworthy browser-local, multi-game character record. Shared pages
remain game-neutral; Mage 20 is the first complete game module and retains its
responsive vintage-sheet treatment.

## Milestone outcomes

- A game-neutral character library with search, game filters, explicit game
  selection, import, open, duplicate, export, and confirmed delete actions.
- Solar and Dragon-Blooded Exalted First Edition foundations with separate
  creation choices, sheet-specific first-page structures, and shared local
  persistence.
- A Burning Wheel Gold + Codex guided burner and play sheet for all seven
  Charred Black stocks, with game-owned enforcement warnings and overrides.
- A Torchbearer Second Edition editable two-page adventurer record covering
  identity, drives, traits, rewards, conditions, abilities, skills, Wises,
  inventory, relationships, magic, advancement, and notes.
- A focused editor for identity, Attributes, Abilities, Spheres, affinity,
  Enlightenment traits, Combat and Do Maneuvers, Backgrounds, Merits & Flaws,
  Focus, Wonders, Rotes, Equipment, and Health.
- A cited, searchable Background catalog with dot ratings, character labels, and warning-only creation-point accounting.
- A cited, searchable Merits and Flaws catalog with warning-only creation-point accounting.
- Searchable reference-preview catalogs for Paradigms, Practices, Instruments,
  Wonders, and Rotes, plus custom character entries.
- A searchable reference-preview catalog for weapons, armor, and field gear,
  plus custom Equipment requiring a name and description.
- A universal, searchable Combat Reference with character favorites and custom
  entries, plus the nine official M20 Special Do Techniques, structured custom
  techniques, and preserved Legacy selections.
- Interchangeable list and desktop-wheel Sphere views backed by the same character data.
- Validated, browser-local JSON and YAML import/export.
- Debounced persistence through a repository abstraction backed by Dexie/IndexedDB.
- Honest save status and clear local-storage language.
- Typed, runtime-validated character data and automated coverage of completed behavior.
- Responsive section navigation with stable URL fragments, a desktop sticky
  rail, mobile disclosures, and browser-local per-character expansion
  preferences.

## Non-goals

No backend, accounts, synchronization, online backup, analytics, third-party
runtime resources, fake game modules, or empty future-game placeholders. The
Burning Wheel module is an explicit exception to the original editable-sheet
rules-engine boundary: it implements the requested character-burning rules
inside that module without changing Mage or Exalted behavior.

## Assumptions

1. The requested repository path did not exist and no Git repository or project files were present when work began. The directory and local repository are therefore created as part of this milestone.
2. `docs/references/mage-m20/Mage-Arcane-Vintage-Sheet.pdf` was absent. A matching two-page file named `Mage_The_Ascension_–_Arcane_Character_Sheet_(Vintage_Edition).pdf` was found in the user's Downloads folder, visually inspected, and copied to the requested repository location as the reference.
3. Identity fields may be blank. The display name falls back to "Untitled mage".
4. New Attributes begin at 1, matching the familiar printed-sheet baseline; Spheres begin at 0. Point-allocation rules are not enforced.
5. Shared routes use the History API. `/characters/:id` resolves the owning
   module from the stored system ID and survives refresh through the production
   SPA fallback.
6. Imported records are always created as new characters with fresh IDs so an import cannot silently overwrite an existing record.

## Success measures

The primary flow survives a reload, all requested automated tests pass, the production build succeeds, and the editor works without page-level horizontal scrolling at 320px.
