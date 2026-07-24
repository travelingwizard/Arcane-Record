# 13. Focus, Wonders, and Rotes implementation plan

## Purpose

This document turns the supplied Mage M20 research into a staged, testable
handoff for future Codex work. It does not make deferred features appear
complete and does not change character data in the current milestone.

Reference research is split by concern:

- [Focus](references/mage-m20/focus.md)
- [Wonders](references/mage-m20/wonders.md)
- [Rotes](references/mage-m20/rotes.md)

All three references contain unverified source material. Verification is a
content prerequisite for shipping a built-in catalog, not a prerequisite for
letting players enter their own free-form character information.

## Current repository state

- The visible Magick group contains Spheres, Enlightenment, and one combined
  deferred `#later-sections` placeholder.
- `repeatableEntries.focus` and `.wonders` are reserved string arrays.
- `repeatableEntries.rotes` uses a minimal `{ id, spheres, effect }` shape.
- These reserved fields are parsed and exported, but the editor does not expose
  them.
- The current schema version is 5.
- The section registry, mobile disclosures, summaries, hashes, and desktop
  navigation all consume stable section IDs.

Do not build new UI directly on the reserved array shapes. Design the real
domain records, migrate old values, and increment the schema version.

## Product decisions

### In scope for these sections

- Editable character records stored in browser-local IndexedDB.
- Catalog-assisted selection plus custom entries.
- Search, filtering, preview, selection, editing, removal, and undo where the
  existing Background and Merits/Flaws patterns apply.
- Stable definition IDs and character-owned selection UUIDs.
- JSON/YAML import and export of character-owned data.
- Reference citations shown from catalog data.
- Responsive major-section disclosures and navigation anchors.

### Out of scope

- A character-creation rules engine.
- Automatic Effect legality, dice-pool, difficulty, Paradox, or vulgarity
  calculation.
- Blocking a character because they have fewer than seven instruments.
- Automatically removing instruments based on Arete.
- Granting or calculating Wonder Background costs.
- Treating every named Wonder or indexed Rote as verified catalog content.
- A backend, authentication, cloud sync, telemetry, or remote content.

## Recommended delivery order

### Milestone 1: Focus

Focus has the strongest relationship to core character identity and the
cleanest research structure. Implement it before Wonders and Rotes.

Recommended character model:

```ts
interface FocusSelection {
  id: string;
  definitionId?: string;
  customName?: string;
  notes: string;
  addedAt: string;
  unresolvedDefinitionName?: string;
}

interface InstrumentSelection extends FocusSelection {
  significant: boolean;
}

interface FocusData {
  paradigms: FocusSelection[];
  practices: FocusSelection[];
  instruments: InstrumentSelection[];
  need: string;
  culture: string;
  notes: string;
}
```

Rules:

- A selection uses either `definitionId` or a non-empty `customName`.
- Preserve unknown definition IDs as unresolved selections.
- `significant` records character meaning; it does not automatically modify
  difficulty.
- Seven starting instruments is a visible advisory only.
- Transcendence guidance may compare Arete to selected instruments, but it must
  not remove data or declare the character invalid.

Recommended UI:

- A real `#focus` major section.
- A compact equation header: Paradigm + Practice + Instruments = Focus.
- Separate selected lists for paradigms, practices, and instruments.
- One catalog panel with tabs or filters for those three definition families.
- Add Custom actions for each family.
- Need, culture, and general notes text areas.
- A non-blocking count note such as “5 instruments recorded · starting
  characters commonly begin with at least 7.”
- Collapsed summary: primary paradigm, practice count, and instrument count.

### Milestone 2: Wonders

Recommended character model:

```ts
interface OwnedWonder {
  id: string;
  definitionId?: string;
  name: string;
  typeLabel: string;
  rating: number | null;
  powers: string;
  notes: string;
  addedAt: string;
  unresolvedDefinitionName?: string;
}
```

Rules:

