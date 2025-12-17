import bcrypt from 'bcrypt';
import { pool } from '../../config/db';
import { CreateUserRequest } from './users.requests';
import { UserEntity } from './users.types';

const SALT_ROUNDS = 10;

const createUser = async (data: CreateUserRequest): Promise<UserEntity> => {
  const { email, password } = data;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { rows } = await pool.query(
    `
    INSERT INTO users (email, password_hash)
    VALUES ($1, $2)
    RETURNING id, email, created_at
    `,
    [email, passwordHash],
  );

  return rows[0];
};
const usersService = {
  createUser,
};

export default usersService;
