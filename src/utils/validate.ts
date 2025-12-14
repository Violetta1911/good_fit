import { ObjectSchema } from 'joi';
import { ERROR_CODES } from './errors/errorCodes';

export const validate = <T>(schema: ObjectSchema<T>, data: unknown): T => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const err = new Error(error.message) as Error & { code?: string };
    err.code = ERROR_CODES.VALIDATION_ERROR;
    throw err;
  }

  return value;
};
