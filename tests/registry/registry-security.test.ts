import { generateKeyPairSync, sign } from 'node:crypto';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { verifyRegistryToken } from '../../registry/auth';
import { RegistryStore } from '../../registry/store';
import type { RegistryClaims } from '../../registry/schema';
import { createSyntheticModule } from '../fixtures/synthetic-module';

const directories: string[] = [];
const keyPair = generateKeyPairSync('ed25519');
const publicKey = keyPair.publicKey
  .export({ type: 'spki', format: 'pem' })
  .toString();
const token = (claims: RegistryClaims) => {
  const header = Buffer.from(
    JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = sign(
    null,
    Buffer.from(`${header}.${payload}`),
    keyPair.privateKey,
  ).toString('base64url');
  return `${header}.${payload}.${signature}`;
};
const claims = (
  sub: string,
  roles: RegistryClaims['roles'],
  namespaces = ['net.example'],
): RegistryClaims => ({
  iss: 'https://identity.example',
  aud: 'arcane-registry',
  sub,
  exp: 2_000_000_000,
  roles,
  namespaces,
  amr: ['webauthn'],
  jti: `${sub}-token`,
});

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe('hosted registry security policy', () => {
  it('verifies issuer, audience, expiry, signature, and revocation', () => {
    const value = token(claims('publisher', ['publisher']));
    expect(
      verifyRegistryToken(value, {
        publicKey,
        issuer: 'https://identity.example',
        audience: 'arcane-registry',
        now: 1_900_000_000,
      }).sub,
    ).toBe('publisher');
    expect(() =>
      verifyRegistryToken(value, {
        publicKey,
        issuer: 'wrong',
        audience: 'arcane-registry',
        now: 1_900_000_000,
      }),
    ).toThrow(/another service/i);
    expect(() =>
      verifyRegistryToken(value, {
        publicKey,
        issuer: 'https://identity.example',
        audience: 'arcane-registry',
        now: 1_900_000_000,
        revoked: new Set(['publisher-token']),
      }),
    ).toThrow(/revoked/i);
  });

  it('requires phishing-resistant MFA for registry administration', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'arcane-registry-'));
    directories.push(directory);
    const store = new RegistryStore(directory);
    await store.initialize();
    await expect(
      store.revokeToken('target-token', {
        ...claims('admin', ['registry-admin']),
        amr: ['pwd'],
      }),
    ).rejects.toThrow(/phishing-resistant MFA/i);
    await store.revokeToken(
      'target-token',
      claims('admin', ['registry-admin']),
    );
    expect(store.snapshot().revokedTokenIds).toContain('target-token');
  });

  it('enforces namespace, separate exact-checksum review, immutability, deprecation, and rollback', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'arcane-registry-'));
    directories.push(directory);
    const store = new RegistryStore(directory);
    await store.initialize();
    const module = createSyntheticModule();
    await expect(
      store.stage(module, claims('outsider', ['publisher'], ['org.other'])),
    ).rejects.toThrow(/namespace/i);
    const stagedOne = await store.stage(
      module,
      claims('publisher', ['publisher']),
    );
    await expect(
      store.stage(module, claims('publisher', ['publisher'])),
    ).rejects.toThrow(/immutable/i);
    await expect(
      store.approve(
        stagedOne.id,
        '0'.repeat(64),
        claims('reviewer', ['reviewer']),
      ),
    ).rejects.toThrow(/exact staged checksum/i);
    await expect(
      store.approve(
        stagedOne.id,
        stagedOne.checksum,
        claims('publisher', ['publisher', 'reviewer']),
      ),
    ).rejects.toThrow(/different actors/i);
    await store.approve(
      stagedOne.id,
      stagedOne.checksum,
      claims('reviewer', ['reviewer']),
    );
    expect(
      (await store.package(module.moduleId, module.moduleVersion)).record
        .checksum,
    ).toBe(stagedOne.checksum);
    const immutableBytes = await readFile(
      join(
        directory,
        'packages',
        module.moduleId,
        `${module.moduleVersion}.json`,
      ),
      'utf8',
    );

    const next = structuredClone(module);
    next.moduleVersion = '1.1.0';
    const stagedTwo = await store.stage(
      next,
      claims('publisher', ['publisher']),
    );
    await store.approve(
      stagedTwo.id,
      stagedTwo.checksum,
      claims('reviewer', ['reviewer']),
    );
    await store.deprecate(
      module.moduleId,
      next.moduleVersion,
      'Broken rules',
      claims('admin', ['registry-admin']),
    );
    await expect(
      store.rollback(
        module.moduleId,
        next.moduleVersion,
        claims('admin', ['registry-admin']),
      ),
    ).rejects.toThrow(/non-deprecated/i);
    expect(
      (
        await store.rollback(
          module.moduleId,
          module.moduleVersion,
          claims('admin', ['registry-admin']),
        )
      ).moduleVersion,
    ).toBe('1.0.0');
    expect(
      await readFile(
        join(
          directory,
          'packages',
          module.moduleId,
          `${module.moduleVersion}.json`,
        ),
        'utf8',
      ),
    ).toBe(immutableBytes);
    expect(
      store.catalog().find(({ moduleVersion }) => moduleVersion === '1.0.0')
        ?.recommended,
    ).toBe(true);
  });

  it('rejects executable module content before quarantine storage', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'arcane-registry-'));
    directories.push(directory);
    const store = new RegistryStore(directory);
    await store.initialize();
    await expect(
      store.stage(
        { ...createSyntheticModule(), script: 'alert(1)' },
        claims('publisher', ['publisher']),
      ),
    ).rejects.toThrow(/executable/i);
    expect(store.snapshot().stages).toEqual([]);
  });

  it('serializes concurrent same-version staging so only one immutable key wins', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'arcane-registry-'));
    directories.push(directory);
    const store = new RegistryStore(directory);
    await store.initialize();
    const results = await Promise.allSettled([
      store.stage(
        createSyntheticModule(),
        claims('publisher-one', ['publisher']),
      ),
      store.stage(
        createSyntheticModule(),
        claims('publisher-two', ['publisher']),
      ),
    ]);
    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
      1,
    );
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(
      1,
    );
    expect(store.snapshot().stages).toHaveLength(1);
  });

  it('refuses startup when published package bytes were tampered with', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'arcane-registry-'));
    directories.push(directory);
    const store = new RegistryStore(directory);
    await store.initialize();
    const module = createSyntheticModule();
    const staged = await store.stage(
      module,
      claims('publisher', ['publisher']),
    );
    await store.approve(
      staged.id,
      staged.checksum,
      claims('reviewer', ['reviewer']),
    );
    const packagePath = join(
      directory,
      'packages',
      module.moduleId,
      `${module.moduleVersion}.json`,
    );
    await chmod(packagePath, 0o600);
    await writeFile(packagePath, '{}');
    await expect(new RegistryStore(directory).initialize()).rejects.toThrow();
  });
});
