# 14. Equipment implementation record

## Purpose

Equipment turns the supplied Mage M20 weapon, armor, and utility research into
a searchable reference-preview catalog and character-owned records. The source
material is organized in
[Equipment reference](references/mage-m20/equipment.md).

## Product boundary

- The catalog includes 271 melee, ranged, armor, and field-gear definitions:
  133 from the original supplied research and 138 missing entries compared
  against the Firefly Dies World of Darkness weapons reference.
- Every definition has a stable ID, family, category, important-information
  string, summary, citation, review status, and content label.
- All supplied catalog entries remain unverified. Malign material is labeled
  mature and excluded until the user opts in.
- Players may add catalog items or create custom equipment with a required name
  and description.
- Equipment does not calculate attacks, damage, range penalties, soak, armor
  effects, encumbrance, ammunition, or legality.
- Character records and imports remain browser-local.

## Character model

```ts
interface OwnedEquipment {
  id: string;
  definitionId?: string;
  name: string;
  category: 'melee' | 'ranged' | 'armor' | 'gear';
  description: string;
  quantity: number;
  equipped: boolean;
  notes: string;
  addedAt: string;
  unresolvedDefinitionName?: string;
}
```

Known catalog definitions fix the category but leave the owned name,
description, quantity, equipped state, and notes editable. Unknown definition
IDs are preserved. Known definitions can be selected once; quantity records
multiple copies.

## Reference-data architecture

`docs/references/mage-m20/equipment.md` is the reviewable source.
`docs/references/mage-m20/firefly-wod-weapons.data.json` contains the normalized
comparison additions, while `firefly-wod-weapons-comparison.md` records the
source, compatibility boundary, and exclusions.
`scripts/generate-equipment.mjs` deterministically produces
`src/systems/mage-m20/reference/equipment.data.json`.
`src/systems/mage-m20/reference/equipment.ts` validates the generated catalog
with Zod and exposes the catalog and ID map.

Catalog summaries, statistics, citations, review status, and mature labels are
not copied into character records or exports.

## Schema and navigation

Schema version 7 adds `repeatableEntries.equipment` and the `Do*` Skill.
Version-6 and earlier records migrate with an empty Equipment collection and a
zero `Do*` rating. Current and imported equipment is validated for UUIDs,
categories, quantity limits, catalog-category agreement, and duplicate known
definitions.

The section registry exposes `#equipment` in a Gear group between Rotes and
Health. Desktop navigation, mobile navigation, disclosure preferences,
collapsed summaries, and responsive behavior consume the same stable ID.

## Verification

Coverage includes catalog validation and counts, schema boundaries,
schema-version-6 migration, JSON/YAML round trips, editor interactions,
remove/Undo, refresh persistence, export boundaries, section navigation, and
320 CSS-pixel overflow.
