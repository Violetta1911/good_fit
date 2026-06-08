import Joi from 'joi';
import { RegisterRequest, LoginRequest } from './users.requests';
import { isValidIanaTimezone } from '../../utils/dates';

const ianaTimezone = Joi.string()
  .max(64)
  .custom((value: string, helpers) => {
    if (!isValidIanaTimezone(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'IANA timezone');

export const registerSchema = Joi.object<RegisterRequest>({
  email: Joi.string().email({ tlds: { allow: false } }).max(254).required(),
  password: Joi.string().min(10).max(128).required(),
  name: Joi.string().trim().min(1).max(120).required(),
  timezone: ianaTimezone.required(),
});

export const loginSchema = Joi.object<LoginRequest>({
  email: Joi.string().email({ tlds: { allow: false } }).max(254).required(),
  password: Joi.string().min(1).max(128).required(),
});
