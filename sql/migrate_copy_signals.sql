-- ============================================================
-- migrate_copy_signals.sql
-- Copy Trading Faz 2: sinyal motoru.
--
-- Balinanin zincirdeki takas hareketleri tespit edilip kaydediliyor.
-- Hala gercek islem YOK — bu fazin amaci "hangi balina gercekten para
-- kazandiriyor" sorusunu OLCEREK cevaplayabilmek. Faz 3'e o veri
-- olmadan girilirse hangi balinanin kopyalanacagi tahmin olur.
-- ============================================================

-- Nerede kaldigimizin isareti: {"ethereum": 20123456, "base": 987654, ...}
-- Zincir basina ayri, cunku blok numaralari zincirler arasi kiyaslanamaz.
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whale_leaders'
      AND COLUMN_NAME = 'last_scanned_blocks');
SET @sql = IF(@col = 0,
    'ALTER TABLE whale_leaders ADD COLUMN last_scanned_blocks JSON NULL AFTER last_stats',
    'SELECT ''whale_leaders.last_scanned_blocks zaten var'' AS status');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

CREATE TABLE IF NOT EXISTS copy_signals (
    id BIGINT NOT NULL AUTO_INCREMENT,
    leader_id INT NOT NULL,
    chain VARCHAR(20) NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    block_num BIGINT NOT NULL,

    side ENUM('BUY','SELL') NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    amount DECIMAL(38,10) NOT NULL,
    usd_value DECIMAL(20,2) NOT NULL,
    -- Sinyal anindaki fiyat. Getiriyi okuma aninda bundan hesapliyoruz;
    -- ayri bir "isaretleme" tablosu tutmuyoruz.
    entry_price DECIMAL(30,10) NULL,

    -- Filtre katmani sonucu. Elenenleri de SAKLIYORUZ: filtrenin neyi
    -- attigini gormeden esikleri ayarlamak korlemesine olur.
    status ENUM('accepted','rejected') NOT NULL,
    reject_reason VARCHAR(40) NULL,

    occurred_at TIMESTAMP NULL,
    detected_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    -- Ayni takas iki tarama turunda iki kez yazilmasin.
    UNIQUE KEY uq_signal_tx (chain, tx_hash, side, contract_address),
    KEY idx_leader_time (leader_id, occurred_at),
    KEY idx_status (status, occurred_at),
    CONSTRAINT fk_copy_signals_leader FOREIGN KEY (leader_id)
        REFERENCES whale_leaders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SELECT 'Copy Trading Faz 2 signal tables created.' AS status;
