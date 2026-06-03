import Joi from 'joi';
import { UserRequest } from './users.requests';
/**
 * Create user validation
 */
export const createUserSchema = Joi.object<UserRequest>({
  email: Joi.string().trim().min(1).max(100).required(),
  password: Joi.string().min(6).max(100).required(),
});
