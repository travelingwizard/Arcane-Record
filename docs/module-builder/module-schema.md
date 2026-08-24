# Declarative module schema

## Design goals

The module format is portable, deterministic, versioned, declarative, and safe
to validate without executing content. JSON is canonical. YAML is an alternate
human-editable representation of the same data model and must round-trip to the
same normalized JSON value.

This document describes the Phase 1 contract. Field names are proposed and must
be encoded as Zod discriminated unions before activation.

## Envelope

```ts
interface ArcaneModuleEnvelope {
  format: 'arcane-record-module';
  formatVersion: 1;
  moduleId: string;
  moduleVersion: string;
  name: string;
  description: string;
  author: ModuleAuthor[];
  licenseMetadata: LicenseMetadata;
  minimumCoreVersion: string;
  forkedFrom?: ModuleVersionRef;
  dependencies: ModuleDependency[];
  distribution?: ModuleDistribution;
  gameNodes: GameNodeDefinition[];
  sheetTemplates: SheetTemplateDefinition[];
  reusableComponents: ReusableComponentDefinition[];
  catalogs: CatalogDefinition[];
  diceSystems: DiceSystemDefinition[];
  actions: ActionDefinition[];
  formulas: FormulaDefinition[];
  validationRules: ValidationRuleDefinition[];
  creationProfiles: CreationProfileDefinition[];
  creationFlows: CreationFlowDefinition[];
  themes: ModuleThemeDefinition[];
  assets: AssetManifestEntry[];
  sourceReferences: SourceReferenceDefinition[];
  migrations: ModuleMigrationDefinition[];
}
```

`formatVersion` changes when the Arcane envelope/schema changes.
`moduleVersion` changes when a publisher releases module content. Module
versions are immutable. `minimumCoreVersion` is evaluated before activation,
not merely shown as metadata.

Unknown top-level keys are rejected for imported and published packages. A
future format version may add an explicit `extensions` object with namespaced,
data-only values; Phase 1 should not silently accept one.

## Identity and provenance

Module IDs must match a conservative reverse-domain pattern and be no more than
160 characters. Every definition ID is a lowercase, ASCII, module-local slug,
unique within its definition kind. Cross-references use a structured object,
not a hand-concatenated string:

```ts
interface DefinitionRef {
  moduleId?: string; // omitted means this module
  kind: DefinitionKind;
  id: string;
}
```

Authors contain a display name and optional stable publisher ID. Email and URL
fields are not required. License metadata includes SPDX expression, notice,
source-offer/provenance text, and optional references to license assets. The
runtime displays license obligations but does not claim to determine legal
compatibility.

`forkedFrom` records an exact module ID and version. A dependency specifies a
module ID, supported version range, required/optional status, and purpose.
Optional dependencies cannot be referenced by required sheet paths without a
guarded fallback.

## Game nodes and sheet templates

```ts
interface GameNodeDefinition {
  id: string;
  name: string;
  description?: string;
  parentId: string | null;
  order: number;
  additions?: DefinitionRef[];
  overrides?: DefinitionOverride[];
  availability?: Expression;
  sourceRefs?: string[];
}

interface SheetTemplateDefinition {
  id: string;
  templateVersion: number;
  gameNodeId: string;
  name: string;
  description?: string;
  characterSchema: CharacterSchemaDefinition;
  defaults: JsonObject;
  modes: SheetModeDefinition[];
  navigationGroups: NavigationGroupDefinition[];
  sections: SectionDefinition[];
  componentIds: string[];
  creationProfileIds: string[];
  creationFlowIds: string[];
  legacyAdapters?: LegacyAdapterMetadata[];
}
```

A package has one node with `parentId: null`. Parent references must remain
inside the package in Phase 1. Sheets may target the root or any descendant.
Order affects display only; identity never depends on it.

Child additions merge by kind. An override names an exact inherited target,
lists permitted changed fields, and contains its replacement fragment. It
cannot change the target's stable ID or kind. The resolver rejects circular
parents and ambiguous override targets.

## Character schema vocabulary

Module schemas use a constrained structural vocabulary rather than embedded
JSON Schema or Zod code:

- object with explicit properties and required keys;
- array with item schema, stable-record-ID policy, and optional count bounds;
- string with length and enumerated-value constraints;
- integer and finite number with bounds;
- Boolean;
- literal, enum, nullable, and tagged union;
- stable UUID and definition-reference specializations.

Arbitrary regex, transforms, refinements, defaults that call code, and
prototype-bearing objects are prohibited. Runtime validation additionally
rejects dangerous property names such as `__proto__`, `prototype`, and
`constructor`, excessive depth, excessive collection counts, non-finite
numbers, and duplicate record UUIDs.

Defaults must independently validate. Derived values are not authoritative
character properties unless the game requires a historical snapshot; formulas
normally compute them at render time.

## Character provenance

The existing stored envelope gains an optional module interpretation:

