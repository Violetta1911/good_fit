import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  frontendUrl: string;
  jwtSecret: string;
  db: DbConfig;
}
interface DbConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  testDatabase: string;
}
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
  return value;
}
const config: Config = {
  port: Number(process.env.PORT) || 8000,
  nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3003',
  jwtSecret: requireEnv('JWT_SECRET'),
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: requireEnv('DB_NAME'),
    testDatabase: process.env.DB_NAME_TEST || `${requireEnv('DB_NAME')}_test`,
  },
};

export default config;
