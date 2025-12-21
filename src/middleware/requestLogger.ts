import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
};
