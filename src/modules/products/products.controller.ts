import { Request, Response, NextFunction } from 'express';
import { ERROR_CODES } from '../../utils/errorCodes';
import {
  createProduct,
  getAllProducts,
  getProductById,
} from './products.service';

export const getWelcome = (_: Request, res: Response): void => {
  res.send(
    'Welcome to the PRODUCTS API! Use /items to manage your PRODUCTS list.',
  );
};

export const getProductsController = async (
  _: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const products = await getAllProducts();
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export const getProductController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  try {
    const product = await getProductById(id);
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
};

export const createProductController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, kkal, fats, carbs, proteins, sugar } = req.body;

    if (!name || !name.trim()) {
      const error = new Error('Empty content');
      (error as unknown as { code?: string }).code = ERROR_CODES.EMPTY_CONTENT;
      throw error;
    }
    // TODO: Validate other fields (kkal, fats, carbs, proteins, sugar) as needed

    const newProduct = await createProduct(
      name,
      kkal,
      fats,
      carbs,
      proteins,
      sugar,
    );
    res.status(201).json(newProduct);
  } catch (err) {
    next(err);
  }
};

// TODO: Implement updateProduct and deleteProduct controllers
