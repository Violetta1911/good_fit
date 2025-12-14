import Joi from 'joi';
import { CreateProductRequest } from './products.requests';

/**
 * Create product validation
 */
export const createProductSchema = Joi.object<CreateProductRequest>({
  name: Joi.string().trim().min(1).max(100).required(),
  kkal: Joi.number().integer().min(0).required(),
  fats: Joi.number().precision(2).min(0).required(),
  carbs: Joi.number().precision(2).min(0).required(),
  proteins: Joi.number().precision(2).min(0).required(),
  sugar: Joi.number().precision(2).min(0).required(),
});
