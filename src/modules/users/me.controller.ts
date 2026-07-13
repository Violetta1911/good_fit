import { Request, Response, NextFunction } from 'express';
import { validate } from '../../utils/validate';
import { AppError } from '../../utils/errors/AppError';
import { ERROR_CODES } from '../../utils/errors/errorCodes';
import usersService from './users.service';
import { updateMeSchema } from './users.validation';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.getById(req.user!.id);
    if (!user) throw new AppError('User not found', ERROR_CODES.AUTH_REQUIRED);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const patchMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patch = validate<{ name?: string; timezone?: string }>(
      updateMeSchema,
      req.body,
    );
    const user = await usersService.updateUser(req.user!.id, patch);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};