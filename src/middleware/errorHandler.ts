/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { ERROR_CODES } from '../utils/errorCodes';
import { getErrorResponse } from '../utils/error';

interface CustomError extends Error {
  code?: string;
}

export function errorHandler(
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const status = error.code === ERROR_CODES.ITEM_NOT_FOUND ? 404 : 400;

  res.status(status).json(getErrorResponse(error.code ?? 'UNKNOWN_ERROR'));
}
