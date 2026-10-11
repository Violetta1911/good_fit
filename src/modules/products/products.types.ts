export type ProductSource = 'seed' | 'user' | 'off';

export interface ProductRow {
  id: string;
  owner_user_id: string | null;
  source: ProductSource;
  source_ref: string | null;
  name: string;
  brand: string | null;
  kcal_100g: string;
  protein_100g: string;
  fat_100g: string;
  carb_100g: string;
  sugar_100g: string | null;
  salt_100g: string | null;
  created_at: Date;
}
export interface ProductEntity {
  id: string;
  ownerUserId: string | null;
  source: ProductSource;
  sourceRef: string | null;
  name: string;
  brand: string | null;
  kcal100g: number;
  protein100g: number;
  fat100g: number;
  carb100g: number;
  sugar100g: number | null;
  salt100g: number | null;
  createdAt: string;
}

export interface ProductListParams {
  q?: string;
  limit: number;
  offset: number;
}

export interface ProductListResult {
  items: ProductEntity[]; 
  total: number; 
  limit: number; 
  offset: number;
}