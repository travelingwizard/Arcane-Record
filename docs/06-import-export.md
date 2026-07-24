# 06. Import and export

The File Exchange section exports the active character as JSON or YAML and imports `.json`, `.yaml`, and `.yml` files. All processing stays in the browser.

The boundary:

1. serialize only character data, excluding view preferences and save status;
2. include `systemId` and `schemaVersion`;
3. validate imported data with Zod before any write;
4. migrate valid older Mage records to the current schema;
5. assign a new UUID and timestamps when importing as a copy;
6. add `(Imported)` to a named character or use `Imported mage` when unnamed;
7. surface parsing and validation errors without replacing an active character;
8. perform all parsing locally with no uploads.

`js-yaml` handles YAML serialization and parsing. Successful imports are opened as new records and then follow the same autosave flow as any other character.

Selected Merits and Flaws export only their selection UUID, definition ID, chosen cost, notes, and addition timestamp. Known definitions must use a legal catalog cost and the correct Merit or Flaw list. Unknown definition IDs are preserved as unresolved references; they remain visible and removable rather than being silently discarded.

Selected Backgrounds export their selection UUID, definition ID, character display name, integer rating, notes, addition timestamp, pooling state, and optional unresolved source name. Known definitions validate minimum and maximum ratings, the extended interface maximum of ten, duplicate rules, and pooling support. Unknown definition IDs remain visible, removable, and repairable. They are not assigned an invented cost multiplier.

Section expansion preferences and the transient active section are excluded
from both formats. Importing a character creates a fresh ID and therefore a
fresh, independent section-preference key.
