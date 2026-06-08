import { Request, Response, NextFunction } from 'express';
import { validate } from '../../utils/validate';
import { UserRequest } from '../users/users.requests';
import { createUserSchema } from '../users/users.validation';
import usersService from '../users/users.service';
import jwt from 'jsonwebtoken';

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedBody = validate<UserRequest>(createUserSchema, req.body);

    const user = await usersService.createUser(validatedBody);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedBody = validate<UserRequest>(createUserSchema, req.body);

    const user = await usersService.validateUser(validatedBody);
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await usersService.getUserById(Number(decoded.userId));
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
