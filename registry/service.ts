import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { randomUUID } from 'node:crypto';
import { RegistryStore } from './store';
import { verifyRegistryToken, type RegistryClaims } from './auth';

export interface RegistryServiceOptions {
  store: RegistryStore;
  publicKey: string;
  issuer: string;
  audience: string;
  allowedOrigins: string[];
}
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const json = (response: ServerResponse, status: number, value: unknown) => {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(value)}\n`);
};
async function body(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const value = Buffer.from(chunk);
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) throw new Error('Request body exceeds 5 MB.');
    chunks.push(value);
  }
  return chunks.length
    ? (JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown)
    : {};
}

class RateLimiter {
  private entries = new Map<string, { count: number; reset: number }>();
  take(key: string, maximum: number, now = Date.now()) {
    const entry = this.entries.get(key);
    if (!entry || entry.reset <= now) {
      this.entries.set(key, { count: 1, reset: now + 60_000 });
      return true;
    }
    entry.count += 1;
    return entry.count <= maximum;
  }
}

export function createRegistryService(options: RegistryServiceOptions) {
  const limiter = new RateLimiter();
  return createServer(async (request, response) => {
    const requestId = randomUUID();
    response.setHeader('X-Request-Id', requestId);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'",
    );
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
    response.setHeader('Cache-Control', 'no-store');
    const origin = request.headers.origin;
    if (origin && options.allowedOrigins.includes(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
      response.setHeader(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type',
      );
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    if (request.method === 'OPTIONS') {
      if (!origin || !options.allowedOrigins.includes(origin))
        return json(response, 403, { error: 'Origin not allowed.', requestId });
      response.statusCode = 204;
      return response.end();
    }
    const url = new URL(request.url ?? '/', 'http://registry.invalid');
    const segments = url.pathname
      .split('/')
      .filter(Boolean)
      .map(decodeURIComponent);
    const forwarded = request.headers['x-forwarded-for'];
    const loopback =
      request.socket.remoteAddress === '127.0.0.1' ||
      request.socket.remoteAddress === '::1' ||
      request.socket.remoteAddress === '::ffff:127.0.0.1';
    const remote =
      (loopback
        ? (Array.isArray(forwarded) ? forwarded[0] : forwarded)
            ?.split(',')[0]
            ?.trim()
        : undefined) ??
      request.socket.remoteAddress ??
      'unknown';
    const mutation = request.method !== 'GET';
    if (!limiter.take(`${remote}:${mutation}`, mutation ? 20 : 120)) {
      response.setHeader('Retry-After', '60');
      return json(response, 429, { error: 'Rate limit exceeded.', requestId });
    }
    const authentication: { actor: RegistryClaims | null } = { actor: null };
    const authorize = () => {
      const header = request.headers.authorization;
      if (!header?.startsWith('Bearer '))
        throw new Error('Authentication required.');
      authentication.actor = verifyRegistryToken(header.slice(7), {
        publicKey: options.publicKey,
        issuer: options.issuer,
        audience: options.audience,
        revoked: new Set(options.store.snapshot().revokedTokenIds),
      });
      return authentication.actor;
    };
    const action = `${request.method} ${url.pathname}`;
    let moduleId: string | undefined;
    let moduleVersion: string | undefined;
    let checksum: string | undefined;
    try {
      if (request.method === 'GET' && url.pathname === '/v1/health')
        return json(response, 200, { status: 'ok' });
      if (request.method === 'GET' && url.pathname === '/v1/catalog') {
        response.setHeader('Cache-Control', 'public, max-age=60');
        return json(response, 200, { modules: options.store.catalog() });
      }
      if (
        request.method === 'GET' &&
        segments[0] === 'v1' &&
        segments[1] === 'modules' &&
        segments.length === 4
      ) {
        moduleId = segments[2];
        moduleVersion = segments[3];
        const result = await options.store.package(moduleId!, moduleVersion!);
        response.setHeader('ETag', `"${result.record.checksum}"`);
        response.setHeader(
          'Digest',
          `sha-256=:${Buffer.from(result.record.checksum, 'hex').toString('base64')}:`,
        );
        response.setHeader(
          'Content-Disposition',
          `attachment; filename="${moduleId}-${moduleVersion}.arcane-module.json"`,
        );
        response.setHeader(
          'Cache-Control',
          'public, immutable, max-age=31536000',
        );
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        return response.end(result.contents);
      }
      if (request.method === 'POST' && url.pathname === '/v1/stages') {
        const claims = authorize();
        const record = await options.store.stage(await body(request), claims);
        moduleId = record.moduleId;
        moduleVersion = record.moduleVersion;
        checksum = record.checksum;
        await options.store.audit({
          requestId,
          actor: claims.sub,
          action: 'stage',
          moduleId,
          moduleVersion,
          checksum,
          outcome: 'success',
        });
        return json(response, 201, record);
      }
      if (
        request.method === 'GET' &&
        segments[0] === 'v1' &&
        segments[1] === 'stages' &&
        segments.length === 3
      ) {
        const claims = authorize();
        const result = await options.store.getStage(segments[2]!, claims);
        return json(response, 200, result);
      }
      if (
        request.method === 'POST' &&
        segments[0] === 'v1' &&
        segments[1] === 'stages' &&
        segments.length === 4 &&
        segments[3] === 'approve'
      ) {
        const claims = authorize();
        const input = (await body(request)) as { checksum?: unknown };
        if (typeof input.checksum !== 'string')
          throw new Error('Checksum is required.');
        const result = await options.store.approve(
          segments[2]!,
          input.checksum,
          claims,
        );
        moduleId = result.moduleId;
        moduleVersion = result.moduleVersion;
        checksum = result.checksum;
        await options.store.audit({
          requestId,
          actor: claims.sub,
          action: 'approve',
          moduleId,
          moduleVersion,
          checksum,
          outcome: 'success',
        });
        return json(response, 200, result);
      }
      if (
        request.method === 'POST' &&
        segments[0] === 'v1' &&
        segments[1] === 'tokens' &&
        segments.length === 4 &&
        segments[3] === 'revoke'
      ) {
        const claims = authorize();
        await options.store.revokeToken(segments[2]!, claims);
        await options.store.audit({
          requestId,
          actor: claims.sub,
          action: 'revoke-token',
          outcome: 'success',
        });
        return json(response, 200, { status: 'revoked' });
      }
      if (
        request.method === 'POST' &&
        segments[0] === 'v1' &&
        segments[1] === 'stages' &&
        segments.length === 4 &&
        segments[3] === 'reject'
      ) {
        const claims = authorize();
        const input = (await body(request)) as { reason?: unknown };
        if (typeof input.reason !== 'string' || !input.reason.trim())
          throw new Error('Rejection reason is required.');
        await options.store.reject(segments[2]!, input.reason, claims);
        await options.store.audit({
          requestId,
          actor: claims.sub,
          action: 'reject',
          outcome: 'success',
        });
        return json(response, 200, { status: 'rejected' });
      }
      if (
        request.method === 'POST' &&
        segments[0] === 'v1' &&
        segments[1] === 'modules' &&
        segments.length === 5 &&
        segments[4] === 'deprecate'
      ) {
        const claims = authorize();
        moduleId = segments[2];
        moduleVersion = segments[3];
        const input = (await body(request)) as { reason?: unknown };
        if (typeof input.reason !== 'string' || !input.reason.trim())
          throw new Error('Deprecation reason is required.');
        const result = await options.store.deprecate(
          moduleId!,
          moduleVersion!,
          input.reason,
          claims,
        );
        await options.store.audit({
          requestId,
          actor: claims.sub,
          action: 'deprecate',
          moduleId,
          moduleVersion,
          outcome: 'success',
        });
        return json(response, 200, result);
      }
      if (
        request.method === 'POST' &&
        segments[0] === 'v1' &&
        segments[1] === 'modules' &&
        segments.length === 4 &&
        segments[3] === 'rollback'
      ) {
        const claims = authorize();
        moduleId = segments[2];
        const input = (await body(request)) as { moduleVersion?: unknown };
        if (typeof input.moduleVersion !== 'string')
          throw new Error('Rollback version is required.');
        moduleVersion = input.moduleVersion;
        const result = await options.store.rollback(
          moduleId!,
          moduleVersion,
          claims,
        );
        await options.store.audit({
          requestId,
          actor: claims.sub,
          action: 'rollback',
          moduleId,
          moduleVersion,
          outcome: 'success',
        });
        return json(response, 200, result);
      }
      return json(response, 404, { error: 'Not found.', requestId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Request failed.';
      const status = /Authentication|token/i.test(message)
        ? 401
        : /Forbidden|namespace|MFA/i.test(message)
          ? 403
          : /unavailable|Not found/i.test(message)
            ? 404
            : /already exists|immutable/i.test(message)
              ? 409
              : 400;
      if (authentication.actor)
        await options.store.audit({
          requestId,
          actor: authentication.actor.sub,
          action,
          moduleId,
          moduleVersion,
          checksum,
          outcome: `rejected:${status}`,
        });
      return json(response, status, {
        error: status === 401 ? 'Authentication failed.' : message,
        requestId,
      });
    }
  });
}
