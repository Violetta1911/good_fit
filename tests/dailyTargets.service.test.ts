import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Pool } from 'mysql2/promise';
import { createTestDb, dropTestDb } from './helpers/db';
import { DailyTargetInput } from '../src/modules/dailyTargets/dailyTargets.types';

let pool: Pool;
let dbName: string;
let dailyTargetsService: typeof import('../src/modules/dailyTargets/dailyTargets.service').default;
let usersService: typeof import('../src/modules/users/users.service').default;
let userId: string;

function targetInput(overrides: Partial<DailyTargetInput> = {}): DailyTargetInput {
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
  dailyTargetsService = (await import('../src/modules/dailyTargets/dailyTargets.service')).default;
  usersService = (await import('../src/modules/users/users.service')).default;
  const user = await usersService.createUser({
    email: 'targets@x.co', password: 'longpassword1', name: 'Targets', timezone: 'UTC',
  });
  userId = user.id;
});

afterAll(async () => {
  await dropTestDb(pool, dbName);
  vi.resetModules();
});

beforeEach(async () => {
  await pool.query('DELETE FROM daily_targets');
});

describe('dailyTargetsService.setTarget / getCurrent', () => {
  it('inserts a target and getCurrent finds it, with numeric kcal and string effectiveFrom', async () => {
    await dailyTargetsService.setTarget(userId, targetInput({ effectiveFrom: '2026-06-01' }));
    const current = await dailyTargetsService.getCurrent(userId, '2026-06-15');
    expect(current).not.toBeNull();
    expect(typeof current!.kcal).toBe('number');
    expect(current!.kcal).toBe(1800);
    expect(current!.effectiveFrom).toBe('2026-06-01');
  });

  it('picks the version in effect as of the given date', async () => {
    await dailyTargetsService.setTarget(userId, targetInput({ effectiveFrom: '2026-05-01', kcal: 2000 }));
    await dailyTargetsService.setTarget(userId, targetInput({ effectiveFrom: '2026-06-01', kcal: 1800 }));
    const may = await dailyTargetsService.getCurrent(userId, '2026-05-20');
    expect(may!.kcal).toBe(2000);
    const june = await dailyTargetsService.getCurrent(userId, '2026-06-05');
    expect(june!.kcal).toBe(1800);
  });

  it('assigns the boundary day to the new target', async () => {
    await dailyTargetsService.setTarget(userId, targetInput({ effectiveFrom: '2026-05-01', kcal: 2000 }));
    await dailyTargetsService.setTarget(userId, targetInput({ effectiveFrom: '2026-06-01', kcal: 1800 }));
    const boundary = await dailyTargetsService.getCurrent(userId, '2026-06-01');
    expect(boundary!.kcal).toBe(1800);
  });

  it('returns null for dates before any target', async () => {
    await dailyTargetsService.setTarget(userId, targetInput({ effectiveFrom: '2026-06-01' }));
    const before = await dailyTargetsService.getCurrent(userId, '2026-01-01');
    expect(before).toBeNull();
  });

  it('upserts: setting the same effective_from twice replaces the macros', async () => {
    await dailyTargetsService.setTarget(userId, targetInput({ effectiveFrom: '2026-06-01', kcal: 2000 }));
    await dailyTargetsService.setTarget(userId, targetInput({ effectiveFrom: '2026-06-01', kcal: 1750 }));
    const targets = await dailyTargetsService.listTargets(userId);
    expect(targets).toHaveLength(1);
    expect(targets[0].effectiveFrom).toBe('2026-06-01');
    expect(targets[0].kcal).toBe(1750);
  });
});

describe('dailyTargetsService.listTargets', () => {
  it('returns all targets, newest effective_from first', async () => {
    await dailyTargetsService.setTarget(userId, targetInput({ effectiveFrom: '2026-05-01' }));
    await dailyTargetsService.setTarget(userId, targetInput({ effectiveFrom: '2026-07-01' }));
    await dailyTargetsService.setTarget(userId, targetInput({ effectiveFrom: '2026-06-01' }));
    const targets = await dailyTargetsService.listTargets(userId);
    expect(targets.map((t) => t.effectiveFrom)).toEqual(['2026-07-01', '2026-06-01', '2026-05-01']);
  });
});

describe('dailyTargetsService user scoping', () => {
  it("never returns another user's targets", async () => {
    const userB = await usersService.createUser({
      email: 'targets-b@x.co', password: 'longpassword1', name: 'B', timezone: 'UTC',
    });
    await dailyTargetsService.setTarget(userId, targetInput({ effectiveFrom: '2026-05-01', kcal: 2000 }));
    await dailyTargetsService.setTarget(userB.id, targetInput({ effectiveFrom: '2026-06-01', kcal: 1500 }));

    const currentA = await dailyTargetsService.getCurrent(userId, '2026-06-15');
    expect(currentA!.kcal).toBe(2000);

    const targetsA = await dailyTargetsService.listTargets(userId);
    expect(targetsA).toHaveLength(1);
    expect(targetsA[0].userId).toBe(userId);
  });
});
