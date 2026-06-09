import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { Pool } from 'mysql2/promise';
import { createTestDb, dropTestDb } from './helpers/db';

let pool: Pool;
let dbName: string;
let app: import('express').Application;

beforeAll(async () => {
  ({ pool, dbName } = await createTestDb());
  vi.doMock('../src/config/db', () => ({ pool }));
  const { buildApp } = await import('../src/server');
  app = buildApp();
});

afterAll(async () => {
  await dropTestDb(pool, dbName);
  vi.resetModules();
});

beforeEach(async () => {
  await pool.query('DELETE FROM users');
});

const USER_A = {
  email: 'alice@x.co',
  password: 'longpassword1',
  name: 'Alice',
  timezone: 'Europe/Warsaw',
};

const USER_B = {
  email: 'bob@x.co',
  password: 'longpassword1',
  name: 'Bob',
  timezone: 'America/New_York',
};

describe('Tenant isolation — Slice 0 baseline (via GET /auth/me)', () => {
  it('two concurrent sessions each see only their own /me', async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);

    await agentA.post('/auth/register').send(USER_A);
    await agentB.post('/auth/register').send(USER_B);

    const [meA, meB] = await Promise.all([
      agentA.get('/auth/me'),
      agentB.get('/auth/me'),
    ]);

    expect(meA.status).toBe(200);
    expect(meB.status).toBe(200);
    expect(meA.body.email).toBe(USER_A.email);
    expect(meB.body.email).toBe(USER_B.email);
    expect(meA.body.timezone).toBe(USER_A.timezone);
    expect(meB.body.timezone).toBe(USER_B.timezone);
    expect(meA.body.id).not.toBe(meB.body.id);
  });

  it('logging out one session does not invalidate the other', async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);

    await agentA.post('/auth/register').send(USER_A);
    await agentB.post('/auth/register').send(USER_B);

    await agentA.post('/auth/logout');

    const meA = await agentA.get('/auth/me');
    const meB = await agentB.get('/auth/me');

    expect(meA.status).toBe(401);
    expect(meA.body.code).toBe('AUTH_REQUIRED');
    expect(meB.status).toBe(200);
    expect(meB.body.email).toBe(USER_B.email);
  });

  it("a cookie belongs to its issuer — replaying A's cookie on a fresh client returns A", async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);

    const regA = await agentA.post('/auth/register').send(USER_A);
    await agentB.post('/auth/register').send(USER_B);

    // Pull A's gf_auth cookie value out of the Set-Cookie header.
    const setCookie = (regA.headers['set-cookie'] || []).join(';');
    const match = setCookie.match(/gf_auth=([^;]+)/);
    expect(match).not.toBeNull();
    const aCookie = `gf_auth=${match![1]}`;

    // Fresh client (no agent) — manually attach A's cookie.
    const res = await request(app).get('/auth/me').set('Cookie', [aCookie]);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(USER_A.email);
    expect(res.body.email).not.toBe(USER_B.email);
  });

  it('password_hash never appears in /me response (defense in depth)', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/register').send(USER_A);
    const res = await agent.get('/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.password_hash).toBeUndefined();
    expect(res.body.passwordHash).toBeUndefined();
  });
});
