import { z } from 'zod';
import { arcaneModuleEnvelopeSchema } from '../schema/module-envelope';
import {
  storedCharacterSchema,
  type StoredCharacter,
} from '../../storage/stored-character';
import { calculateModuleChecksum } from './module-files';

const archiveSchema = z.strictObject({
  format: z.literal('arcane-record-local-archive'),
  formatVersion: z.literal(1),
  exportedAt: z.string().datetime(),
  characters: z.array(storedCharacterSchema).max(1_000),
  modules: z
    .array(
      z.strictObject({
        checksum: z.string().length(64),
        envelope: arcaneModuleEnvelopeSchema,
      }),
    )
    .max(100),
});

export async function createLocalArchive(
  characters: readonly StoredCharacter[],
  modules: readonly z.infer<typeof arcaneModuleEnvelopeSchema>[],
  now = new Date(),
) {
  const records = await Promise.all(
    modules.map(async (envelope) => ({
      envelope,
      checksum: await calculateModuleChecksum(envelope),
    })),
  );
  return `${JSON.stringify(archiveSchema.parse({ format: 'arcane-record-local-archive', formatVersion: 1, exportedAt: now.toISOString(), characters, modules: records }), null, 2)}\n`;
}

export async function parseLocalArchive(contents: string) {
  if (new TextEncoder().encode(contents).byteLength > 25 * 1024 * 1024)
    throw new Error('Local archive exceeds the 25 MB safety limit.');
  const archive = archiveSchema.parse(JSON.parse(contents));
  for (const item of archive.modules)
    if ((await calculateModuleChecksum(item.envelope)) !== item.checksum)
      throw new Error(
        `Module checksum mismatch for ${item.envelope.moduleId}.`,
      );
  return archive;
}
