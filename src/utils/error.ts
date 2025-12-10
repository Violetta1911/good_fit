import { ERROR_MESSAGES } from './errorMessages';

export function getErrorResponse(code: keyof typeof ERROR_MESSAGES | string) {
  return {
    code,
    message: ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || 'Unexpected error',
  };
}
