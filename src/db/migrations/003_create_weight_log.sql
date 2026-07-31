CREATE TABLE weight_log (
  user_id        CHAR(36)                           NOT NULL,
  entry_date     DATE                               NOT NULL,
  weight_kg      DECIMAL(5,2)                       NOT NULL,
  note           VARCHAR(500)                       NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, entry_date),  -- the data IS the key
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);