```ts
interface CharacterModuleRef {
  moduleId: string;
  moduleVersion: string;
  gameNodeId: string;
  sheetTemplateId: string;
  sheetTemplateVersion: number;
  dependencyLockId: string;
  enabledOverlayRefs: ModuleVersionRef[];
}
```

Legacy `systemId` and `systemVersion` remain during coexistence. Module-backed
characters may use `systemId: 'arcane-module'` or another explicitly reserved
interpreter ID; this choice is a Phase 1 implementation decision. The
`moduleRef` must never be inferred from a visible game name.

If the package, exact version, sheet, overlay, or definition is missing, the
record remains exportable. The editor shows diagnostics, preserves raw
character-owned values, and offers install, disable-overlay, remap, or custom
entry repair actions where safe.

## Catalogs and instances

Catalog definitions describe their entry schema, indexes, filters, selection
policy, and source fields. A typical entry contains stable ID, name, category,
summary, mechanics, requirements, tags, sources, availability, duplicate
policy, variable costs, and defaults. Full mechanics and citations live in the
module package.

Character selections use UUIDs and store only the definition ID plus owned
label/name, chosen rating/cost, notes, state, choices, explicit overrides, and
links. A module update may improve reference text but cannot overwrite owned
fields. Removed definitions become tombstones or unresolved references; they
are not silently deleted.

Duplicate policies are `forbid`, `allow`, or `allow-with-distinct-choice`.
Variable-cost options are finite declarative options or bounded integer ranges
with rules. A picker cannot add a selection until its required choice validates.

## Templates and components

Sections belong to stable navigation group IDs and reference component IDs.
Reusable components are parameterized component subtrees with typed slots; they
cannot recursively include themselves. Concrete component definitions follow
`component-registry.md` and include data path, modes, layout, conditions,
validation, citation, and accessibility metadata.

Data paths use parsed segments, for example:

```json
{ "root": "character", "segments": ["attributes", "physical", "strength"] }
```

String paths such as `attributes[foo]` are not executed. The validator checks
every path against the template character schema and every writable path
against its component/effect value type.

## Rules, formulas, actions, and dice

Formulas and conditions use the AST in `rule-action-dsl.md`. Validation rules
have a severity (`information`, `warning`, `soft-limit`, `hard-limit`), stable
diagnostic code, expression, message, target references, applicable modes, and
explicit override policy. Override reasons are character-owned records when a
module permits them.

Actions use constrained triggers and effects, and dice systems use declarative
dice-pool and result-mapping primitives. No definition contains script source,
event handler text, network endpoints, HTML, or CSS.

## Creation definitions

Creation profiles identify a sheet, starting defaults, enabled budgets/rules,
optional flow, and freeform allowance. Creation flows operate directly on the
sheet's character schema and store progress metadata separately from the
ratings they edit. See `creation-flow-schema.md`.

## Themes and assets

Module themes may map existing semantic tokens to validated color/font-family
categories, ornament keys, and core-controlled pattern choices. They cannot
provide selectors, stylesheets, web fonts, remote URLs, or layout changes.

Phase 1 should accept asset manifest metadata but not render imported assets.
If a later phase enables assets, begin with size-limited raster images whose
MIME type, dimensions, byte length, and checksum are verified. SVG, HTML,
scripts, fonts, video, audio, and remote assets remain prohibited until a
separate threat and accessibility review.

## Migrations

Module migrations are ordered, declarative transformations between adjacent
module versions or template versions. Allowed operations are typed path rename,
move, copy, set-default-if-missing, enum remap, record-field addition, and
definition-ID remap with an unresolved fallback. Destructive deletion requires
an explicit retained archive field and should not be supported initially.

Every migration declares source/target versions, applicable sheet IDs,
preconditions, operations, and post-migration validation. The engine clones the
record, runs the complete chain, validates, and commits atomically. Missing
links, branches, cycles, or ambiguous paths make the module incompatible.

## Validation layers

1. Envelope shape and structural budgets.
2. ID syntax and uniqueness.
3. dependency and parent graph integrity.
4. reference existence and kind matching.
5. template schema/default/path type consistency.
6. component configuration and accessibility fields.
7. formula/action types, dependencies, cycles, and execution budgets.
8. flow reachability and termination diagnostics.
9. migration continuity and fixture validation.
10. license, provenance, asset, and core-version compatibility.

Diagnostics include a stable code, severity, JSON pointer, related IDs, and a
plain-language remediation. Installation is allowed only with zero errors;
activation may additionally reject warnings designated activation-blocking.

## Open decisions

- Final reserved `systemId` for module-backed characters.
- SemVer range subset and prerelease handling.
- Whether module-local IDs may be reused across different definition kinds.
- Canonical JSON algorithm (RFC 8785 is recommended for published checksums).
- Safe asset support and package archive format.
- How much theme ornament customization is safe without external assets.
