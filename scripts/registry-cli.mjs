import { readFile } from 'node:fs/promises';

const [command, ...args] = process.argv.slice(2);
const base = process.env.ARCANE_REGISTRY_URL?.replace(/\/$/, '');
const token = process.env.ARCANE_REGISTRY_TOKEN;
if (!base || !token)
  throw new Error(
    'ARCANE_REGISTRY_URL and ARCANE_REGISTRY_TOKEN are required.',
  );
const request = async (path, init = {}) => {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status}: ${text}`);
  process.stdout.write(text);
};
if (command === 'stage')
  await request('/v1/stages', {
    method: 'POST',
    body: await readFile(args[0], 'utf8'),
  });
else if (command === 'approve')
  await request(`/v1/stages/${encodeURIComponent(args[0])}/approve`, {
    method: 'POST',
    body: JSON.stringify({ checksum: args[1] }),
  });
else if (command === 'reject')
  await request(`/v1/stages/${encodeURIComponent(args[0])}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason: args.slice(1).join(' ') }),
  });
else if (command === 'deprecate')
  await request(
    `/v1/modules/${encodeURIComponent(args[0])}/${encodeURIComponent(args[1])}/deprecate`,
    {
      method: 'POST',
      body: JSON.stringify({ reason: args.slice(2).join(' ') }),
    },
  );
else if (command === 'rollback')
  await request(`/v1/modules/${encodeURIComponent(args[0])}/rollback`, {
    method: 'POST',
    body: JSON.stringify({ moduleVersion: args[1] }),
  });
else
  throw new Error(
    'Use: stage <file> | approve <stageId> <checksum> | reject <stageId> <reason> | deprecate <moduleId> <version> <reason> | rollback <moduleId> <version>',
  );
