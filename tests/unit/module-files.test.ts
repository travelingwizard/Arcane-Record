import { describe, expect, it } from 'vitest';
import { ModuleRegistry } from '../../src/modules/registry/module-registry';
import {
  serializeModule,
  stageModuleFile,
} from '../../src/modules/interchange/module-files';
import { createSyntheticModule } from '../fixtures/synthetic-module';

describe('Arcane module files', () => {
  it('round-trips validated JSON and YAML with the same checksum', async () => {
    const module = createSyntheticModule();
    const json = await stageModuleFile(
      JSON.stringify(module),
      'test.arcane-module.json',
    );
    expect(json.canInstall).toBe(true);
    const yamlText = serializeModule(json.envelope!, 'yaml');
    const yaml = await stageModuleFile(yamlText, 'test.arcane-module.yaml');
    expect(yaml.canInstall).toBe(true);
    expect(yaml.envelope).toEqual(json.envelope);
    expect(yaml.checksum).toBe(json.checksum);
  });

  it('stages invalid content without installing or throwing', async () => {
    const invalid = await stageModuleFile(
      '{"format":"arcane-record-module","__proto__":{}}',
      'unsafe.json',
    );
    expect(invalid.canInstall).toBe(false);
    expect(invalid.diagnostics.length).toBeGreaterThan(0);
  });

  it('reports missing dependencies in staging', async () => {
    const staged = await stageModuleFile(
      JSON.stringify(
        createSyntheticModule({
          dependencies: [
            {
              moduleId: 'net.example.required',
              version: '1.0.0',
              required: true,
            },
          ],
        }),
      ),
      'dependent.json',
      new ModuleRegistry(),
    );
    expect(staged.canInstall).toBe(false);
    expect(staged.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'missing-module-dependency' }),
      ]),
    );
  });

  it('distinguishes an installed no-op from an immutable version conflict', async () => {
    const original = await stageModuleFile(
      JSON.stringify(createSyntheticModule()),
      'original.json',
    );
    const installed = new ModuleRegistry().register(original.envelope!);
    const same = await stageModuleFile(
      JSON.stringify(createSyntheticModule()),
      'same.json',
      installed,
    );
    expect(same.canInstall).toBe(true);
    expect(same.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'module-already-installed' }),
      ]),
    );

    const conflict = await stageModuleFile(
      JSON.stringify(createSyntheticModule({ name: 'Changed same version' })),
      'conflict.json',
      installed,
    );
    expect(conflict.canInstall).toBe(false);
    expect(conflict.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'immutable-module-version-conflict',
        }),
      ]),
    );
  });
});
