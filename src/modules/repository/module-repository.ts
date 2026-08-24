import type { ArcaneModuleEnvelope } from '../schema/module-envelope';
import type {
  ModuleDraftRecord,
  ModuleInstallationRecord,
  ModuleLockRecord,
  ModulePackageRecord,
} from './module-records';

export interface InstallModuleInput {
  envelope: ArcaneModuleEnvelope;
  checksum: string;
  origin: ModulePackageRecord['origin'];
  installedAt: string;
  lock: ModuleLockRecord;
}

export interface ModuleRepository {
  listPackages(): Promise<ModulePackageRecord[]>;
  getPackage(
    moduleId: string,
    moduleVersion: string,
  ): Promise<ModulePackageRecord | null>;
  listInstallations(): Promise<ModuleInstallationRecord[]>;
  listLocks(): Promise<ModuleLockRecord[]>;
  install(input: InstallModuleInput): Promise<ModulePackageRecord>;
  saveDraft(draft: ModuleDraftRecord): Promise<ModuleDraftRecord>;
  listDrafts(): Promise<ModuleDraftRecord[]>;
  getDraft(id: string): Promise<ModuleDraftRecord | null>;
  deleteDraft(id: string): Promise<void>;
  setInstallationEnabled(moduleId: string, enabled: boolean): Promise<void>;
  activateVersion(moduleId: string, moduleVersion: string): Promise<void>;
}
