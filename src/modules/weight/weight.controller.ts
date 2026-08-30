import { Request, Response, NextFunction } from 'express';
import { validate } from '../../utils/validate';
import {
  putWeightSchema,
  rangeQuerySchema,
  dateParamSchema,
} from './weight.validation';
import weightService from './weight.service';
import { AppError } from '../../utils/errors/AppError';
import { ERROR_CODES } from '../../utils/errors/errorCodes';
import { PutWeightBody } from './weight.types';

export const putWeight = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { date, weightKg, note } = validate<PutWeightBody>(
      putWeightSchema,
      req.body,
    );
    const saved = await weightService.upsert(req.user!.id, {
      entryDate: date,
      weightKg,
      note,
    });
    res.status(200).json(saved);
  } catch (err) {
    next(err);
  }
};

export const getWeightSeries = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to } = validate<{ from?: string; to?: string }>(
      rangeQuerySchema,
      req.query,
    );
    const series = await weightService.listRange(req.user!.id, from, to);
    res.status(200).json(series);
  } catch (err) {
    next(err);
  }
};

export const deleteWeight = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { date } = validate<{ date: string }>(dateParamSchema, req.params);
    const deleted = await weightService.remove(req.user!.id, date);
    if (!deleted) {
      next(new AppError('No weight for that date', ERROR_CODES.ITEM_NOT_FOUND));
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
