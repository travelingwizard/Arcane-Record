import alchemicalCharmData from './ocr-drafts/alchemical-charms.json';
import fairFolkCharmData from './ocr-drafts/fair-folk-charms.json';
import type { DragonBloodedCharmDefinition } from './dragonblooded-powers';
import type { ExaltedCharacterType } from '../profiles';

// The `ocr-drafts/` catalogs these come from are raw OCR extractions, not
// this project's page-cited, visually-reviewed inventory/promotion process
// (see `docs/references/exalted1e/*/inventory/`, `scripts/audit-exalted-sources.mjs`).
// Kept as draft material for a future real verification pass; deliberately
// NOT wired into `schema.ts`'s validation (`charmIdsBySheetType.alchemical`/
// `'fair-folk'` are empty `Set()`s) or into `Exalted1eEditor.tsx`'s power
// picker, and excluded from the `${family}-*.json` promoted-catalog glob
// `scripts/audit-exalted-sources.mjs` scans, so their mere existence here
// can never be mistaken for certification progress.

export const alchemicalCharms =
  alchemicalCharmData as DragonBloodedCharmDefinition[];
export const fairFolkCharms =
  fairFolkCharmData as DragonBloodedCharmDefinition[];

export const exaltedFamilyPowerCatalogs: Partial<
  Record<ExaltedCharacterType, readonly DragonBloodedCharmDefinition[]>
> = {
  alchemical: alchemicalCharms,
  'fair-folk': fairFolkCharms,
};

export function getExaltedFamilyPowers(type: ExaltedCharacterType) {
  return exaltedFamilyPowerCatalogs[type] ?? [];
}
