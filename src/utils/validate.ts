import { ObjectSchema } from 'joi';
import { AppError } from './errors/AppError';
import { ERROR_CODES } from './errors/errorCodes';

export const validate = <T>(schema: ObjectSchema<T>, data: unknown): T => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    throw new AppError(
      error.details.map((d) => d.message).join(', '),
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  return value;
};
