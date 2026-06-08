import { Umzug } from 'umzug';
import fs from 'fs';
import path from 'path';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { logger } from '../config/logger';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export function buildUmzug(pool: Pool) {
  return new Umzug({
    migrations: () => {
      // List *.sql files but exclude *.down.sql (those are partners, not separate migrations).
      const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
        .sort();
      return files.map((file) => {
        const name = file.replace(/\.sql$/, '');
        const upPath = path.join(MIGRATIONS_DIR, file);
        const downPath = path.join(MIGRATIONS_DIR, name + '.down.sql');
        return {
          name,
          up: async () => {
            const sql = fs.readFileSync(upPath, 'utf-8');
            for (const stmt of splitSql(sql)) await pool.query(stmt);
          },
          down: async () => {
            if (!fs.existsSync(downPath))
              throw new Error(`No down migration for ${name}`);
            const sql = fs.readFileSync(downPath, 'utf-8');
            for (const stmt of splitSql(sql)) await pool.query(stmt);
          },
        };
      });
    },
    context: pool,
    storage: {
      async executed() {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS schema_migrations (
            name VARCHAR(255) PRIMARY KEY,
            run_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          )
        `);
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT name FROM schema_migrations ORDER BY name',
        );
        return rows.map((r) => r.name as string);
      },
      async logMigration({ name }) {
        await pool.query('INSERT INTO schema_migrations (name) VALUES (?)', [
          name,
        ]);
      },
      async unlogMigration({ name }) {
        await pool.query('DELETE FROM schema_migrations WHERE name = ?', [
          name,
        ]);
      },
    },
    logger,
  });
}

// Split a multi-statement SQL file on semicolons that are NOT inside string literals.
// mysql2's pool.query() runs ONE statement by default. We loop instead.
function splitSql(sql: string): string[] {
  const out: string[] = [];
  let buf = '';
  let inSingle = false,
    inDouble = false,
    inBacktick = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (c === "'" && !inDouble && !inBacktick) inSingle = !inSingle;
    else if (c === '"' && !inSingle && !inBacktick) inDouble = !inDouble;
    else if (c === '`' && !inSingle && !inDouble) inBacktick = !inBacktick;
    if (c === ';' && !inSingle && !inDouble && !inBacktick) {
      const stmt = buf.trim();
      if (stmt) out.push(stmt);
      buf = '';
      continue;
    }
    buf += c;
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}
