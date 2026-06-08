import mysql, { Pool } from 'mysql2/promise';
import config from './config';
import { logger } from './logger';

export function createPool(database: string): Pool {
  const pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: false,
    dateStrings: false,
    timezone: 'Z',
  });
  pool.on('connection', (connection) => {
    logger.debug(
      `mysql: new connection on ${database} (thread ${connection.threadId})`,
    );
  });
  pool.on('enqueue', () => {
    logger.debug('MySQL Pool Waiting for available connection');
  });
  return pool;
}

export const pool = createPool(config.db.database);
