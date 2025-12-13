import { pool } from '../../config/db';
import { ERROR_CODES } from '../../utils/errorCodes';
import { Product } from './products.types';

export const getAllProducts = async (): Promise<Product[]> => {
  const { rows } = await pool.query<Product>(
    'SELECT * FROM products ORDER BY name',
  );
  if (!rows.length) {
    const error = new Error('Products not found') as Error & { code?: string };
    error.code = ERROR_CODES.ITEM_NOT_FOUND;
    throw error;
  }

  return rows;
};

export const getProductById = async (id: string): Promise<Product> => {
  const { rows } = await pool.query<Product>(
    'SELECT * FROM products WHERE id = $1',
    [id],
  );
  if (!rows) {
    const error = new Error();
    (error as unknown as { code?: string }).code = ERROR_CODES.ITEM_NOT_FOUND;
    throw error;
  }
  return rows[0];
};

export const createProduct = async (
  name: string,
  kkal: number,
  fats: number,
  carb: number,
  proteins: number,
  sugar: number,
): Promise<Product> => {
  const { rows } = await pool.query<Product>(
    `
    INSERT INTO products (name, kkal, fats, carbohydrates, proteins, sugar)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [name, kkal, fats, carb, proteins, sugar],
  );

  return rows[0];
};

// TODO: Implement updateProduct and deleteProduct functions
