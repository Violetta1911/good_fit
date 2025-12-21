import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors/AppError';
import { mapCodeToStatus } from '../utils/errors/error';
import { logger } from '../config/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  logger.error(err);
  if (err instanceof AppError) {
    const status = mapCodeToStatus(err.code);
    return res.status(status).json({
      message: err.message,
      code: err.code,
    });
  }
  res.status(500).json({ message: 'Internal server error' });
};
