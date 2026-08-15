-- ============================================================
-- migrate_paper_trading.sql
-- Creates tables for the Virtual Trading (Paper Trading) feature.
-- ============================================================

-- 1. Paper Accounts Table (Tracks user's USD balance)
-- user_id is a VARCHAR to match Supabase UUIDs.
CREATE TABLE IF NOT EXISTS paper_accounts (
    user_id VARCHAR(36) NOT NULL,
    balance DECIMAL(18,8) NOT NULL DEFAULT 100000.00000000,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Paper Positions Table (Tracks currently held assets)
CREATE TABLE IF NOT EXISTS paper_positions (
    id INT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    amount DECIMAL(18,8) NOT NULL DEFAULT 0.00000000,
    average_price DECIMAL(18,8) NOT NULL DEFAULT 0.00000000,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_symbol (user_id, symbol),
    CONSTRAINT fk_paper_positions_account FOREIGN KEY (user_id) REFERENCES paper_accounts(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Paper Trades Table (Tracks history of all buys/sells)
CREATE TABLE IF NOT EXISTS paper_trades (
    id INT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    side ENUM('BUY', 'SELL') NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    price DECIMAL(18,8) NOT NULL,
    total_value DECIMAL(18,8) NOT NULL,
    executed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_trades (user_id, executed_at),
    CONSTRAINT fk_paper_trades_account FOREIGN KEY (user_id) REFERENCES paper_accounts(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SELECT 'Paper Trading tables created successfully.' AS status;
