import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

const directory = await mkdtemp(join(tmpdir(), 'arcane-registry-smoke-'));
const port = await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.on('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const address = probe.address();
    const value = typeof address === 'object' && address ? address.port : 0;
    probe.close((error) => (error ? reject(error) : resolve(value)));
  });
});
const { publicKey } = generateKeyPairSync('ed25519');
const publicKeyPath = join(directory, 'public.pem');
await writeFile(
  publicKeyPath,
  publicKey.export({ type: 'spki', format: 'pem' }),
  { mode: 0o600 },
);
const child = spawn(process.execPath, ['registry-dist/server.js'], {
  stdio: ['ignore', 'pipe', 'inherit'],
  env: {
    ...process.env,
    ARCANE_REGISTRY_PORT: String(port),
    ARCANE_REGISTRY_DATA: join(directory, 'data'),
    ARCANE_REGISTRY_JWT_PUBLIC_KEY: publicKeyPath,
    ARCANE_REGISTRY_JWT_ISSUER: 'https://identity.example',
    ARCANE_REGISTRY_JWT_AUDIENCE: 'arcane-registry',
    ARCANE_REGISTRY_ALLOWED_ORIGINS: 'https://character.example',
  },
});
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Registry did not start.')),
      5_000,
    );
    child.stdout.once('data', () => {
      clearTimeout(timer);
      resolve();
    });
    child.once('exit', (code) =>
      reject(new Error(`Registry exited with ${code}.`)),
    );
  });
  const base = `http://127.0.0.1:${port}`;
  const health = await fetch(`${base}/v1/health`);
  if (!health.ok || (await health.json()).status !== 'ok')
    throw new Error('Health endpoint failed.');
  const unauthorized = await fetch(`${base}/v1/stages`, {
    method: 'POST',
    body: '{}',
  });
  if (unauthorized.status !== 401)
    throw new Error('Unauthenticated staging was not rejected.');
  const cors = await fetch(`${base}/v1/catalog`, {
    headers: { Origin: 'https://character.example' },
  });
  if (
    cors.headers.get('access-control-allow-origin') !==
    'https://character.example'
  )
    throw new Error('Allowed CORS origin was not returned.');
  const denied = await fetch(`${base}/v1/catalog`, {
    headers: { Origin: 'https://attacker.example' },
  });
  if (denied.headers.has('access-control-allow-origin'))
    throw new Error('Unapproved CORS origin was allowed.');
  process.stdout.write('Registry HTTP security smoke passed.\n');
} finally {
  child.kill('SIGTERM');
  await new Promise((resolve) => child.once('exit', resolve));
  await rm(directory, { recursive: true, force: true });
}
