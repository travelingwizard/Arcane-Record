import { calculateModuleChecksum } from '../../../modules/interchange/module-files';
import { arcaneModuleEnvelopeSchema } from '../../../modules/schema/module-envelope';
import type {
  ModuleLockRecord,
  ModulePackageRecord,
} from '../../../modules/repository/module-records';
import { exalted1ePhase3Module } from './exalted1e-phase3-module';
import { EXALTED1E_MODULE_ID, EXALTED1E_MODULE_VERSION } from './id-map';

export const EXALTED1E_BUNDLED_LOCK_ID = '39224f12-b984-494a-91a5-0d72ecf44b1e';

export async function getBundledExalted1eModuleRecords(): Promise<{
  packageRecord: ModulePackageRecord;
  lock: ModuleLockRecord;
}> {
  const installedAt = '2026-08-24T00:00:00.000Z';
  const envelope = arcaneModuleEnvelopeSchema.parse(exalted1ePhase3Module);
  return {
    packageRecord: {
      moduleId: EXALTED1E_MODULE_ID,
      moduleVersion: EXALTED1E_MODULE_VERSION,
      checksum: await calculateModuleChecksum(envelope),
      origin: 'bundled',
      installedAt,
      envelope,
    },
    lock: {
      id: EXALTED1E_BUNDLED_LOCK_ID,
      moduleId: EXALTED1E_MODULE_ID,
      moduleVersion: EXALTED1E_MODULE_VERSION,
      dependencies: [],
      createdAt: installedAt,
    },
  };
}
