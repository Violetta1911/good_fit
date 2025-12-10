import { ERROR_CODES } from './errorCodes';

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.EMPTY_CONTENT]: 'Text field is required and cannot be empty',
  [ERROR_CODES.ITEM_NOT_FOUND]: 'Item not found',
};
