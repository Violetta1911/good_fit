CREATE TABLE users (
  id            CHAR(36)                            NOT NULL,
  email         VARCHAR(254) CHARACTER SET utf8mb4
                COLLATE utf8mb4_0900_ai_ci          NOT NULL,
  password_hash VARCHAR(255)                        NOT NULL,
  name          VARCHAR(120)                        NOT NULL,
  timezone      VARCHAR(64)                         NOT NULL DEFAULT 'UTC',
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                     ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
