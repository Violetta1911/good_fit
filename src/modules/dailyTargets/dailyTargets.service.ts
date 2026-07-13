import { randomUUID } from 'crypto';
import { RowDataPacket } from 'mysql2';
import { pool } from '../../config/db';
import { AppError } from '../../utils/errors/AppError';
import { ERROR_CODES } from '../../utils/errors/errorCodes';
import {
  DailyTargetEntity,
  DailyTargetRow,
  DailyTargetInput,
} from './dailyTargets.types';

const SELECT_COLUMNS = `
  id, user_id, DATE_FORMAT(effective_from, '%Y-%m-%d') AS effective_from,
  kcal, fat_g, protein_g, carb_g, water_l, steps, created_at
`;

function rowToEntity(row: DailyTargetRow): DailyTargetEntity {
  return {
    id: row.id,
    userId: row.user_id,
    effectiveFrom: row.effective_from,
    kcal: Number(row.kcal),
    fatG: Number(row.fat_g),
    proteinG: Number(row.protein_g),
    carbG: Number(row.carb_g),
    waterL: Number(row.water_l),
    steps: row.steps,
    createdAt: row.created_at.toISOString(),
  };
}

async function getCurrent(
  userId: string,
  date: string,
): Promise<DailyTargetEntity | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_COLUMNS} FROM daily_targets
     WHERE user_id = ? AND effective_from <= ?
     ORDER BY effective_from DESC
     LIMIT 1`,
    [userId, date],
  );
  if (!rows.length) return null;
  return rowToEntity(rows[0] as DailyTargetRow);
}

async function listTargets(userId: string): Promise<DailyTargetEntity[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_COLUMNS} FROM daily_targets
     WHERE user_id = ?
     ORDER BY effective_from DESC`,
    [userId],
  );
  return (rows as DailyTargetRow[]).map(rowToEntity);
}

async function setTarget(
  userId: string,
  input: DailyTargetInput,
): Promise<DailyTargetEntity> {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO daily_targets (id, user_id, effective_from,
                                kcal, fat_g, protein_g, carb_g, water_l, steps)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       kcal = VALUES(kcal), fat_g = VALUES(fat_g),
       protein_g = VALUES(protein_g), carb_g = VALUES(carb_g),
       water_l = VALUES(water_l), steps = VALUES(steps)`,
    [
      id,
      userId,
      input.effectiveFrom,
      input.kcal,
      input.fatG,
      input.proteinG,
      input.carbG,
      input.waterL,
      input.steps,
    ],
  );
  const current = await getCurrent(userId, input.effectiveFrom);
  if (!current)
    throw new AppError(
      'Target vanished after insert',
      ERROR_CODES.INTERNAL_ERROR,
    );
  return current;
}

const dailyTargetsService = { getCurrent, listTargets, setTarget };
export default dailyTargetsService;
