export interface UserEntity {
  id: string;
  email: string;
  name: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRow extends Omit<UserEntity, 'createdAt' | 'updatedAt'> {
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}
