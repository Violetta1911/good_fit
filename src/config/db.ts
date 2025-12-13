import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.POSTGRES,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});
