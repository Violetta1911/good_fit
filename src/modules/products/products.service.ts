import { pool } from '../../config/db';
import { AppError } from '../../utils/errors/AppError';
import { ERROR_CODES } from '../../utils/errors/errorCodes';
import { CreateProductRequest } from './products.requests';
import { ProductEntity } from './products.types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const getAllProducts = async (): Promise<ProductEntity[]> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products ORDER BY name',
    );

    console.log('Rows returned:', rows); // <-- DEBUG

    if (!rows.length) {
      console.log('No products found in the database'); // <-- DEBUG
      throw new AppError('Products not found', ERROR_CODES.ITEM_NOT_FOUND);
    }

    return rows as ProductEntity[];
  } catch (err: unknown) {
    console.error('getAllProducts DB error:', err); // <-- DEBUG exact MySQL error
    throw new AppError((err as Error).message, ERROR_CODES.EMPTY_CONTENT);
  }
};

const getProductById = async (id: number): Promise<ProductEntity> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM products WHERE id = ?',
    [id],
  );

  if (!rows.length) {
    throw new AppError('Product not found', ERROR_CODES.ITEM_NOT_FOUND);
  }

  return rows[0] as ProductEntity;
};

const createProduct = async (
  data: CreateProductRequest,
): Promise<ProductEntity> => {
  const { name, kkal, fats, carbs, proteins, sugar } = data;

  const [result] = await pool.query<ResultSetHeader>(
    `
    INSERT INTO products 
      (name, kkal, fats, carbohydrates, proteins, sugar)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [name, kkal, fats, carbs, proteins, sugar],
  );

  const insertId = result.insertId;

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM products WHERE id = ?',
    [insertId],
  );

  return rows[0] as ProductEntity;
};

const productsService = {
  getAllProducts,
  getProductById,
  createProduct,
};

export default productsService;
