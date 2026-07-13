import { Request, Response, NextFunction } from 'express';
import { validate } from '../../utils/validate';
import { currentQuerySchema, setTargetSchema } from './dailyTargets.validation';
import dailyTargetsService from './dailyTargets.service';
import { DailyTargetInput } from './dailyTargets.types';
import { userToday } from '../../utils/dates';
    

export const getCurrentTarget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = validate<{ date?: string }>(currentQuerySchema, req.query);
    const effectiveDate = date ?? userToday(req.user!.timezone);
    const target = await dailyTargetsService.getCurrent(req.user!.id, effectiveDate);
    res.status(200).json(target); // a DailyTarget, or null — "no target yet" is data, not an error
  } catch (err) {
    next(err);
  }
};

export const listTargets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targets = await dailyTargetsService.listTargets(req.user!.id);
    res.status(200).json(targets);
  } catch (err) {
    next(err);
  }
};

export const postTarget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = validate<DailyTargetInput>(setTargetSchema, req.body);
    const target = await dailyTargetsService.setTarget(req.user!.id, input);
    res.status(201).json(target);
  } catch (err) {
    next(err);
  }
};