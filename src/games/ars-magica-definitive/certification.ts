import {
  abilityCatalog,
  artCatalog,
  houseCatalog,
  spellCatalog,
  virtueFlawCatalog,
} from './catalog';
import certification from './character-creation-certification.json';

/**
 * Reviewed character-creation certification. Covenant and laboratory
 * automation have their own release gate and do not weaken this one.
 */
export const characterCreationCertification = certification;

export function isCharacterCreationCertified() {
  const { evidence } = characterCreationCertification;
  return (
    characterCreationCertification.reviewed &&
    houseCatalog.length === evidence.houses &&
    abilityCatalog.length === evidence.abilities &&
    artCatalog.length === evidence.arts &&
    spellCatalog.length === evidence.spells &&
    virtueFlawCatalog.length === evidence.virtuesFlaws &&
    [
      ...houseCatalog,
      ...abilityCatalog,
      ...artCatalog,
      ...spellCatalog,
      ...virtueFlawCatalog,
    ].every(
      (definition) =>
        definition.verification === 'verified' &&
        definition.printedPage !== null &&
        definition.pdfPage !== null,
    )
  );
}
