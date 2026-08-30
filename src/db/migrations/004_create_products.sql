CREATE TABLE products (
  id            CHAR(36) PRIMARY KEY,
  owner_user_id CHAR(36) NULL,                       -- NULL = seeded/global
  source        ENUM('seed','user','off') NOT NULL,
  source_ref    VARCHAR(64) NULL,                    -- OFF barcode, etc.
  name          VARCHAR(200) NOT NULL,
  brand         VARCHAR(120) NULL,
  kcal_100g     DECIMAL(6,2) NOT NULL,
  fat_100g      DECIMAL(6,2) NOT NULL,
  protein_100g  DECIMAL(6,2) NOT NULL,
  carb_100g     DECIMAL(6,2) NOT NULL,
  sugar_100g    DECIMAL(6,2) NULL,                   -- NULL = unknown
  salt_100g     DECIMAL(6,2) NULL,                   -- NULL = unknown
  deleted_at    DATETIME(3) NULL,                    -- soft delete
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE (owner_user_id, name),
  INDEX (owner_user_id),
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);