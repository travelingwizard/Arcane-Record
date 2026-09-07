import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('shared sheet presentation contract', () => {
  it('keeps Earthdawn independent from Torchbearer presentation classes', () => {
    const earthdawnSources = [
      'src/games/earthdawn4e/Earthdawn4eEditor.tsx',
      'src/games/earthdawn4e/EarthdawnCreator.tsx',
    ]
      .map(read)
      .join('\n');

    expect(earthdawnSources).not.toContain('tb2-');
    expect(earthdawnSources).toContain('SheetEditorShell');
    expect(earthdawnSources).toContain('SheetFieldGrid');
    expect(earthdawnSources).toContain('character-creator');
  });

  it('routes every production editor through the canonical shell', () => {
    const directEditors = [
      'src/features/character-editor/CharacterEditor.tsx',
      'src/games/exalted1e/Exalted1eEditor.tsx',
      'src/games/burning-wheel/BurningWheelEditor.tsx',
      'src/games/torchbearer2e/Torchbearer2eEditor.tsx',
      'src/games/earthdawn4e/Earthdawn4eEditor.tsx',
      'src/modules/renderer/ModuleCharacterEditor.tsx',
      'src/features/module-builder/ModuleBuilderPage.tsx',
    ];

    for (const path of directEditors) {
      expect(read(path), path).toContain('SheetEditorShell');
    }

    const localSheet = read('src/games/shared/LocalSheet.tsx');
    expect(localSheet).toContain('SheetEditorShell');
    for (const adapter of [
      'src/games/city-of-mist/CityEditors.tsx',
      'src/games/curseborne/CurseEditor.tsx',
      'src/games/legend-in-the-mist/LegendEditors.tsx',
    ]) {
      expect(read(adapter), adapter).toContain('LocalSheet');
    }
  });

  it('keeps runtime component colors semantic', () => {
    const componentCss = read('src/styles/components.css');
    const literalColorLines = componentCss
      .split('\n')
      .filter((line) => /#[0-9a-f]{3,8}|(?:rgb|hsl)\(/i.test(line))
      .filter((line) => !line.includes('--preview-'))
      .filter((line) => !line.includes('--overlay-preview-accent'));

    expect(literalColorLines).toEqual([]);
  });

  it('does not expose arbitrary presentation properties in module schemas', () => {
    const envelope = read('src/modules/schema/module-envelope.ts');
    expect(envelope).not.toMatch(/\b(className|cssClass|color|fontFamily)\s*:/);
    expect(envelope).toContain('z.strictObject');
  });

  it('requires semantic controls in Mage advancement and Legend sheets', () => {
    const experienceFields = read(
      'src/components/character/ExperienceTotalsFields.tsx',
    );
    expect(experienceFields).toContain('SheetFieldGrid');
    expect(experienceFields).toContain('SheetField');

    for (const path of [
      'src/components/character/ExperienceSection.tsx',
      'src/games/mage20/development/MageAdvancement.tsx',
      'src/games/legend-in-the-mist/LegendEditors.tsx',
    ]) {
      expect(read(path), path).not.toMatch(/<button(?![^>]*className)[^>]*>/gs);
    }
  });
});
