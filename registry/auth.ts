import { createPublicKey, verify } from 'node:crypto';
import { registryClaimsSchema, type RegistryClaims } from './schema';
export type { RegistryClaims } from './schema';

const decode = (value: string) => Buffer.from(value, 'base64url');
export function verifyRegistryToken(
  token: string,
  options: {
    publicKey: string;
    issuer: string;
    audience: string;
    now?: number;
    revoked?: ReadonlySet<string>;
  },
): RegistryClaims {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid bearer token.');
  const header = JSON.parse(decode(parts[0]!).toString('utf8')) as {
    alg?: unknown;
    typ?: unknown;
  };
  if (header.alg !== 'EdDSA' || header.typ !== 'JWT')
    throw new Error('Unsupported bearer token algorithm.');
  const valid = verify(
    null,
    Buffer.from(`${parts[0]}.${parts[1]}`),
    createPublicKey(options.publicKey),
    decode(parts[2]!),
  );
  if (!valid) throw new Error('Invalid bearer token signature.');
  const claims = registryClaimsSchema.parse(
    JSON.parse(decode(parts[1]!).toString('utf8')),
  );
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (
    claims.iss !== options.issuer ||
    !audiences.includes(options.audience) ||
    claims.exp <= now ||
    (claims.nbf !== undefined && claims.nbf > now) ||
    options.revoked?.has(claims.jti)
  )
    throw new Error(
      'Bearer token is expired, revoked, or intended for another service.',
    );
  return claims;
}
export function requireRole(
  claims: RegistryClaims,
  role: RegistryClaims['roles'][number],
) {
  if (!claims.roles.includes(role) && !claims.roles.includes('registry-admin'))
    throw new Error('Forbidden.');
  if (
    role === 'registry-admin' &&
    !claims.amr.some((method) => method === 'webauthn' || method === 'hwk')
  )
    throw new Error('Registry administration requires phishing-resistant MFA.');
}
export function requireNamespace(claims: RegistryClaims, moduleId: string) {
  requireRole(claims, 'publisher');
  if (
    !claims.namespaces.some(
      (namespace) =>
        moduleId === namespace || moduleId.startsWith(`${namespace}.`),
    )
  )
    throw new Error('Forbidden namespace.');
}
