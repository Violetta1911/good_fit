import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../../config/db';
import { AppError } from '../../utils/errors/AppError';
import { ERROR_CODES } from '../../utils/errors/errorCodes';
import { RegisterRequest } from './users.requests';
import { UserEntity, UserRow } from './users.types';

const SALT_ROUNDS = 12;

function rowToEntity(row: UserRow): UserEntity {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    timezone: row.timezone,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function getById(id: string): Promise<UserEntity | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, email, password_hash, name, timezone, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [id],
  );
  if (!rows.length) return null;
  return rowToEntity(rows[0] as UserRow);
}

async function createUser(data: RegisterRequest): Promise<UserEntity> {
  const id = randomUUID();
  const email = data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  try {
    await pool.query<ResultSetHeader>(
      `INSERT INTO users (id, email, password_hash, name, timezone) VALUES (?, ?, ?, ?, ?)`,
      [id, email, passwordHash, data.name, data.timezone],
    );
  } catch (err: unknown) {
    if (isDuplicateEmail(err)) {
      throw new AppError('Email already registered', ERROR_CODES.EMAIL_TAKEN);
    }
    throw err;
  }

  const found = await getById(id);
  if (!found) throw new AppError('User vanished after insert', ERROR_CODES.INTERNAL_ERROR);
  return found;
}

function isDuplicateEmail(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'ER_DUP_ENTRY'
  );
}
async function getByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, email, password_hash, name, timezone, created_at, updated_at
     FROM users WHERE email = ? LIMIT 1`,
    [email.toLowerCase()],
  );
  return rows.length ? (rows[0] as UserRow) : null;
}

async function validateCredentials(email: string, password: string): Promise<UserEntity | null> {
  const row = await getByEmail(email);
  if (!row) return null;
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;
  return rowToEntity(row);
}

const usersService = {
  getById,
  createUser,
  validateCredentials,
};
export default usersService;