- Catalog selection supplies reference information but the character owns an
  independently editable name and notes.
- Custom Wonders have no fake definition ID.
- Do not infer mechanics or cost from the Wonder Background.
- Keep a nullable rating until the source review determines what that rating
  represents and its valid range.

Recommended UI:

- A real `#wonders` major section.
- Selected Wonder list with name, type, optional rating, powers, and notes.
- Searchable reference panel filtered by family, type, and source.
- Explicit Custom Wonder action.
- Collapsed summary: selected count and up to two Wonder names.

### Milestone 3: Rotes

Recommended character model:

```ts
interface SphereRequirement {
  sphereId: SphereId | 'data' | 'other';
  minimum: number;
  maximum?: number;
  label?: string;
}

interface KnownRote {
  id: string;
  definitionId?: string;
  name: string;
  sphereRequirements: SphereRequirement[];
  requirementNotes: string;
  effect: string;
  focusNotes: string;
  notes: string;
  addedAt: string;
  unresolvedDefinitionName?: string;
}
```

Rules:

- Do not flatten ranges such as Forces 2-3.
- Do not silently map Data to Correspondence.
- Use `requirementNotes` for alternatives such as “Entropy 2 or Mind 2.”
- Migrate the existing `spheres` string into `requirementNotes` when it cannot
  be parsed without ambiguity.
- Do not validate a Rote against the character's current Sphere ratings.

Recommended UI:

- A real `#rotes` major section.
- Selected Rote editor with name, Sphere requirements, effect, focus, and
  notes.
- Searchable reference panel filtered by Sphere, rank, family, and source.
- Explicit Custom Rote action.
- Collapsed summary: saved count and up to two Rote names.

## Reference-data architecture

Follow the existing Background and Merits/Flaws split:

```text
src/systems/mage-m20/reference/
  paradigms.data.json
  paradigms.ts
  practices.data.json
  practices.ts
  instruments.data.json
  instruments.ts
  wonders.data.json
  wonders.ts
  rotes.data.json
  rotes.ts
```

Each data file should contain:

- stable kebab-case ID;
- display name;
- family/category;
- concise original summary;
- structured citations;
- aliases where needed;
- explicit `reviewStatus`;
- content labels where mature material is retained.

TypeScript modules should parse the JSON with Zod and expose read-only catalogs,
maps by ID, filter helpers, and normalized search text. Character data should
never store the catalog description or citation.

## Schema and migration strategy

Use one reviewable schema migration per delivered milestone unless multiple
sections intentionally ship together.

For each migration:

1. Define the new TypeScript character records.
2. Add Zod schemas with unique selection-ID checks.
3. Add default empty structures in `createBlankMageCharacter`.
4. Migrate the previous version without data loss.
5. Preserve unknown catalog references.
6. Update JSON/YAML round-trip tests.
7. Update the field map and data-model documentation.

Suggested legacy handling:

- Convert non-empty `focus[]` strings into custom Focus selections. Because the
  old strings have no declared kind, preserve them in general Focus notes or
  an explicit unresolved legacy list unless a safe mapping exists.
- Convert non-empty `wonders[]` strings into custom Owned Wonders using the
  string as the name.
- Convert legacy Rotes by keeping `effect`, preserving `spheres` in
  `requirementNotes`, and adding a visible fallback name such as “Untitled
  Rote” only at presentation time. Do not persist a fabricated title during
  migration unless the new schema requires it.

## Section registry changes

When the first real section ships:

- add its stable section ID to `character-sections.ts`;
- replace the relevant part of the combined deferred card;
- add its collapsed summary;
- add unit tests for registry order, groups, and unique IDs;
- add navigation tests for its anchor and hash loading.

Recommended final Magick order:

1. `#spheres`
2. `#enlightenment`
3. `#focus`
4. `#wonders`
5. `#rotes`

Keep `#later-sections` while any still-visible combined placeholder remains.
Remove it only when its last deferred item has become a real section, and
ignore stale stored disclosure preferences safely.

