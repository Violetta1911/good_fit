import { Request, Response, NextFunction } from 'express';
import productsService from './products.service';
import { validate } from '../../utils/validate';
import { createProductSchema } from './products.validation';
import { CreateProductRequest } from './products.requests';

export const getWelcome = (_: Request, res: Response): void => {
  res.send(
    'Welcome to the PRODUCTS API! Use /items to manage your PRODUCTS list.',
  );
};

export const getProducts = async (
  _: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const products = await productsService.getAllProducts();
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  try {
    const product = await productsService.getProductById(id);
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedBody = validate<CreateProductRequest>(
      createProductSchema,
      req.body,
    );
    const newProduct = await productsService.createProduct(validatedBody);
    res.status(201).json(newProduct);
  } catch (err) {
    next(err);
  }
};

// TODO: Implement updateProduct and deleteProduct controllers
