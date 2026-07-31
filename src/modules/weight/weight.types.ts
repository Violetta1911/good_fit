export interface WeightLogRow {
  user_id: string;
  entry_date: string;
  weight_kg: string;
  note?: string | null;
  created_at: Date;
}
export interface WeightLogEntity {
  userId: string;
  entryDate: string;
  weightKg: string;
  note?: string | null;
  createdAt: Date;
}
export type WeightLogInput = Omit<WeightLogEntity, 'createdAt' | 'userId'>;
