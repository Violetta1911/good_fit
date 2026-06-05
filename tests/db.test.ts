import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import  { Pool, RowDataPacket } from 'mysql2/promise';
import { createTestDb, dropTestDb } from './helpers/db';

let pool: Pool;
let dbName: string;

beforeAll(async () => {
    const result = await createTestDb();
    pool = result.pool;
    dbName = result.dbName;
});

afterAll(async () => {
    await dropTestDb(pool, dbName);
});

describe('test-db helper', () => {
 
  it('creates a database with the users table from migrations.', async () => {
    const [rows] = await pool.query<RowDataPacket[]>(`SHOW TABLES`);
    const tableNames = rows.map(r => Object.values(r)[0]);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('schema_migrations');
  });

  it('has the expected columns.', async () => {
    const [rows] = await pool.query<RowDataPacket[]>(`DESCRIBE users`);
    const cols = rows.map(r => r.Field);
   expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'email',
        'password_hash',
        'name',
        'timezone',
        'created_at',
        'updated_at',
      ])
    );
  });
});