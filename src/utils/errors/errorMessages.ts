import { ERROR_CODES } from './errorCodes';

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.EMPTY_CONTENT]: 'Text field is required and cannot be empty',
  [ERROR_CODES.ITEM_NOT_FOUND]: 'Item not found',
  [ERROR_CODES.AUTH_REQUIRED]: 'Authentication required',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ERROR_CODES.EMAIL_TAKEN]: 'An account with this email already exists',
};
