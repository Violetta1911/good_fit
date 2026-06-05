import { ERROR_CODES } from './errorCodes';
import { ERROR_MESSAGES } from './errorMessages';

export function getErrorResponse(code: keyof typeof ERROR_MESSAGES | string) {
  return {
    code,
    message:
      ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || 'Unexpected error',
  };
}

export const mapCodeToStatus = (code: string): number => {
  switch (code) {
    case ERROR_CODES.VALIDATION_ERROR:
    case ERROR_CODES.EMPTY_CONTENT:
      return 400;
    case ERROR_CODES.AUTH_REQUIRED:
    case ERROR_CODES.INVALID_CREDENTIALS:
      return 401;
    case ERROR_CODES.ITEM_NOT_FOUND:
      return 404;
    case ERROR_CODES.EMAIL_TAKEN:
      return 409;
    default:
      return 500;
  }
};
