import { Pool } from 'pg';
import { logger } from './logger';

export const pool = new Pool({
  connectionString: process.env.POSTGRES,
});

pool.on('connect', () => {
  logger.info('✅ Connected to PostgreSQL');
});
