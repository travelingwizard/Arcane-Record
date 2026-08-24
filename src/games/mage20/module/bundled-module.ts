import { calculateModuleChecksum } from '../../../modules/interchange/module-files';
import type {
  ModuleLockRecord,
  ModulePackageRecord,
} from '../../../modules/repository/module-records';
import { mage20Phase2Module } from './mage20-phase2-module';
import { arcaneModuleEnvelopeSchema } from '../../../modules/schema/module-envelope';
import { MAGE20_MODULE_ID, MAGE20_MODULE_VERSION } from './id-map';

export const MAGE20_BUNDLED_LOCK_ID = 'b702f380-eec2-4dc1-a44b-c45f1ddd8b32';

export async function getBundledMage20ModuleRecords(): Promise<{
  packageRecord: ModulePackageRecord;
  lock: ModuleLockRecord;
}> {
  const installedAt = '2026-08-24T00:00:00.000Z';
  const envelope = arcaneModuleEnvelopeSchema.parse(mage20Phase2Module);
  return {
    packageRecord: {
      moduleId: MAGE20_MODULE_ID,
      moduleVersion: MAGE20_MODULE_VERSION,
      checksum: await calculateModuleChecksum(envelope),
      origin: 'bundled',
      installedAt,
      envelope,
    },
    lock: {
      id: MAGE20_BUNDLED_LOCK_ID,
      moduleId: MAGE20_MODULE_ID,
      moduleVersion: MAGE20_MODULE_VERSION,
      dependencies: [],
      createdAt: installedAt,
    },
  };
}
