-- ==========================================================
-- Migration: Add features_vwap table for Whale Anomaly ML
-- ==========================================================

CREATE TABLE IF NOT EXISTS features_vwap (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    timestamp DATETIME NOT NULL,
    vwap_1h DOUBLE NOT NULL,
    total_volume DOUBLE NOT NULL,
    buy_volume DOUBLE NOT NULL,
    sell_volume DOUBLE NOT NULL,
    anomaly_score DOUBLE DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY idx_symbol_timestamp (symbol, timestamp)
);

-- Optimize queries for anomaly detection and chart rendering
CREATE INDEX idx_vwap_time ON features_vwap(timestamp);
CREATE INDEX idx_vwap_symbol ON features_vwap(symbol);
