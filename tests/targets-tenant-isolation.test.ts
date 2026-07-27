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

const target = (effectiveFrom: string, kcal: number) => ({
  effectiveFrom, kcal, fatG: 70, proteinG: 150, carbG: 200, waterL: 2.5, steps: 10000,
});

describe('daily targets tenant isolation', () => {
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

    await agentA.post('/me/daily-targets').send(target('2026-05-01', 2000)).expect(201);
    await agentA.post('/me/daily-targets').send(target('2026-06-01', 1800)).expect(201);
  });

  it("B's current is null despite A's targets existing", async () => {
    const res = await agentB
      .get('/me/daily-targets/current?date=2026-06-15')
      .expect(200);
    expect(res.body).toBeNull();
  });

  it("B's list is empty", async () => {
    const res = await agentB.get('/me/daily-targets').expect(200);
    expect(res.body).toEqual([]);
  });

  it("B's write is visible to B and invisible to A", async () => {
    await agentB.post('/me/daily-targets').send(target('2026-06-10', 1500)).expect(201);

    const bCurrent = await agentB
      .get('/me/daily-targets/current?date=2026-06-15')
      .expect(200);
    expect(bCurrent.body.kcal).toBe(1500);

    const aList = await agentA.get('/me/daily-targets').expect(200);
    expect(aList.body).toHaveLength(2);
  });
});
