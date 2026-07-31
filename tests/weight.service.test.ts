import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Pool } from 'mysql2/promise';
import { createTestDb, dropTestDb } from './helpers/db';
import { WeightLogInput } from '../src/modules/weight/weight.types';

let pool: Pool;
let dbName: string;
let weightService: typeof import('../src/modules/weight/weight.service').default;
let usersService: typeof import('../src/modules/users/users.service').default;
let userId: string;

function weightInput(overrides: Partial<WeightLogInput> = {}): WeightLogInput {
  return {
    entryDate: '2026-06-01',
    weightKg: '72.40',
    ...overrides,
  };
}

beforeAll(async () => {
  ({ pool, dbName } = await createTestDb());
  vi.doMock('../src/config/db', () => ({ pool }));
  weightService = (await import('../src/modules/weight/weight.service')).default;
  usersService = (await import('../src/modules/users/users.service')).default;
  const user = await usersService.createUser({
    email: 'weight@x.co', password: 'longpassword1', name: 'Weight', timezone: 'UTC',
  });
  userId = user.id;
});

afterAll(async () => {
  await dropTestDb(pool, dbName);
  vi.resetModules();
});

beforeEach(async () => {
  await pool.query('DELETE FROM weight_log');
});

describe('weightService.upsert / listRange', () => {
  it('reads back an upserted weight as a number, with the date as a YYYY-MM-DD string', async () => {
    await weightService.upsert(userId, weightInput({ entryDate: '2026-06-01', weightKg: '72.40' }));
    const rows = await weightService.listRange(userId, '2026-06-01', '2026-06-01');
    expect(rows).toHaveLength(1);
    expect(typeof rows[0].weightKg).toBe('string');
    expect(rows[0].weightKg).toBe('72.40');
    expect(rows[0].entryDate).toBe('2026-06-01');
  });

  it('passes a note through, and stores null (not "") when omitted', async () => {
    const withNote = await weightService.upsert(userId, weightInput({ note: 'after run' }));
    expect(withNote.note).toBe('after run');

    const withoutNote = await weightService.upsert(
      userId,
      weightInput({ entryDate: '2026-06-02' }),
    );
    expect(withoutNote.note).toBeNull();
  });

  it('upsert replaces the same date: one row, new weight and note (idempotent)', async () => {
    await weightService.upsert(userId, weightInput({ entryDate: '2026-06-01', weightKg: '72.40' }));
    await weightService.upsert(
      userId,
      weightInput({ entryDate: '2026-06-01', weightKg: '72.10', note: 'corrected' }),
    );
    const rows = await weightService.listRange(userId, '2026-06-01', '2026-06-01');
    expect(rows).toHaveLength(1);
    expect(rows[0].weightKg).toBe('72.10');
    expect(rows[0].note).toBe('corrected');
  });

  it('windows inclusively on both ends and returns ascending', async () => {
    for (const date of ['2026-05-31', '2026-06-01', '2026-06-30', '2026-07-01']) {
      await weightService.upsert(userId, weightInput({ entryDate: date }));
    }
    const rows = await weightService.listRange(userId, '2026-06-01', '2026-06-30');
    expect(rows.map((r) => r.entryDate)).toEqual(['2026-06-01', '2026-06-30']);
  });

  it('returns the whole history ascending when called with no window', async () => {
    for (const date of ['2026-05-31', '2026-06-01', '2026-06-30', '2026-07-01']) {
      await weightService.upsert(userId, weightInput({ entryDate: date }));
    }
    const rows = await weightService.listRange(userId);
    expect(rows.map((r) => r.entryDate)).toEqual([
      '2026-05-31', '2026-06-01', '2026-06-30', '2026-07-01',
    ]);
  });
});

describe('weightService.remove', () => {
  it('returns true and deletes the row on a hit, false on a miss', async () => {
    await weightService.upsert(userId, weightInput({ entryDate: '2026-06-01' }));

    const hit = await weightService.remove(userId, '2026-06-01');
    expect(hit).toBe(true);
    expect(await weightService.listRange(userId, '2026-06-01', '2026-06-01')).toHaveLength(0);

    const miss = await weightService.remove(userId, '2026-06-01');
    expect(miss).toBe(false);
  });
});

describe('weightService user scoping', () => {
  it("never returns another user's weight", async () => {
    const userB = await usersService.createUser({
      email: 'weight-b@x.co', password: 'longpassword1', name: 'B', timezone: 'UTC',
    });
    await weightService.upsert(userId, weightInput({ entryDate: '2026-06-01', weightKg: '72.40' }));
    await weightService.upsert(userB.id, weightInput({ entryDate: '2026-06-01', weightKg: '99.9' }));

    const all = await weightService.listRange(userId);
    expect(all).toHaveLength(1);
    expect(all[0].weightKg).toBe('72.40');

    const windowed = await weightService.listRange(userId, '2026-06-01', '2026-06-01');
    expect(windowed.map((r) => r.weightKg)).toEqual(['72.40']);
  });
});
