CREATE TABLE daily_targets (
  id             CHAR(36) PRIMARY KEY,
  user_id        CHAR(36)                           NOT NULL,
  effective_from DATE                               NOT NULL,
  kcal           DECIMAL(6,1)                       NOT NULL,
  fat_g          DECIMAL(6,1)                       NOT NULL,
  protein_g      DECIMAL(6,1)                       NOT NULL,
  carb_g         DECIMAL(6,1)                       NOT NULL,
  sugar_g        DECIMAL(6,1)                       NOT NULL,
  salt_g         DECIMAL(6,1)                       NOT NULL,
  water_l        DECIMAL(3,1)                       NOT NULL,
  steps          INT                                NOT NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE (user_id, effective_from),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);