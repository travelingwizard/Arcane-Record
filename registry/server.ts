import { readFile } from 'node:fs/promises';
import { RegistryStore } from './store';
import { createRegistryService } from './service';

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
};
const port = Number(process.env.ARCANE_REGISTRY_PORT ?? 4180);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('ARCANE_REGISTRY_PORT is invalid.');
const store = new RegistryStore(required('ARCANE_REGISTRY_DATA'));
await store.initialize();
const publicKey = await readFile(
  required('ARCANE_REGISTRY_JWT_PUBLIC_KEY'),
  'utf8',
);
const server = createRegistryService({
  store,
  publicKey,
  issuer: required('ARCANE_REGISTRY_JWT_ISSUER'),
  audience: required('ARCANE_REGISTRY_JWT_AUDIENCE'),
  allowedOrigins: required('ARCANE_REGISTRY_ALLOWED_ORIGINS')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
});
server.listen(port, '127.0.0.1', () =>
  process.stdout.write(
    `Arcane Record registry listening on 127.0.0.1:${port}\n`,
  ),
);
