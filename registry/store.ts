import {
  appendFile,
  mkdir,
  open,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { validateModuleEnvelope } from '../src/modules/registry/module-validation';
import {
  calculateModuleChecksum,
  canonicalizeModule,
} from '../src/modules/interchange/module-files';
import {
  registryMetadataSchema,
  type PublishedRecord,
  type RegistryClaims,
  type RegistryMetadata,
  type StagedRecord,
} from './schema';
import { requireNamespace, requireRole } from './auth';

const emptyMetadata = (): RegistryMetadata => ({
  formatVersion: 1,
  stages: [],
  published: [],
  recommendedVersions: {},
  revokedTokenIds: [],
});
const safePart = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_');
export class RegistryStore {
  private metadata = emptyMetadata();
  private mutationQueue: Promise<void> = Promise.resolve();
  constructor(readonly root: string) {}
  async initialize() {
    await Promise.all(
      ['staged', 'packages', 'audit'].map((name) =>
        mkdir(join(this.root, name), { recursive: true }),
      ),
    );
    try {
      this.metadata = registryMetadataSchema.parse(
        JSON.parse(await readFile(join(this.root, 'metadata.json'), 'utf8')),
      );
      for (const published of this.metadata.published) {
        const envelope = validateModuleEnvelope(
          JSON.parse(
            await readFile(
              this.packagePath(published.moduleId, published.moduleVersion),
              'utf8',
            ),
          ),
        );
        if ((await calculateModuleChecksum(envelope)) !== published.checksum)
          throw new Error(
            `Published package checksum mismatch for ${published.moduleId}@${published.moduleVersion}.`,
          );
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      await this.saveMetadata();
    }
  }
  snapshot() {
    return structuredClone(this.metadata);
  }
  private async runMutation<T>(work: () => Promise<T>) {
    const previous = this.mutationQueue;
    let release = () => {};
    this.mutationQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await work();
    } finally {
      release();
    }
  }
  private async saveMetadata() {
    this.metadata = registryMetadataSchema.parse(this.metadata);
    const target = join(this.root, 'metadata.json');
    const temporary = `${target}.${crypto.randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(this.metadata, null, 2)}\n`, {
      mode: 0o600,
    });
    await rename(temporary, target);
  }
  private stagePath(id: string) {
    return join(this.root, 'staged', `${safePart(id)}.json`);
  }
  private packagePath(moduleId: string, version: string) {
    return join(
      this.root,
      'packages',
      safePart(moduleId),
      `${safePart(version)}.json`,
    );
  }
  async audit(event: {
    requestId: string;
    actor: string;
    action: string;
    moduleId?: string;
    moduleVersion?: string;
    checksum?: string;
    outcome: string;
  }) {
    await appendFile(
      join(this.root, 'audit', 'events.jsonl'),
      `${JSON.stringify({ ...event, timestamp: new Date().toISOString() })}\n`,
      { mode: 0o600 },
    );
  }
  catalog() {
    return this.metadata.published.map((record) => ({
      ...record,
      recommended:
        this.metadata.recommendedVersions[record.moduleId] ===
        record.moduleVersion,
    }));
  }
  async stage(input: unknown, actor: RegistryClaims, now = new Date()) {
    return this.runMutation(() => this.stageUnsafe(input, actor, now));
  }
  private async stageUnsafe(input: unknown, actor: RegistryClaims, now: Date) {
    const envelope = validateModuleEnvelope(input);
    requireNamespace(actor, envelope.moduleId);
    if (
      this.metadata.published.some(
        ({ moduleId, moduleVersion }) =>
          moduleId === envelope.moduleId &&
          moduleVersion === envelope.moduleVersion,
      ) ||
      this.metadata.stages.some(
        ({ moduleId, moduleVersion }) =>
          moduleId === envelope.moduleId &&
          moduleVersion === envelope.moduleVersion,
      )
    )
      throw new Error('Module version already exists and is immutable.');
    for (const dependency of envelope.dependencies.filter(
      ({ required }) => required,
    ))
      if (
        !this.metadata.published.some(
          ({ moduleId, moduleVersion }) =>
            moduleId === dependency.moduleId &&
            moduleVersion === dependency.version,
        )
      )
        throw new Error(
          `Published dependency “${dependency.moduleId}@${dependency.version}” is unavailable.`,
        );
    const checksum = await calculateModuleChecksum(envelope);
    const record: StagedRecord = {
      id: crypto.randomUUID(),
      moduleId: envelope.moduleId,
      moduleVersion: envelope.moduleVersion,
      checksum,
      stagedBy: actor.sub,
      stagedAt: now.toISOString(),
      status: 'staged',
    };
    await writeFile(this.stagePath(record.id), canonicalizeModule(envelope), {
      flag: 'wx',
      mode: 0o600,
    });
    this.metadata.stages.push(record);
    await this.saveMetadata();
    return record;
  }
  async getStage(id: string, actor: RegistryClaims) {
    const record = this.metadata.stages.find((item) => item.id === id);
    if (!record) throw new Error('Stage unavailable.');
    if (
      record.stagedBy !== actor.sub &&
      !actor.roles.includes('reviewer') &&
      !actor.roles.includes('registry-admin')
    )
      throw new Error('Forbidden.');
    return {
      record: structuredClone(record),
      envelope: validateModuleEnvelope(
        JSON.parse(await readFile(this.stagePath(id), 'utf8')),
      ),
    };
  }
  async approve(
    id: string,
    checksum: string,
    actor: RegistryClaims,
    now = new Date(),
  ) {
    return this.runMutation(() => this.approveUnsafe(id, checksum, actor, now));
  }
  private async approveUnsafe(
    id: string,
    checksum: string,
    actor: RegistryClaims,
    now: Date,
  ) {
    requireRole(actor, 'reviewer');
    const staged = await this.getStage(id, actor);
    if (
      staged.record.status !== 'staged' ||
      checksum !== staged.record.checksum
    )
      throw new Error('Review must approve the exact staged checksum.');
    if (actor.sub === staged.record.stagedBy)
      throw new Error('Publisher and reviewer must be different actors.');
    const target = this.packagePath(
      staged.record.moduleId,
      staged.record.moduleVersion,
    );
    await mkdir(dirname(target), { recursive: true });
    const source = await readFile(this.stagePath(id));
    try {
      const handle = await open(target, 'wx', 0o444);
      try {
        await handle.writeFile(source);
      } finally {
        await handle.close();
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      const existing = await readFile(target);
      if (!existing.equals(source))
        throw new Error(
          'Immutable package bytes conflict with staged content.',
        );
    }
    const published: PublishedRecord = {
      moduleId: staged.record.moduleId,
      moduleVersion: staged.record.moduleVersion,
      checksum,
      publishedAt: now.toISOString(),
      publishedBy: staged.record.stagedBy,
      reviewedBy: actor.sub,
    };
    Object.assign(
      this.metadata.stages.find((item) => item.id === id)!,
      {
        status: 'published',
        reviewedBy: actor.sub,
        reviewedAt: now.toISOString(),
      },
    );
    this.metadata.published.push(published);
    this.metadata.recommendedVersions[published.moduleId] =
      published.moduleVersion;
    await this.saveMetadata();
    return published;
  }
  async reject(
    id: string,
    reason: string,
    actor: RegistryClaims,
    now = new Date(),
  ) {
    return this.runMutation(() => this.rejectUnsafe(id, reason, actor, now));
  }
  private async rejectUnsafe(
    id: string,
    reason: string,
    actor: RegistryClaims,
    now: Date,
  ) {
    if (!reason.trim() || reason.length > 2_000)
      throw new Error(
        'Rejection reason must be between 1 and 2,000 characters.',
      );
    requireRole(actor, 'reviewer');
    const staged = await this.getStage(id, actor);
    if (staged.record.status !== 'staged')
      throw new Error('Only staged versions may be rejected.');
    if (actor.sub === staged.record.stagedBy)
      throw new Error('Publisher and reviewer must be different actors.');
    Object.assign(
      this.metadata.stages.find((item) => item.id === id)!,
      {
        status: 'rejected',
        reviewedBy: actor.sub,
        reviewedAt: now.toISOString(),
        reason,
      },
    );
    await this.saveMetadata();
  }
  async deprecate(
    moduleId: string,
    version: string,
    reason: string,
    actor: RegistryClaims,
    now = new Date(),
  ) {
    return this.runMutation(() =>
      this.deprecateUnsafe(moduleId, version, reason, actor, now),
    );
  }
  private async deprecateUnsafe(
    moduleId: string,
    version: string,
    reason: string,
    actor: RegistryClaims,
    now: Date,
  ) {
    if (!reason.trim() || reason.length > 2_000)
      throw new Error(
        'Deprecation reason must be between 1 and 2,000 characters.',
      );
    requireRole(actor, 'registry-admin');
    const record = this.metadata.published.find(
      (item) => item.moduleId === moduleId && item.moduleVersion === version,
    );
    if (!record) throw new Error('Published version unavailable.');
    Object.assign(record, {
      deprecatedAt: now.toISOString(),
      deprecatedBy: actor.sub,
      deprecationReason: reason,
    });
    await this.saveMetadata();
    return structuredClone(record);
  }
  async rollback(moduleId: string, version: string, actor: RegistryClaims) {
    return this.runMutation(() =>
      this.rollbackUnsafe(moduleId, version, actor),
    );
  }
  private async rollbackUnsafe(
    moduleId: string,
    version: string,
    actor: RegistryClaims,
  ) {
    requireRole(actor, 'registry-admin');
    const target = this.metadata.published.find(
      (item) => item.moduleId === moduleId && item.moduleVersion === version,
    );
    if (!target || target.deprecatedAt)
      throw new Error(
        'Rollback target must be a non-deprecated published version.',
      );
    this.metadata.recommendedVersions[moduleId] = version;
    await this.saveMetadata();
    return structuredClone(target);
  }
  async package(moduleId: string, version: string) {
    const record = this.metadata.published.find(
      (item) => item.moduleId === moduleId && item.moduleVersion === version,
    );
    if (!record) throw new Error('Published version unavailable.');
    return {
      record: structuredClone(record),
      contents: await readFile(this.packagePath(moduleId, version), 'utf8'),
    };
  }
  async revokeToken(jti: string, actor: RegistryClaims) {
    return this.runMutation(() => this.revokeTokenUnsafe(jti, actor));
  }
  private async revokeTokenUnsafe(jti: string, actor: RegistryClaims) {
    if (!jti || jti.length > 200) throw new Error('Token ID is invalid.');
    requireRole(actor, 'registry-admin');
    if (!this.metadata.revokedTokenIds.includes(jti))
      this.metadata.revokedTokenIds.push(jti);
    await this.saveMetadata();
  }
}
