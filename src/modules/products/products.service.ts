import { pool } from '../../config/db';
import { AppError } from '../../utils/errors/AppError';
import { ERROR_CODES } from '../../utils/errors/errorCodes';
import { CreateProductRequest } from './products.requests';
import { ProductEntity } from './products.types';

const getAllProducts = async (): Promise<ProductEntity[]> => {
  const { rows } = await pool.query<ProductEntity>(
    'SELECT * FROM products ORDER BY name',
  );
  if (!rows.length) {
    throw new AppError('Products not found', ERROR_CODES.ITEM_NOT_FOUND);
  }

  return rows;
};

const getProductById = async (id: string): Promise<ProductEntity> => {
  const { rows } = await pool.query<ProductEntity>(
    'SELECT * FROM products WHERE id = $1',
    [id],
  );
  if (!rows.length) {
    throw new AppError('Product not found', ERROR_CODES.ITEM_NOT_FOUND);
  }

  return rows[0];
};

const createProduct = async (
  data: CreateProductRequest,
): Promise<ProductEntity> => {
  const { name, kkal, fats, carbs, proteins, sugar } = data;
  const { rows } = await pool.query<ProductEntity>(
    `
    INSERT INTO products (name, kkal, fats, carbohydrates, proteins, sugar)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [name, kkal, fats, carbs, proteins, sugar],
  );

  return rows[0];
};

const productsService = {
  getAllProducts,
  getProductById,
  createProduct,
};
// TODO: Implement updateProduct and deleteProduct functions

export default productsService;
