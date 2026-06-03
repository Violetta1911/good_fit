import bcrypt from 'bcrypt';
import { pool } from '../../config/db';
import { UserRequest } from './users.requests';
import { UserEntity } from './users.types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const SALT_ROUNDS = 10;

const createUser = async (data: UserRequest): Promise<UserEntity> => {
  const { email, password } = data;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [result] = await pool.query<ResultSetHeader>(
    `
    INSERT INTO users (email, password_hash)
    VALUES (?, ?)
    `,
    [email, passwordHash]
  );

  const insertId = result.insertId;

  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT id, email, created_at
    FROM users
    WHERE id = ?
    `,
    [insertId]
  );

  return rows[0] as UserEntity;
};

const validateUser = async (
  data: UserRequest
): Promise<UserEntity | null> => {
  const { email, password } = data;

  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT id, email, password_hash, created_at
    FROM users
    WHERE email = ?
    `,
    [email]
  );

  const user = rows[0];
  if (!user) return null;

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!isPasswordValid) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...userWithoutPassword } = user;

  return userWithoutPassword as UserEntity;
};

const getUserById = async (id: number): Promise<UserEntity | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT id, email, created_at
    FROM users
    WHERE id = ?
    `,
    [id]
  );

  return rows[0] ? (rows[0] as UserEntity) : null;
};

const usersService = {
  createUser,
  validateUser,
  getUserById,
};

export default usersService;