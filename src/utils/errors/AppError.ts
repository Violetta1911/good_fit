import { ERROR_CODES } from './errorCodes';

export class AppError extends Error {
  public code: string;

  constructor(message: string, code: string = ERROR_CODES.INTERNAL_ERROR) {
    super(message);
    this.code = code;
    // Fix prototype chain (required for instanceof to work in TS)
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
