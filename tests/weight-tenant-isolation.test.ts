import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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

describe('weight tenant isolation', () => {
  let agentA: ReturnType<typeof request.agent>;
  let agentB: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    agentA = request.agent(app);
    agentB = request.agent(app);
    await agentA.post('/auth/register').send({
      email: 'a@example.com', password: 'longenough1', name: 'A', timezone: 'UTC',
    }).expect(201);
    await agentB.post('/auth/register').send({
      email: 'b@example.com', password: 'longenough1', name: 'B', timezone: 'UTC',
    }).expect(201);
  });

  it("B's write on the same date as A's is isolated from A", async () => {
    await agentA.put('/me/weight').send({ date: '2026-06-01', weightKg: 70 }).expect(200);
    await agentB.put('/me/weight').send({ date: '2026-06-01', weightKg: 90 }).expect(200);

    const bRes = await agentB
      .get('/me/weight?from=2026-01-01&to=2026-12-31')
      .expect(200);
    expect(bRes.body).toHaveLength(1);
    expect(bRes.body[0].weightKg).toBe(90);
  });

  it("B's delete cannot remove A's row for the same date", async () => {
    await agentB.delete('/me/weight/2026-06-01').expect(204);

    const bRes = await agentB
      .get('/me/weight?from=2026-01-01&to=2026-12-31')
      .expect(200);
    expect(bRes.body).toEqual([]);

    const aRes = await agentA
      .get('/me/weight?from=2026-01-01&to=2026-12-31')
      .expect(200);
    expect(aRes.body).toHaveLength(1);
    expect(aRes.body[0].weightKg).toBe(70);
  });

  it("A's own delete removes A's row, and a repeat delete 404s", async () => {
    await agentA.delete('/me/weight/2026-06-01').expect(204);
    await agentA.delete('/me/weight/2026-06-01').expect(404);
  });
});