## Component structure

Follow existing project patterns without putting all behavior in one component:

```text
components/character/
  FocusSection.tsx
  WondersSection.tsx
  RotesSection.tsx
  focus/
    FocusCatalog.tsx
    FocusSelectionList.tsx
    FocusSummary.tsx
  wonders/
    WonderCatalog.tsx
    SelectedWonderList.tsx
    WonderSummary.tsx
  rotes/
    RoteCatalog.tsx
    SelectedRoteList.tsx
    RoteSummary.tsx
```

Reusable catalog search, preview, disclosure, and dialog primitives should stay
Mage-independent. Mage definition shapes, rules, and labels remain under the
Mage system layer.

## Accessibility and responsive requirements

- Use real labels, buttons, and form controls.
- Preserve the major-section heading and disclosure pattern.
- Keep catalog browsing to one nested disclosure level.
- Keep selected data mounted when a major section collapses.
- Restore focus after catalog dismissal and item removal.
- Announce add/remove results where needed.
- Keep practical 44px touch targets.
- Make selected lists and filters usable at 320 CSS pixels without horizontal
  page scrolling.
- Keep Spheres as a vertical list on mobile; these new sections must not alter
  that behavior.
- Respect reduced motion and existing focus styles.

## Test requirements

### Reference and unit tests

- catalog files parse successfully;
- stable IDs are unique;
- names and citations are non-empty;
- families and review states use known values;
- Sphere requirements use known IDs or explicit alternate values;
- aliases do not collide unexpectedly;
- mature-content entries carry the appropriate label.

### Schema and migration tests

- blank characters receive empty new fields;
- every prior schema version migrates;
- legacy Focus, Wonder, and Rote values are preserved;
- duplicate selection UUIDs fail;
- unknown definition IDs remain visible;
- JSON/YAML round trips preserve custom and catalog-backed records;
- no catalog descriptions or citations enter exports.

### Integration tests

- add, edit, remove, and undo catalog selections;
- add and edit custom entries;
- catalog search/filter/preview;
- autosave after edits;
- refresh persistence;
- import/export;
- collapsed summaries;
- focus recovery on collapse and dialog close;
- independent mobile expansion;
- no character data loss when a catalog closes.

### End-to-end tests

- create a character and record a complete Focus;
- add one catalog and one custom Wonder;
- add one catalog and one custom Rote;
- refresh and confirm persistence;
- export, import, and confirm a new character ID with equivalent section data;
- verify desktop anchors and mobile Sections navigation;
- verify no horizontal overflow at 320 CSS pixels;
- verify successful persistence says exactly “Saved in this browser.”

## Content verification gate

Before a built-in catalog is labeled complete:

1. Check each citation against the cited source.
2. Resolve print-page versus PDF-page ambiguity.
3. Remove duplicates and distinguish aliases.
4. Confirm summaries do not overstate mechanics.
5. Confirm the allowed product scope for supplemental and mature content.
6. Mark every shipped entry `verified`.

Until that gate is complete, the application may support custom player entries
and may label catalog data as a preview, but it must not imply that the
reference list is authoritative or exhaustive.

## Future Codex handoff prompt

Use this after the reference material for the selected milestone has been
verified:

> Read `AGENTS.md`, all relevant project documentation, and
> `docs/13-magick-sections-plan.md`. Implement only the next unfinished Magick
> milestone, beginning with Focus. Preserve the local-first boundary and
> existing visual system. Inspect the current schema, migrations, catalogs,
> section registry, responsive disclosures, import/export, and tests before
> editing. Present a concise plan, then implement the schema migration,
> reference catalog, editor section, collapsed summary, navigation anchor,
> documentation, and full automated coverage described in the plan. Do not add
> a rules engine or treat unverified reference entries as authoritative. Run
> formatting, typecheck, lint, unit/integration tests, E2E tests, and the
> production build; review the Git diff and create a local commit only after
> everything passes.
