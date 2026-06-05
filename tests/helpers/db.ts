import mysql, { Pool } from 'mysql2/promise';
import config from '../../src/config/config';
import { buildUmzug } from '../../src/db/umzug';

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function createTestDb(): Promise<{ pool: Pool; dbName: string }> {
  const dbName = `gf_test_${process.pid}_${randomSuffix()}`;

  // A connection (not a pool) without a database, so we can issue CREATE DATABASE.
  const admin = await mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
  });
  await admin.query(
    `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`
  );
  await admin.end();

  const pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 5,
  });

  await buildUmzug(pool).up();

  return { pool, dbName };
}

export async function dropTestDb(pool: Pool, dbName: string): Promise<void> {
  await pool.end();
  const admin = await mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
  });
  await admin.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
  await admin.end();
}