export interface WeightLogRow {
  user_id: string;
  entry_date: string; // YYYY-MM-DD via DATE_FORMAT in the SELECT
  weight_kg: string; // DECIMAL → string in mysql2
  note?: string | null;
  created_at: Date; // DATETIME → JS Date (dateStrings: false)
}
export interface WeightLogEntity {
  userId: string;
  entryDate: string; // YYYY-MM-DD
  weightKg: number;
  note?: string | null;
  createdAt: string; // ISO 8601
}
export type WeightLogInput = Omit<WeightLogEntity, 'createdAt' | 'userId'>;

// The PUT /me/weight payload. Keyed by `date` (not `entryDate`), and weightKg
// arrives as a JSON number — the controller maps both onto WeightLogInput.
export interface PutWeightBody {
  date: string;
  weightKg: number;
  note?: string | null;
}
