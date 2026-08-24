import type { ModuleRepository } from '../repository/module-repository';
import {
  installStagedModule,
  stageModuleFile,
} from '../interchange/module-files';
import type { ModuleRegistry } from './module-registry';

export interface RegistryCatalogEntry {
  moduleId: string;
  moduleVersion: string;
  checksum: string;
  publishedAt: string;
  deprecatedAt?: string;
  deprecationReason?: string;
  recommended: boolean;
}

export class RegistryClient {
  constructor(private readonly baseUrl: string) {}
  async catalog(signal?: AbortSignal) {
    const response = await fetch(`${this.baseUrl}/v1/catalog`, {
      signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    if (!response.ok) throw new Error('The hosted registry is unavailable.');
    return (await response.json()) as { modules: RegistryCatalogEntry[] };
  }
  async downloadAndInstall(
    entry: RegistryCatalogEntry,
    repository: ModuleRepository,
    installed: ModuleRegistry,
  ) {
    const response = await fetch(
      `${this.baseUrl}/v1/modules/${encodeURIComponent(entry.moduleId)}/${encodeURIComponent(entry.moduleVersion)}`,
      { credentials: 'omit', referrerPolicy: 'no-referrer' },
    );
    if (!response.ok) throw new Error('The published package is unavailable.');
    const staged = await stageModuleFile(
      await response.text(),
      `${entry.moduleId}.arcane-module.json`,
      installed,
    );
    if (!staged.canInstall || staged.checksum !== entry.checksum) {
      throw new Error('Published package checksum verification failed.');
    }
    return installStagedModule(staged, repository, 'published');
  }
}

export const configuredRegistryUrl = (
  import.meta.env.VITE_ARCANE_REGISTRY_URL as string | undefined
)?.replace(/\/$/, '');
