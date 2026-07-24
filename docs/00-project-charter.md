# 00. Project charter

## Goal

Deliver a trustworthy browser-local vertical slice of an editable Mage M20 character sheet. The experience should feel like an interactive vintage printed sheet while remaining responsive and accessible.

## Milestone outcomes

- A character library with create, open, rename, duplicate, and confirmed delete actions.
- A focused editor for identity, Attributes, Abilities, Spheres, affinity, Enlightenment traits, Health, and Merits & Flaws.
- A cited, searchable Merits and Flaws catalog with warning-only creation-point accounting.
- Interchangeable list and desktop-wheel Sphere views backed by the same character data.
- Validated, browser-local JSON and YAML import/export.
- Debounced persistence through a repository abstraction backed by Dexie/IndexedDB.
- Honest save status and clear local-storage language.
- Typed, runtime-validated character data and automated coverage of completed behavior.

## Non-goals

No backend, accounts, synchronization, online backup, rules engine, deployment, analytics, third-party runtime resources, or full page-two editing.

## Assumptions

1. The requested repository path did not exist and no Git repository or project files were present when work began. The directory and local repository are therefore created as part of this milestone.
2. `docs/references/mage-m20/Mage-Arcane-Vintage-Sheet.pdf` was absent. A matching two-page file named `Mage_The_Ascension_–_Arcane_Character_Sheet_(Vintage_Edition).pdf` was found in the user's Downloads folder, visually inspected, and copied to the requested repository location as the reference.
3. Identity fields may be blank. The display name falls back to "Untitled mage".
4. New Attributes begin at 1, matching the familiar printed-sheet baseline; Spheres begin at 0. Point-allocation rules are not enforced.
5. This milestone has one active editor route represented by client state rather than URL routing. Refresh reopens the last edited character when it still exists.
6. Imported records are always created as new characters with fresh IDs so an import cannot silently overwrite an existing record.

## Success measures

The primary flow survives a reload, all requested automated tests pass, the production build succeeds, and the editor works without page-level horizontal scrolling at 320px.
