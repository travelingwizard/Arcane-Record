import { describe, expect, it } from 'vitest';
import {
  abilityCatalog,
  artCatalog,
  catalog,
  houseCatalog,
  spellCatalog,
  virtueFlawCatalog,
} from '../../src/games/ars-magica-definitive/catalog';
import { isCharacterCreationCertified } from '../../src/games/ars-magica-definitive/certification';
import { houseBenefit } from '../../src/games/ars-magica-definitive/creation-rules';

describe('Ars Magica catalog integrity', () => {
  it('has stable unique cited IDs and explicit dispositions', () => {
    expect(new Set(catalog.map((x) => x.id)).size).toBe(catalog.length);
    for (const x of catalog) {
      expect(x.id).toMatch(/^ars\./);
      if (x.printedPage === null) expect(x.pdfPage).toBeNull();
      else expect(x.pdfPage).toBe(x.printedPage + 8);
      expect([
        'verified',
        'reference-only',
        'unresolved',
        'excluded',
      ]).toContain(x.verification);
    }
  });
  it('contains all Houses and Hermetic Arts', () => {
    expect(houseCatalog).toHaveLength(12);
    expect(artCatalog).toHaveLength(15);
    for (const house of houseCatalog)
      expect(() => houseBenefit(house.id)).not.toThrow();
  });
  it('contains the core Ability foundation and complete indexed spell references', () => {
    expect(abilityCatalog).toHaveLength(79);
    expect(
      abilityCatalog.some((x) => x.id === 'ars.ability.parma-magica'),
    ).toBe(true);
    expect(abilityCatalog.some((x) => x.id === 'ars.ability.latin')).toBe(true);
    expect(spellCatalog.length).toBeGreaterThanOrEqual(300);
    expect(spellCatalog.every((x) => x.verification === 'verified')).toBe(true);
    expect(
      spellCatalog.every(
        (x) => x.mechanics && (Number.isInteger(x.level) || x.general),
      ),
    ).toBe(true);
    expect(virtueFlawCatalog).toHaveLength(632);
    expect(virtueFlawCatalog.every((x) => x.verification === 'verified')).toBe(
      true,
    );
    expect(isCharacterCreationCertified()).toBe(true);
  });
});
