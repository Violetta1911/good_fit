export interface DailyTargetRow {
  id: string;
  user_id: string;
  effective_from: string; // YYYY-MM-DD via DATE_FORMAT in the SELECT
  kcal: string; // DECIMAL → string in mysql2
  fat_g: string;
  protein_g: string;
  carb_g: string;
  water_l: string;
  steps: number; // INT — a real number
  created_at: Date; // DATETIME → JS Date (dateStrings: false)
}
export interface DailyTargetEntity {
  id: string;
  userId: string;
  effectiveFrom: string; // YYYY-MM-DD
  kcal: number;
  fatG: number;
  proteinG: number;
  carbG: number;
  waterL: number;
  steps: number;
  createdAt: string; // ISO 8601
}
export type DailyTargetInput = Omit<DailyTargetEntity, 'id' | 'createdAt'>;
