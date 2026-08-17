import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { Pool } from 'mysql2/promise';
import { createTestDb, dropTestDb } from './helpers/db';

let pool: Pool;
let dbName: string;
let app: import('express').Application;
let agent: ReturnType<typeof request.agent>;

const VALID_USER = {
  email: 'weight-routes@x.co',
  password: 'longpassword1',
  name: 'Weight Routes',
  timezone: 'UTC',
};

function weightBody(overrides: Record<string, unknown> = {}) {
  return {
    date: '2026-06-01',
    weightKg: 72.4,
    ...overrides,
  };
}

async function seed(dates: string[]) {
  for (const date of dates) {
    await agent.put('/me/weight').send(weightBody({ date }));
  }
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
  await pool.query('DELETE FROM weight_log');
});

describe('auth on the /me/weight subresource', () => {
  it('returns 401 AUTH_REQUIRED without a cookie', async () => {
    const res = await request(app).get('/me/weight?from=2026-06-01&to=2026-06-30');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  it('covers the write verbs too, not just GET', async () => {
    const put = await request(app).put('/me/weight').send(weightBody());
    expect(put.status).toBe(401);

    const del = await request(app).delete('/me/weight/2026-06-01');
    expect(del.status).toBe(401);
  });
});

describe('PUT /me/weight', () => {
  it('returns 200 with the saved camelCase entity', async () => {
    const res = await agent.put('/me/weight').send(weightBody());
    expect(res.status).toBe(200);
    expect(res.body.entryDate).toBe('2026-06-01');
    expect(res.body.entry_date).toBeUndefined();
    expect(res.body.weightKg).toBe(72.4);
    expect(typeof res.body.weightKg).toBe('number');
    expect(res.body.note).toBeNull();
  });

  it('is idempotent: the same date twice leaves one row with the new value', async () => {
    await agent.put('/me/weight').send(weightBody({ weightKg: 72.4 }));
    const second = await agent
      .put('/me/weight')
      .send(weightBody({ weightKg: 72.1, note: 'corrected' }));
    expect(second.status).toBe(200);

    const res = await agent.get('/me/weight?from=2026-06-01&to=2026-06-01');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].weightKg).toBe(72.1);
    expect(res.body[0].note).toBe('corrected');
  });

  it('rejects an impossible calendar date with 400 VALIDATION_ERROR', async () => {
    const res = await agent.put('/me/weight').send(weightBody({ date: '2026-02-31' }));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a weight past the DECIMAL(5,2) ceiling with 400 VALIDATION_ERROR', async () => {
    const res = await agent.put('/me/weight').send(weightBody({ weightKg: 1000 }));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /me/weight', () => {
  it('returns the ascending series inside the window and excludes rows outside it', async () => {
    await seed(['2026-05-31', '2026-06-01', '2026-06-30', '2026-07-01']);

    const res = await agent.get('/me/weight?from=2026-06-01&to=2026-06-30');
    expect(res.status).toBe(200);
    expect(res.body.map((r: { entryDate: string }) => r.entryDate)).toEqual([
      '2026-06-01',
      '2026-06-30',
    ]);
  });

  it('returns the full history ascending when called with no params', async () => {
    await seed(['2026-06-30', '2026-05-31', '2026-07-01', '2026-06-01']);

    const res = await agent.get('/me/weight');
    expect(res.status).toBe(200);
    expect(res.body.map((r: { entryDate: string }) => r.entryDate)).toEqual([
      '2026-05-31',
      '2026-06-01',
      '2026-06-30',
      '2026-07-01',
    ]);
  });

  it('rejects a reversed range (from > to) with 400 VALIDATION_ERROR', async () => {
    const res = await agent.get('/me/weight?from=2026-06-30&to=2026-06-01');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a one-sided window with 400 VALIDATION_ERROR (both-or-neither)', async () => {
    const fromOnly = await agent.get('/me/weight?from=2026-06-01');
    expect(fromOnly.status).toBe(400);
    expect(fromOnly.body.code).toBe('VALIDATION_ERROR');

    const toOnly = await agent.get('/me/weight?to=2026-06-30');
    expect(toOnly.status).toBe(400);
    expect(toOnly.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /me/weight/:date', () => {
  it('returns 204 with an empty body and the row is gone', async () => {
    await seed(['2026-06-01']);

    const res = await agent.delete('/me/weight/2026-06-01');
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(res.text).toBe('');

    const after = await agent.get('/me/weight');
    expect(after.body).toHaveLength(0);
  });

  it('returns 404 ITEM_NOT_FOUND for a date with no weight', async () => {
    const res = await agent.delete('/me/weight/2026-06-01');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ITEM_NOT_FOUND');
  });

  it('validates the route param: a non-date is 400 VALIDATION_ERROR, not 404', async () => {
    const res = await agent.delete('/me/weight/banana');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
