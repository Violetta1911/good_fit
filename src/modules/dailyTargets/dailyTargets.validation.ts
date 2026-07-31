import Joi from 'joi';
import { DateTime } from 'luxon';

const isoDate = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value: string, helpers) => {
    if (!DateTime.fromISO(value).isValid) return helpers.error('any.invalid');
    return value;
  }, 'calendar date');

const macro = Joi.number().min(0).max(99999.9);

export const setTargetSchema = Joi.object({
  effectiveFrom: isoDate.required(),
  kcal: macro.required(),
  fatG: macro.required(),
  proteinG: macro.required(),
  carbG: macro.required(),
  waterL: Joi.number().min(0).max(99.9).required(),
  steps: Joi.number().integer().min(0).required(),
});

export const currentQuerySchema = Joi.object({
  date: isoDate.optional(),
});
