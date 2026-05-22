-- ============================================================
-- migrate_add_coin_metadata.sql
-- coins tablosuna ATH, ATL, rank, supply kolonlari ekler.
-- MySQL 5.7+ uyumlu (information_schema kontrollü).
-- Calistir: mysql -u root -p crypto_analysis < sql/migrate_add_coin_metadata.sql
-- ============================================================

SELECT 'Coin metadata migration basliyor...' AS status;

-- market_cap_rank
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coins' AND COLUMN_NAME = 'market_cap_rank');
SET @sql = IF(@col = 0,
    'ALTER TABLE coins ADD COLUMN market_cap_rank INT DEFAULT NULL AFTER image_url',
    'SELECT ''coins.market_cap_rank zaten var'' AS status');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ath
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coins' AND COLUMN_NAME = 'ath');
SET @sql = IF(@col = 0,
    'ALTER TABLE coins ADD COLUMN ath DECIMAL(30,10) DEFAULT NULL AFTER market_cap_rank',
    'SELECT ''coins.ath zaten var'' AS status');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ath_date
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coins' AND COLUMN_NAME = 'ath_date');
SET @sql = IF(@col = 0,
    'ALTER TABLE coins ADD COLUMN ath_date DATE DEFAULT NULL AFTER ath',
    'SELECT ''coins.ath_date zaten var'' AS status');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- atl
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coins' AND COLUMN_NAME = 'atl');
SET @sql = IF(@col = 0,
    'ALTER TABLE coins ADD COLUMN atl DECIMAL(30,10) DEFAULT NULL AFTER ath_date',
    'SELECT ''coins.atl zaten var'' AS status');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- atl_date
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coins' AND COLUMN_NAME = 'atl_date');
SET @sql = IF(@col = 0,
    'ALTER TABLE coins ADD COLUMN atl_date DATE DEFAULT NULL AFTER atl',
    'SELECT ''coins.atl_date zaten var'' AS status');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- circulating_supply
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coins' AND COLUMN_NAME = 'circulating_supply');
SET @sql = IF(@col = 0,
    'ALTER TABLE coins ADD COLUMN circulating_supply BIGINT DEFAULT NULL AFTER atl_date',
    'SELECT ''coins.circulating_supply zaten var'' AS status');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- total_supply
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coins' AND COLUMN_NAME = 'total_supply');
SET @sql = IF(@col = 0,
    'ALTER TABLE coins ADD COLUMN total_supply BIGINT DEFAULT NULL AFTER circulating_supply',
    'SELECT ''coins.total_supply zaten var'' AS status');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- max_supply
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coins' AND COLUMN_NAME = 'max_supply');
SET @sql = IF(@col = 0,
    'ALTER TABLE coins ADD COLUMN max_supply BIGINT DEFAULT NULL AFTER total_supply',
    'SELECT ''coins.max_supply zaten var'' AS status');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SELECT 'coins tablosu guncellendi.' AS status;
SHOW COLUMNS FROM coins;
SELECT 'Migration tamamlandi.' AS status;
