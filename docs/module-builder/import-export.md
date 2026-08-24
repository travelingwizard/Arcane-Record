# Module and character interchange

## Formats and separation

JSON is Arcane Record's canonical serialization. YAML is an alternate encoding
of the same validated value. Four artifacts remain distinct:

| Artifact          | Purpose                                                     | May contain catalogs/assets?                                           |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Character file    | Portable character-owned data                               | No complete catalogs; selected IDs and owned/custom data only.         |
| Module file       | Installable declarative game package                        | Yes, module definitions and citations; assets initially metadata-only. |
| Module draft file | Continue builder work, including invalid draft diagnostics  | Definitions plus builder metadata; never directly activatable.         |
| Future archive    | Offline backup with character and exact dependency packages | Yes, by an explicitly different archive format and warning.            |

A `.char` legacy Burning Wheel file and browser-generated PDF remain optional
system adapters. They are neither module files nor normal Arcane character
files. `.char` export must retain its lossy-data warning.

## Character envelope compatibility

Current format-version-1 JSON/YAML character files continue to import through
the code system registry. A version-2 envelope adds optional module provenance:

```ts
interface CharacterFileV2 {
  format: 'arcane-record-character';
  formatVersion: 2;
  exportedAt: string;
  character: StoredCharacter & { moduleRef?: CharacterModuleRef };
}
```

Module-backed characters include exact module/sheet/template/overlay references
but no package contents. A missing module results in a staged “required module
unavailable” state and the user may keep/import the raw character for later
repair. Import never discards unresolved definition IDs.

Normal export contains:

- shared character envelope and module references;
- scalar ratings and values;
- selected definition IDs;
- UUIDs, owned labels/names, choices, notes and state;
- custom entries, explicit permitted overrides, links, ledgers, and creation
  progress required by the sheet.

It excludes complete catalogs, source prose not copied into owned notes, runtime
indexes, formula caches, theme/preferences, draft history, and credentials.

## Module envelope and filenames

Installable files use the envelope in `module-schema.md` and extensions
`.arcane-module.json` or `.arcane-module.yaml`. Draft files use
`arcane-record-module-draft` and cannot be installed until validation creates an
installable snapshot. Filenames are sanitized display hints only; internal IDs
come from validated content.

Canonical export sorts object keys deterministically, preserves declared array
order, uses UTF-8 and LF, emits finite JSON values only, and ends with a newline.
YAML export uses the same normalized value, no anchors/aliases, no custom tags,
and safe scalar styles. Imported YAML is converted to plain JSON values before
Zod validation.

## Staged module import

1. Read a user-selected local file into memory. Do not write IndexedDB.
2. Enforce byte limit and permitted extension/MIME hints.
3. Parse JSON or safe YAML with alias, nesting, scalar, and collection limits.
4. Normalize to prototype-free JSON values and reject prohibited keys.
5. Validate format and supported `formatVersion`.
6. Validate module schema, stable IDs, references, defaults, and licenses.
7. Resolve dependencies and inheritance against a read-only installed snapshot.
8. Type-check paths/formulas/actions, detect cycles/loops, validate flows and
   migrations, and enforce complexity budgets.
9. Calculate canonical checksum and compare with supplied checksum when present.
10. Show a preview: identity/version/author/license, games/sheets/catalog counts,
    dependencies, local-only capabilities, diagnostics, and install conflicts.
11. Let the user cancel, replace the staged file, or approve an allowed install.
12. In one repository transaction, write the immutable package, installation
    metadata, exact resolution lock, and activation state.

There is no permissions prompt suggesting code/network access because modules
never possess those capabilities. The preview explicitly states that a module
can read and modify only data in characters created with its activated sheets
through registered components/actions.

## Conflicts and dependencies

- Same module ID and same version with same checksum: already installed; no-op.
- Same ID/version with different checksum: reject as immutable-version conflict.
- New compatible version: install side-by-side; do not migrate characters until
  the user previews and approves migration.
- Missing required dependency: allow staging/export but not activation.
- Incompatible core version or unknown component: install as incompatible only
  if recovery value is clear; never activate.
- Overlay target absent/incompatible: install disabled with diagnostics.
- Local fork ID collision: reject; never overwrite a fork.

Dependencies are not downloaded implicitly during local import. A later server
catalog may offer an explicit “Review dependencies” workflow with checksums.

## Character import

Character import remains separate from module installation:

1. parse and validate the file envelope;
2. resolve the exact code system or module interpreter;
3. run its complete migration chain on a clone;
4. preserve missing module/definition references with diagnostics;
5. show character name/game/module, version changes, unresolved items, and ID
   conflict behavior;
6. assign a fresh character UUID for ordinary import unless the user is using a
   distinct restore workflow;
7. write through `CharacterRepository` only after approval.

The current direct character-import UI should be wrapped in staging before
module-backed characters ship. Legacy Mage files still route through the Mage
adapter; Charred `.char` files through the Burning Wheel adapter.

## Export and backup behavior

Character JSON remains the default Save format and YAML an explicit option.
Module export validates the exact snapshot first. Official/published packages
may be re-exported byte-for-byte with provenance, but local edits require an
overlay or fork with new identity.

A future archive may bundle a character, exact module/dependency/overlay
packages, checksums, and a manifest. It must use a visibly distinct format and
must not be accepted by the normal character importer. Asset-bearing archives
require a separate zip/path-traversal and decompression-bomb threat review.

## Migrations and transactional safety

Import migrations never modify the input object. They produce an audit preview
of source/target versions and declarative operations, validate the result, and
commit only the final result. Failure keeps the original file and any existing
installed/character record untouched.

Installed module upgrades are side-by-side. Character migration initially
creates a new converted copy with a provenance link and retains the original.
Once rollback and parity are proven, a later phase may offer in-place upgrade
with a retained pre-migration snapshot.

## Resource limits

Exact values require benchmarks, but the implementation must configure and test
limits for file bytes, JSON/YAML depth, mapping keys, string length, catalog
entries, definitions, AST nodes, graph edges, migrations, and assets. YAML
aliases/custom tags, duplicate mapping keys, non-finite/timestamp/object coercion,
and prototype keys are rejected. Oversize diagnostics name the exceeded budget
without rendering the untrusted content.

## Checksums and signatures

Local files may include a checksum, but a checksum proves integrity, not trust.
Published packages require a server-recorded checksum over canonical JSON.
RFC 8785 JSON Canonicalization Scheme is recommended, pending library and cross-
browser evaluation. Cryptographic publisher signatures are an unresolved future
decision and must not be simulated with local trust labels.

## Tests

- JSON and YAML normalized round trips and deterministic export;
- format-version-1 character compatibility and version-2 module references;
- catalog exclusion from normal character exports;
- selected/custom/unresolved record preservation;
- safe YAML restrictions, prototype keys, depth/count/size budgets;
- stable ID, dependency, inheritance, formula/action/flow/migration diagnostics;
- same-version checksum conflict and side-by-side upgrade;
- cancellation and failure leave IndexedDB unchanged;
- missing module/definition recovery;
- legacy Mage and `.char` adapters;
- future archive rejection by normal importers;
- accessible staging dialog and keyboard-only approval/cancel flow.

## Open decisions

- Concrete size/complexity budgets after catalog/mobile benchmarks.
- RFC 8785 library choice and whether local exports include checksums.
- Character restore semantics versus ordinary fresh-ID import.
- Asset archive format and accepted media, if any.
- Whether published package signatures are necessary in addition to TLS and
  registry checksums.
