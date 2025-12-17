import { Request, Response, NextFunction } from 'express';
import usersService from './users.service';
import { validate } from '../../utils/validate';
import { CreateUserRequest } from './users.requests';
import { createUserSchema } from './users.validation';

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedBody = validate<CreateUserRequest>(
      createUserSchema,
      req.body,
    );

    const user = await usersService.createUser(validatedBody);

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};
