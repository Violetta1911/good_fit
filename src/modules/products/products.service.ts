import { RowDataPacket } from 'mysql2';
import { pool } from '../../config/db';
import {
  ProductRow, ProductEntity, ProductListParams, ProductListResult,
} from './products.types';

const SELECT_COLUMNS = `
  id, owner_user_id, source, source_ref, name, brand,
  kcal_100g, fat_100g, protein_100g, carb_100g, sugar_100g, salt_100g,
  created_at
`;

const VISIBLE = '(owner_user_id = ? OR owner_user_id IS NULL) AND deleted_at IS NULL';

function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function num(v: string | null): number | null {
  return v === null ? null : Number(v);
}

function rowToEntity(row: ProductRow): ProductEntity {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    source: row.source,
    sourceRef: row.source_ref,
    name: row.name,
    brand: row.brand,
    kcal100g: Number(row.kcal_100g),
    fat100g: Number(row.fat_100g),
    protein100g: Number(row.protein_100g),
    carb100g: Number(row.carb_100g),
    sugar100g: num(row.sugar_100g),   // Number(null) === 0, so guard it
    salt100g: num(row.salt_100g),
    createdAt: row.created_at.toISOString(),
  };
}

async function list(
  userId: string,
  { q, limit, offset }: ProductListParams,
): Promise<ProductListResult> {
  // Build the filter ONCE so the page query and the count query cannot drift.
  const where: string[] = [VISIBLE];
  const params: (string | number)[] = [userId];
  if (q) {
    where.push('name LIKE ?');
    params.push(`%${escapeLike(q)}%`);
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_COLUMNS} FROM products ${whereSql}
     ORDER BY name ASC, id ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM products ${whereSql}`,
    params,
  );

  return {
    items: (rows as ProductRow[]).map(rowToEntity),
    total: Number(countRows[0].total),
    limit,
    offset,
  };
}

/** Returns null when there is no product with that id VISIBLE to this user. */
async function getById(userId: string, id: string): Promise<ProductEntity | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_COLUMNS} FROM products WHERE id = ? AND ${VISIBLE}`,
    [id, userId],
  );
  return rows.length ? rowToEntity(rows[0] as ProductRow) : null;
}

const productsService = { list, getById };
export default productsService;