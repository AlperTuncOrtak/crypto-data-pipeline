-- ============================================================
-- migrate_copy_trading_v2.sql
-- Copy Trading Faz 1.5: tarz etiketi + risk rozetleri.
--
-- Amac: kripto bilmeyen kullanici bir KISI secmek zorunda kalmasin,
-- bir TARZ secsin. Rozetler mevcut Alchemy verisinden hesaplaniyor,
-- yeni veri kaynagi yok, hicbir rakam uydurulmuyor.
--
-- ALTER icin information_schema kontrolu: MySQL'de
-- "ADD COLUMN IF NOT EXISTS" yok, migrate_add_coin_metadata.sql
-- ayni kalibi kullaniyor.
-- ============================================================

-- style: 'calm' | 'active' | 'aggressive' — elle sen etiketliyorsun.
-- Otomatik siniflandirma Faz 2'nin islem verisi olmadan tahmin olurdu.
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whale_leaders' AND COLUMN_NAME = 'style');
SET @sql = IF(@col = 0,
    'ALTER TABLE whale_leaders ADD COLUMN style VARCHAR(12) NULL AFTER note',
    'SELECT ''whale_leaders.style zaten var'' AS status');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- last_stats: {concentration, stable_pct, chain_count}
-- Yogunlasma top_holdings'ten turetilebilirdi ama stabilcoin orani ve
-- zincir sayisi tam bakiye listesini gerektiriyor; ucu birlikte yaziliyor.
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whale_leaders' AND COLUMN_NAME = 'last_stats');
SET @sql = IF(@col = 0,
    'ALTER TABLE whale_leaders ADD COLUMN last_stats JSON NULL AFTER last_top_holdings',
    'SELECT ''whale_leaders.last_stats zaten var'' AS status');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Ornek satirin tarzi: su anki bakiyesi cogunlukla ETH, tanimlayici bir
-- etiket. Kendi listeni ekleyince bu satiri zaten silecegiz.
UPDATE whale_leaders SET style = 'calm'
WHERE address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' AND style IS NULL;

-- Mevcut anlik goruntuleri bayatlat ki yeni rozetler ilk istekte hesaplansin.
UPDATE whale_leaders SET last_synced_at = NULL;

SELECT 'Copy Trading Faz 1.5 migration done.' AS status;
