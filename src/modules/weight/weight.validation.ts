import Joi from 'joi';
import { DateTime } from 'luxon';

const isoDate = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value: string, helpers) => {
    if (!DateTime.fromISO(value).isValid) return helpers.error('any.invalid');
    return value;
  }, 'calendar date');

  const putWeightSchema = Joi.object({
    date: isoDate.required(),
    weightKg: Joi.number().min(0).max(999.99).required(),
    note: Joi.string().max(500).allow(null, ''),
  });

  const rangeQuerySchema = Joi.object({
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
    .and('from', 'to')
    .custom((value, helpers) => {
      // ISO-8601 strings sort chronologically, so a plain string compare works.
      if (value.from && value.to && value.from > value.to) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'from <= to');

  const dateParamSchema = Joi.object({
    date: isoDate.required(),
  });

export { putWeightSchema, rangeQuerySchema, dateParamSchema };