-- ============================================================
-- migrate_v2_to_v21.sql  (MySQL 5.7+ uyumlu)
-- ============================================================

SELECT 'Migration v2 → v2.1 basliyor...' AS status;

-- ------------------------------------------------------------
-- 1. coins — slug
-- ------------------------------------------------------------
SET @col = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'coins'
      AND COLUMN_NAME  = 'slug'
);
SET @sql = IF(@col = 0,
    'ALTER TABLE coins ADD COLUMN slug VARCHAR(150) DEFAULT NULL AFTER name',
    'SELECT ''coins.slug zaten var, atlaniyor'' AS status'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 2. coins — image_url
-- ------------------------------------------------------------
SET @col = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'coins'
      AND COLUMN_NAME  = 'image_url'
);
SET @sql = IF(@col = 0,
    'ALTER TABLE coins ADD COLUMN image_url VARCHAR(500) DEFAULT NULL AFTER slug',
    'SELECT ''coins.image_url zaten var, atlaniyor'' AS status'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 3. coins — idx_coins_slug index
-- ------------------------------------------------------------
SET @idx = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'coins'
      AND INDEX_NAME   = 'idx_coins_slug'
);
SET @sql = IF(@idx = 0,
    'ALTER TABLE coins ADD INDEX idx_coins_slug (slug)',
    'SELECT ''idx_coins_slug zaten var, atlaniyor'' AS status'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'coins tablosu guncellendi.' AS status;

-- ------------------------------------------------------------
-- 4. latest_prices — data_source
-- ------------------------------------------------------------
SET @col = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'latest_prices'
      AND COLUMN_NAME  = 'data_source'
);
SET @sql = IF(@col = 0,
    'ALTER TABLE latest_prices ADD COLUMN data_source VARCHAR(20) DEFAULT NULL AFTER price_change_percentage_24h',
    'SELECT ''latest_prices.data_source zaten var, atlaniyor'' AS status'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 5. latest_prices — last_updated
-- ------------------------------------------------------------
SET @col = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'latest_prices'
      AND COLUMN_NAME  = 'last_updated'
);
SET @sql = IF(@col = 0,
    'ALTER TABLE latest_prices ADD COLUMN last_updated DATETIME DEFAULT NULL AFTER data_source',
    'SELECT ''latest_prices.last_updated zaten var, atlaniyor'' AS status'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'latest_prices tablosu guncellendi.' AS status;

-- ------------------------------------------------------------
-- 6. price_history — gereksiz kolonlari kaldir
-- ------------------------------------------------------------
SET @col = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'price_history'
      AND COLUMN_NAME  = 'market_cap'
);
SET @sql = IF(@col > 0,
    'ALTER TABLE price_history DROP COLUMN market_cap, DROP COLUMN total_volume, DROP COLUMN price_change_24h, DROP COLUMN price_change_percentage_24h',
    'SELECT ''price_history gereksiz kolonlar zaten yok'' AS status'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'price_history guncellendi.' AS status;

-- ------------------------------------------------------------
-- 7. price_history_archive — gereksiz kolonlari kaldir
-- ------------------------------------------------------------
SET @col = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'price_history_archive'
      AND COLUMN_NAME  = 'market_cap'
);
SET @sql = IF(@col > 0,
    'ALTER TABLE price_history_archive DROP COLUMN market_cap, DROP COLUMN total_volume, DROP COLUMN price_change_24h, DROP COLUMN price_change_percentage_24h',
    'SELECT ''price_history_archive gereksiz kolonlar zaten yok'' AS status'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'price_history_archive guncellendi.' AS status;

-- ------------------------------------------------------------
-- 8. Sonuc dogrulama
-- ------------------------------------------------------------
SELECT 'coins kolonlari:' AS '';
SHOW COLUMNS FROM coins;

SELECT 'latest_prices kolonlari:' AS '';
SHOW COLUMNS FROM latest_prices;

SELECT 'Migration v2.1 tamamlandi.' AS status;