import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { AppError } from '../utils/errors/AppError';
import { ERROR_CODES } from '../utils/errors/errorCodes';
import usersService from '../modules/users/users.service';

interface JwtPayload {
  userId: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; timezone: string };
  }
}

export async function authRequired(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.gf_auth;
    if (!token)
      throw new AppError('Not authenticated', ERROR_CODES.AUTH_REQUIRED);

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch {
      throw new AppError('Invalid or expired token', ERROR_CODES.AUTH_REQUIRED);
    }

    const user = await usersService.getById(payload.userId);
    if (!user)
      throw new AppError('User no longer exists', ERROR_CODES.AUTH_REQUIRED);

    req.user = { id: user.id, timezone: user.timezone };
    next();
  } catch (err) {
    next(err);
  }
}
