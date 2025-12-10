import { randomUUID } from 'crypto';
import { ERROR_CODES } from '../../utils/errorCodes';

export interface Product {
  id: string;
  name: string;
  kkal: number;
  fats: number;
  carbs: number;
  proteins: number;
  sugar: number;
}

const products: Product[] = [];

export function getAllProducts(): Product[] {
  return products;
}

export function getProductById(id: string): Product {
  const product = products.find((product) => product.id === id);
  if (!product) {
    const error = new Error();
    (error as unknown as { code?: string }).code = ERROR_CODES.ITEM_NOT_FOUND;
    throw error;
  }
  return product;
}

export function createProduct(
  name: string,
  kkal: number,
  fats: number,
  carbs: number,
  proteins: number,
  sugar: number,
): Product {
  const newProduct: Product = {
    id: randomUUID(),
    name,
    kkal,
    fats,
    carbs,
    proteins,
    sugar,
  };
  products.push(newProduct);
  return newProduct;
}

// TODO: Implement updateProduct and deleteProduct functions
