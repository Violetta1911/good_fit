import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../../config/db';
import { WeightLogEntity, WeightLogRow, WeightLogInput } from './weight.types';

const SELECT_COLUMNS = `
  user_id,
  DATE_FORMAT(entry_date, '%Y-%m-%d') AS entry_date,
  weight_kg, note, created_at
`;
function rowToEntity(row: WeightLogRow): WeightLogEntity {
  return {
    userId: row.user_id,
    entryDate: row.entry_date,
    weightKg: Number(row.weight_kg),
    note: row.note,
    createdAt: row.created_at.toISOString(),
  };
}

async function upsert(
  userId: string,
  input: WeightLogInput,
): Promise<WeightLogEntity> {
  await pool.query(
    `INSERT INTO weight_log (user_id, entry_date, weight_kg, note)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE weight_kg = VALUES(weight_kg), note = VALUES(note)`,
    [userId, input.entryDate, input.weightKg, input.note ?? null],
  );
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_COLUMNS} FROM weight_log WHERE user_id = ? AND entry_date = ?`,
    [userId, input.entryDate],
  );
  return rowToEntity(rows[0] as WeightLogRow);
}

async function listRange(
  userId: string,
  from?: string,
  to?: string,
): Promise<WeightLogEntity[]> {
  // Both bounds → windowed (BETWEEN). Neither → full history.
  // Day 2's validation guarantees we never get exactly one bound.
  const windowed = from != null && to != null;
  const where = windowed
    ? 'WHERE user_id = ? AND entry_date BETWEEN ? AND ?'
    : 'WHERE user_id = ?';
  const params = windowed ? [userId, from, to] : [userId];
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_COLUMNS} FROM weight_log ${where} ORDER BY entry_date ASC`,
    params,
  );
  return (rows as WeightLogRow[]).map(rowToEntity);
}

async function remove(userId: string, date: string): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM weight_log WHERE user_id = ? AND entry_date = ?`,
    [userId, date],
  );
  return result.affectedRows > 0;
}

const weightService = { upsert, listRange, remove };
export default weightService;
