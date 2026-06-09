import { Request, Response, NextFunction, CookieOptions } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../../config/config';
import { validate } from '../../utils/validate';
import { AppError } from '../../utils/errors/AppError';
import { ERROR_CODES } from '../../utils/errors/errorCodes';
import usersService from '../users/users.service';
import { registerSchema, loginSchema } from '../users/users.validation';
import { RegisterRequest, LoginRequest } from '../users/users.requests';

const COOKIE_NAME = 'gf_auth';
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function cookieOpts(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

function issueToken(userId: string): string {
  const options: SignOptions = { expiresIn: '30d' };
  return jwt.sign({ userId }, config.jwtSecret, options);
}

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = validate<RegisterRequest>(registerSchema, req.body);
    const user = await usersService.createUser(body);
    res.cookie(COOKIE_NAME, issueToken(user.id), cookieOpts());
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = validate<LoginRequest>(loginSchema, req.body);
    const user = await usersService.validateCredentials(
      body.email,
      body.password,
    );
    if (!user) {
      throw new AppError(
        'Invalid email or password',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }
    res.cookie(COOKIE_NAME, issueToken(user.id), cookieOpts());
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const logoutUser = (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOpts(), maxAge: undefined });
  res.status(204).send();
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user)
      throw new AppError('Not authenticated', ERROR_CODES.AUTH_REQUIRED);
    const user = await usersService.getById(req.user.id);
    if (!user) throw new AppError('User not found', ERROR_CODES.AUTH_REQUIRED);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};
