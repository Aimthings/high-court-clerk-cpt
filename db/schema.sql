-- High Court Clerk CPT — MySQL 8 schema (brief §4).
-- Content bodies are JSON columns so adding a mock or passage needs no migration.
-- Window functions (used by the rank rebuild) require MySQL 8.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  phone         VARCHAR(20) UNIQUE,
  email         VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  founding_member TINYINT(1) NOT NULL DEFAULT 0,
  name          VARCHAR(120),
  anon_token    CHAR(36) UNIQUE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Legacy phone OTP codes (kept for back-compat; email sign-up uses email_codes).
CREATE TABLE IF NOT EXISTS otp_codes (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  phone       VARCHAR(20) NOT NULL,
  code_hash   CHAR(64) NOT NULL,
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at  TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (phone)
) ENGINE=InnoDB;

-- Email verification codes for sign-up (salted+hashed, TTL + attempt cap).
CREATE TABLE IF NOT EXISTS email_codes (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email       VARCHAR(255) NOT NULL,
  code_hash   CHAR(64) NOT NULL,
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at  TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (email)
) ENGINE=InnoDB;

-- The ONLY table the public rank list may read identity from.
CREATE TABLE IF NOT EXISTS profiles (
  user_id       BIGINT UNSIGNED PRIMARY KEY,
  handle        VARCHAR(40),
  region        VARCHAR(40),
  listed        TINYINT(1) NOT NULL DEFAULT 1,
  handle_set_at TIMESTAMP NULL,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS passages (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  slug        VARCHAR(80) UNIQUE NOT NULL,
  title       VARCHAR(160) NOT NULL,
  category    VARCHAR(60),
  difficulty  TINYINT UNSIGNED,
  body        MEDIUMTEXT NOT NULL,
  word_count  INT UNSIGNED,
  is_free     TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS typing_attempts (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  passage_id    BIGINT UNSIGNED NOT NULL,
  mode          ENUM('practice','drill','exam') NOT NULL,
  duration_sec  INT UNSIGNED NOT NULL,
  typed_text    MEDIUMTEXT,
  words_typed   INT UNSIGNED,
  mistakes_word INT UNSIGNED,
  mistakes_char INT UNSIGNED,
  sssc_wpm      DECIMAL(6,2),
  gross_wpm     DECIMAL(6,2),
  accuracy_pct  DECIMAL(5,2),
  taxonomy      JSON,
  passed        TINYINT(1),
  rankable      TINYINT(1) NOT NULL DEFAULT 0,
  status        ENUM('complete','review','abandoned') NOT NULL DEFAULT 'complete',
  key_events    INT UNSIGNED,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id), INDEX (passage_id),
  CONSTRAINT fk_ta_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Typing Master (learn-to-type) progress — practice only, never rankable.
-- One row per user per lesson; survives a cleared browser and follows the account.
CREATE TABLE IF NOT EXISTS typing_lesson_progress (
  user_id       BIGINT UNSIGNED NOT NULL,
  lesson_slug   VARCHAR(60) NOT NULL,
  best_accuracy TINYINT UNSIGNED NOT NULL DEFAULT 0,
  best_wpm      DECIMAL(6,2) NOT NULL DEFAULT 0,
  stars         TINYINT UNSIGNED NOT NULL DEFAULT 0,
  cleared       TINYINT(1) NOT NULL DEFAULT 0,
  attempts      INT UNSIGNED NOT NULL DEFAULT 0,
  key_stats     JSON,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, lesson_slug),
  CONSTRAINT fk_tlp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS excel_mocks (
  id       BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code     VARCHAR(40) UNIQUE NOT NULL,
  title    VARCHAR(160) NOT NULL,
  spec     JSON NOT NULL,
  is_free  TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS excel_attempts (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  mock_id      BIGINT UNSIGNED NOT NULL,
  started_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  marks        TINYINT UNSIGNED,
  passed       TINYINT(1),
  answers      JSON,
  rankable     TINYINT(1) NOT NULL DEFAULT 0,
  status       ENUM('running','submitted','review','abandoned') NOT NULL DEFAULT 'running',
  INDEX (user_id), INDEX (mock_id),
  CONSTRAINT fk_ea_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id                  BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id             BIGINT UNSIGNED NOT NULL,
  product             VARCHAR(40) NOT NULL,
  amount_paise        INT UNSIGNED NOT NULL,
  razorpay_order_id   VARCHAR(64),
  razorpay_payment_id VARCHAR(64) UNIQUE,
  status              ENUM('created','paid','failed') NOT NULL DEFAULT 'created',
  raw_payload         JSON,
  paid_at             TIMESTAMP NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS entitlements (
  id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  product    VARCHAR(40) NOT NULL,
  order_id   BIGINT UNSIGNED NOT NULL,
  starts_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  UNIQUE KEY uniq_ent (user_id, product, order_id),
  CONSTRAINT fk_ent_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  board     ENUM('typing','excel','overall') NOT NULL,
  user_id   BIGINT UNSIGNED NOT NULL,
  metric    DECIMAL(8,2) NOT NULL,
  tiebreak  DECIMAL(8,2),
  rnk       INT UNSIGNED,
  pct       DECIMAL(5,2),
  attempts  INT UNSIGNED,
  prev_rnk  INT UNSIGNED,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (board, user_id),
  INDEX (board, metric)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS leads (
  id       BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  phone    VARCHAR(20),
  email    VARCHAR(255),
  source   VARCHAR(40) NOT NULL,
  meta     JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_lead (phone, source)
) ENGINE=InnoDB;
