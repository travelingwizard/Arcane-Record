import alchemicalCharmData from './alchemical-charms.json';
import fairFolkCharmData from './fair-folk-charms.json';
import type { DragonBloodedCharmDefinition } from './dragonblooded-powers';
import type { ExaltedCharacterType } from '../profiles';

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
