import type { MageDatabase } from '../../storage/mage-database';
import type { ModuleRepository, InstallModuleInput } from './module-repository';
import {
  moduleDraftRecordSchema,
  moduleInstallationRecordSchema,
  moduleLockRecordSchema,
  modulePackageRecordSchema,
} from './module-records';
import { validateModuleEnvelope } from '../registry/module-validation';

export class DexieModuleRepository implements ModuleRepository {
  constructor(private readonly database: MageDatabase) {}

  async listPackages() {
    return (await this.database.modulePackages.toArray()).map((record) =>
      modulePackageRecordSchema.parse(record),
    );
  }

  async getPackage(moduleId: string, moduleVersion: string) {
    const record = await this.database.modulePackages.get([
      moduleId,
      moduleVersion,
    ]);
    return record ? modulePackageRecordSchema.parse(record) : null;
  }

  async listInstallations() {
    return (await this.database.moduleInstallations.toArray()).map((record) =>
      moduleInstallationRecordSchema.parse(record),
    );
  }

  async listLocks() {
    return (await this.database.moduleLocks.toArray()).map((record) =>
      moduleLockRecordSchema.parse(record),
    );
  }

  async install(input: InstallModuleInput) {
    const envelope = validateModuleEnvelope(input.envelope);
    const record = modulePackageRecordSchema.parse({
      moduleId: envelope.moduleId,
      moduleVersion: envelope.moduleVersion,
      checksum: input.checksum,
      origin: input.origin,
      installedAt: input.installedAt,
      envelope,
    });
    const installation = moduleInstallationRecordSchema.parse({
      moduleId: envelope.moduleId,
      activeVersion: envelope.moduleVersion,
      origin: input.origin,
      enabled: true,
      enabledOverlayRefs: [],
      updatedAt: input.installedAt,
    });
    const lock = moduleLockRecordSchema.parse(input.lock);
    if (
      lock.moduleId !== envelope.moduleId ||
      lock.moduleVersion !== envelope.moduleVersion
    ) {
      throw new Error('The dependency lock belongs to another module version.');
    }

    await this.database.transaction(
      'rw',
      this.database.modulePackages,
      this.database.moduleInstallations,
      this.database.moduleLocks,
      async () => {
        const existing = await this.database.modulePackages.get([
          record.moduleId,
          record.moduleVersion,
        ]);
        if (existing && existing.checksum !== record.checksum) {
          throw new Error(
            `Module “${record.moduleId}@${record.moduleVersion}” has a different checksum.`,
          );
        }
        if (existing) return;
        for (const dependency of envelope.dependencies.filter(
          ({ required }) => required,
        )) {
          const locked = lock.dependencies.find(
            ({ moduleId }) => moduleId === dependency.moduleId,
          );
          const installedDependency = await this.database.modulePackages.get([
            dependency.moduleId,
            dependency.version,
          ]);
          if (
            !locked ||
            locked.moduleVersion !== dependency.version ||
            !installedDependency ||
            installedDependency.checksum !== locked.checksum
          ) {
            throw new Error(
              `Required dependency “${dependency.moduleId}@${dependency.version}” does not match the installation lock.`,
            );
          }
        }
        await this.database.modulePackages.add(record);
        await this.database.moduleInstallations.put(installation);
        await this.database.moduleLocks.put(lock);
      },
    );
    return record;
  }

  async saveDraft(input: Parameters<ModuleRepository['saveDraft']>[0]) {
    const draft = moduleDraftRecordSchema.parse(input);
    await this.database.moduleDrafts.put(draft);
    return draft;
  }

  async getDraft(id: string) {
    const draft = await this.database.moduleDrafts.get(id);
    return draft ? moduleDraftRecordSchema.parse(draft) : null;
  }

  async listDrafts() {
    return (
      await this.database.moduleDrafts.orderBy('updatedAt').reverse().toArray()
    ).map((draft) => moduleDraftRecordSchema.parse(draft));
  }

  async deleteDraft(id: string) {
    await this.database.moduleDrafts.delete(id);
  }

  async setInstallationEnabled(moduleId: string, enabled: boolean) {
    const current = await this.database.moduleInstallations.get(moduleId);
    if (!current) throw new Error('Module installation is unavailable.');
    await this.database.moduleInstallations.put(
      moduleInstallationRecordSchema.parse({
        ...current,
        enabled,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  async activateVersion(moduleId: string, moduleVersion: string) {
    const [current, target] = await Promise.all([
      this.database.moduleInstallations.get(moduleId),
      this.database.modulePackages.get([moduleId, moduleVersion]),
    ]);
    if (!current || !target)
      throw new Error('The requested immutable module version is unavailable.');
    await this.database.moduleInstallations.put(
      moduleInstallationRecordSchema.parse({
        ...current,
        activeVersion: moduleVersion,
        enabled: true,
        updatedAt: new Date().toISOString(),
      }),
    );
  }
}
