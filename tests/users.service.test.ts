import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Pool } from 'mysql2/promise';
import { createTestDb, dropTestDb } from './helpers/db';

let pool: Pool;
let dbName: string;
let usersService: typeof import('../src/modules/users/users.service').default;

beforeAll(async () => {
  ({ pool, dbName } = await createTestDb());
  vi.doMock('../src/config/db', () => ({ pool }));
  usersService = (await import('../src/modules/users/users.service')).default;
});

afterAll(async () => {
  await dropTestDb(pool, dbName);
  vi.resetModules();
});

beforeEach(async () => {
  await pool.query('DELETE FROM users');
});

describe('usersService.createUser', () => {
  it('creates a user with a UUID id and hashed password', async () => {
    const user = await usersService.createUser({
      email: 'a@b.co',
      password: 'longpassword1',
      name: 'Alice',
      timezone: 'Europe/Warsaw',
    });
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.email).toBe('a@b.co');
    expect(user.name).toBe('Alice');
    expect(user.timezone).toBe('Europe/Warsaw');
    expect((user as unknown as { password_hash?: string }).password_hash).toBeUndefined();
  });

  it('lowercases the stored email', async () => {
    const user = await usersService.createUser({
      email: 'MIXED@Case.CO',
      password: 'longpassword1',
      name: 'Mix',
      timezone: 'UTC',
    });
    expect(user.email).toBe('mixed@case.co');
  });

  it('rejects duplicate email with EMAIL_TAKEN', async () => {
    await usersService.createUser({
      email: 'dup@x.co', password: 'longpassword1', name: 'A', timezone: 'UTC',
    });
    await expect(
      usersService.createUser({
        email: 'dup@x.co', password: 'longpassword2', name: 'B', timezone: 'UTC',
      })
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });
  });
});

describe('usersService.validateCredentials', () => {
  it('returns the user when password matches', async () => {
    await usersService.createUser({
      email: 'v@x.co', password: 'longpassword1', name: 'V', timezone: 'UTC',
    });
    const user = await usersService.validateCredentials('v@x.co', 'longpassword1');
    expect(user?.email).toBe('v@x.co');
  });

  it('returns null when password is wrong', async () => {
    await usersService.createUser({
      email: 'v@x.co', password: 'longpassword1', name: 'V', timezone: 'UTC',
    });
    const user = await usersService.validateCredentials('v@x.co', 'wrong-password');
    expect(user).toBeNull();
  });

  it('returns null when email is unknown', async () => {
    const user = await usersService.validateCredentials('nobody@x.co', 'longpassword1');
    expect(user).toBeNull();
  });
});

describe('usersService.getById', () => {
  it('returns the user without password_hash', async () => {
    const created = await usersService.createUser({
      email: 'g@x.co', password: 'longpassword1', name: 'G', timezone: 'UTC',
    });
    const found = await usersService.getById(created.id);
    expect(found?.id).toBe(created.id);
    expect((found as unknown as { password_hash?: string }).password_hash).toBeUndefined();
  });

  it('returns null when id is unknown', async () => {
    const found = await usersService.getById('00000000-0000-0000-0000-000000000000');
    expect(found).toBeNull();
  });
});