import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { burningWheelLifepaths } from '../../src/games/burning-wheel/catalog';
import {
  importCharredCharacter,
  serializeCharredCharacter,
} from '../../src/games/burning-wheel/charred-file';
import { createBlankBurningWheelCharacter } from '../../src/games/burning-wheel/create-character';
import { createBurningWheelPdf } from '../../src/games/burning-wheel/pdf';
import { burningWheelCharacterSchema } from '../../src/games/burning-wheel/schema';
import { prepareImportedRecord } from '../../src/features/import-export/character-files';
import { gameSystemRegistry } from '../../src/games/registry';

describe('Burning Wheel interchange', () => {
  it('round-trips the Charred Black fields and accepts .char through the shared importer', () => {
    const character = createBlankBurningWheelCharacter('man');
    character.identity.name = 'Ada of the Hills';
    character.identity.gender = 'female';
    const born = burningWheelLifepaths.find(
      ({ stock, name }) => stock === 'man' && name === 'Born Peasant',
    )!;
    character.burn.lifepaths.push({
      id: crypto.randomUUID(),
      definitionId: born.id,
      time: 8,
      weaponChoice: '',
      statChoice: '',
      brutalLifeDie: 0,
      brutalLifeTrait: '',
    });
    const contents = serializeCharredCharacter(character);
    const imported = importCharredCharacter(contents, 'ada.char');
    expect(imported?.identity.name).toBe('Ada of the Hills');
    expect(imported?.burn.lifepaths[0]?.definitionId).toBe(born.id);
    expect(burningWheelCharacterSchema.parse(imported)).toEqual(imported);

    const stored = prepareImportedRecord(
      contents,
      'ada.char',
      gameSystemRegistry,
      new Date('2026-08-21T12:00:00.000Z'),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
    expect(stored.systemId).toBe('burning-wheel');
    expect(stored.name).toBe('Ada of the Hills (Imported)');
  });

  it('rejects malformed or unsupported .char files', () => {
    expect(importCharredCharacter('not json', 'broken.char')).toBeNull();
    expect(
      importCharredCharacter('{"stock":"dragon"}', 'dragon.char'),
    ).toBeNull();
    expect(importCharredCharacter('{}', 'character.json')).toBeNull();
  });

  it('creates a valid original local PDF', async () => {
    const character = createBlankBurningWheelCharacter('elf');
    character.identity.name = 'Ithilien';
    const bytes = await createBurningWheelPdf(character);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBe(2);
    expect(document.getTitle()).toContain('Ithilien');
  });
});
