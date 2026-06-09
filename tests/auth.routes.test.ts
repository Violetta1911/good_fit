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

const VALID_USER = {
  email: 'route@x.co',
  password: 'longpassword1',
  name: 'Route',
  timezone: 'UTC',
};

describe('POST /auth/register', () => {
  it('creates a user, returns 201, sets gf_auth cookie', async () => {
    const res = await request(app).post('/auth/register').send(VALID_USER);
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('route@x.co');
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.headers['set-cookie'].join(';')).toMatch(/gf_auth=/);
    expect(res.headers['set-cookie'].join(';')).toMatch(/HttpOnly/);
  });

  it('rejects missing name with 400 VALIDATION_ERROR', async () => {
    const { name: _drop, ...withoutName } = VALID_USER;
    const res = await request(app).post('/auth/register').send(withoutName);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects short password with 400', async () => {
    const res = await request(app).post('/auth/register').send({ ...VALID_USER, password: 'short' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid timezone with 400', async () => {
    const res = await request(app).post('/auth/register').send({ ...VALID_USER, timezone: 'Mars/Phobos' });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate email with 409 EMAIL_TAKEN', async () => {
    await request(app).post('/auth/register').send(VALID_USER);
    const res = await request(app).post('/auth/register').send(VALID_USER);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/auth/register').send(VALID_USER);
  });

  it('returns 200 + sets cookie on correct credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'].join(';')).toMatch(/gf_auth=/);
  });

  it('returns 401 INVALID_CREDENTIALS on wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: VALID_USER.email, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 INVALID_CREDENTIALS on unknown email (does not reveal existence)', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@x.co', password: 'longpassword1' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('POST /auth/logout', () => {
  it('clears the gf_auth cookie', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(204);
    const cookie = (res.headers['set-cookie'] || []).join(';');
    expect(cookie).toMatch(/gf_auth=;/);
  });
});

describe('GET /auth/me', () => {
  it('returns 401 AUTH_REQUIRED when no cookie', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  it('returns the current user with valid cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/register').send(VALID_USER);
    const res = await agent.get('/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(VALID_USER.email);
    expect(res.body.password_hash).toBeUndefined();
  });
});