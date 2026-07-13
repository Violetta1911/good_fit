import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { Pool } from 'mysql2/promise';
import { createTestDb, dropTestDb } from './helpers/db';

let pool: Pool;
let dbName: string;
let app: import('express').Application;
let agent: ReturnType<typeof request.agent>;

const VALID_USER = {
  email: 'me@x.co',
  password: 'longpassword1',
  name: 'Me Routes',
  timezone: 'UTC',
};

function targetBody(overrides: Record<string, unknown> = {}) {
  return {
    effectiveFrom: '2026-06-01',
    kcal: 1800,
    fatG: 60,
    proteinG: 120,
    carbG: 200,
    waterL: 2.5,
    steps: 8000,
    ...overrides,
  };
}

beforeAll(async () => {
  ({ pool, dbName } = await createTestDb());
  vi.doMock('../src/config/db', () => ({ pool }));
  const { buildApp } = await import('../src/server');
  app = buildApp();
  agent = request.agent(app);
  await agent.post('/auth/register').send(VALID_USER);
});

afterAll(async () => {
  await dropTestDb(pool, dbName);
  vi.resetModules();
});

beforeEach(async () => {
  await pool.query('DELETE FROM daily_targets');
});

describe('GET /me/daily-targets', () => {
  it('returns 401 AUTH_REQUIRED without a cookie', async () => {
    const res = await request(app).get('/me/daily-targets');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });
});

describe('POST /me/daily-targets', () => {
  it('returns 201 with a camelCase entity and numeric macros', async () => {
    const res = await agent.post('/me/daily-targets').send(targetBody());
    expect(res.status).toBe(201);
    expect(res.body.effectiveFrom).toBe('2026-06-01');
    expect(res.body.effective_from).toBeUndefined();
    expect(typeof res.body.kcal).toBe('number');
    expect(res.body.kcal).toBe(1800);
    expect(typeof res.body.proteinG).toBe('number');
  });

  it('rejects an impossible calendar date with 400 VALIDATION_ERROR', async () => {
    const res = await agent.post('/me/daily-targets').send(targetBody({ effectiveFrom: '2026-02-31' }));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /me/daily-targets/current', () => {
  it('returns the version in effect on ?date', async () => {
    await agent.post('/me/daily-targets').send(targetBody({ effectiveFrom: '2026-05-01', kcal: 2000 }));
    await agent.post('/me/daily-targets').send(targetBody({ effectiveFrom: '2026-06-01', kcal: 1800 }));
    const res = await agent.get('/me/daily-targets/current?date=2026-05-20');
    expect(res.status).toBe(200);
    expect(res.body.kcal).toBe(2000);
    expect(res.body.effectiveFrom).toBe('2026-05-01');
  });

  it('defaults to today: returns the newest target with effectiveFrom <= today', async () => {
    await agent.post('/me/daily-targets').send(targetBody({ effectiveFrom: '2019-01-01', kcal: 2000 }));
    await agent.post('/me/daily-targets').send(targetBody({ effectiveFrom: '2020-01-01', kcal: 2200 }));
    await agent.post('/me/daily-targets').send(targetBody({ effectiveFrom: '2099-01-01', kcal: 1500 }));
    const res = await agent.get('/me/daily-targets/current');
    expect(res.status).toBe(200);
    expect(res.body.kcal).toBe(2200);
  });

  it('returns 200 with body null when the user has no target yet', async () => {
    const freshAgent = request.agent(app);
    await freshAgent.post('/auth/register').send({ ...VALID_USER, email: 'fresh@x.co' });
    const res = await freshAgent.get('/me/daily-targets/current');
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

describe('PATCH /me', () => {
  it('updates only the provided field and rejects an empty patch', async () => {
    const res = await agent.patch('/me').send({ timezone: 'Europe/Warsaw' });
    expect(res.status).toBe(200);
    expect(res.body.timezone).toBe('Europe/Warsaw');
    expect(res.body.name).toBe(VALID_USER.name);

    const empty = await agent.patch('/me').send({});
    expect(empty.status).toBe(400);
  });

  it('rejects an unknown timezone with 400 VALIDATION_ERROR', async () => {
    const res = await agent.patch('/me').send({ timezone: 'Mars/Olympus' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
