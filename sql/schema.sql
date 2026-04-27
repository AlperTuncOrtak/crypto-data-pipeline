-- ============================================================
-- Crypto Analytics Platform - Database Schema (v2)
-- ============================================================
-- Bu schema temiz bir kurulum icin hazirlanmistir.
-- crypto_prices tablosu eski mimariden kalan bir artefakt,
-- yeni sistemde kullanilmayacak, bu yuzden kaldirildi.
-- ============================================================

-- NOT: Bu schema'yi ilk calistirirken tablolar yoksa sorunsuz
-- olusur. Eger tablolar varsa ve bastan olusturmak istiyorsak,
-- asagidaki DROP TABLE komutlarinin yorum satirini kaldir.

-- DROP TABLE IF EXISTS price_history_archive;
-- DROP TABLE IF EXISTS price_history;
-- DROP TABLE IF EXISTS latest_prices;
-- DROP TABLE IF EXISTS coins;


-- ============================================================
-- coins: Temel coin metadata tablosu
-- ============================================================
-- Her coin icin temel bilgi. symbol UNIQUE, yani ayni sembol
-- iki kere eklenmez. Ornek: BTC, ETH, SOL.
-- ============================================================
CREATE TABLE IF NOT EXISTS coins (
    id INT NOT NULL AUTO_INCREMENT,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_symbol (symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ============================================================
-- latest_prices: Her coin icin en guncel fiyat bilgisi
-- ============================================================
-- Bu tablo "en son ne durumda" bilgisini tutar. Her coin icin
-- TEK satir vardir (coin_id primary key). Worker her fetch'te
-- bu tabloyu upsert eder.
-- ============================================================
CREATE TABLE IF NOT EXISTS latest_prices (
    coin_id INT NOT NULL,
    current_price DECIMAL(18,8) DEFAULT NULL,
    market_cap BIGINT DEFAULT NULL,
    total_volume BIGINT DEFAULT NULL,
    price_change_24h DECIMAL(18,8) DEFAULT NULL,
    price_change_percentage_24h DECIMAL(10,4) DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (coin_id),
    CONSTRAINT fk_latest_prices_coin
        FOREIGN KEY (coin_id) REFERENCES coins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ============================================================
-- price_history: Zaman serisi fiyat kayitlari
-- ============================================================
-- Her snapshot buraya INSERT edilir. Chart ve analiz bu
-- tablodan okur. Indeks (coin_id, collected_at) uzerinde
-- oldugu icin "bu coin'in son X saati" sorgulari hizlidir.
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
    id INT NOT NULL AUTO_INCREMENT,
    coin_id INT NOT NULL,
    current_price DECIMAL(18,8) DEFAULT NULL,
    market_cap BIGINT DEFAULT NULL,
    total_volume BIGINT DEFAULT NULL,
    price_change_24h DECIMAL(18,8) DEFAULT NULL,
    price_change_percentage_24h DECIMAL(10,4) DEFAULT NULL,
    collected_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_price_history_coin_time (coin_id, collected_at),
    CONSTRAINT fk_price_history_coin
        FOREIGN KEY (coin_id) REFERENCES coins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ============================================================
-- price_history_archive: Eski kayitlar burada saklanir
-- ============================================================
-- price_history cok buyuyunce eski kayitlar buraya tasinir,
-- oradan silinir. Boylece canli sorgular hizli kalir ama
-- gecmis kaybolmaz.
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history_archive (
    id INT NOT NULL AUTO_INCREMENT,
    coin_id INT NOT NULL,
    current_price DECIMAL(18,8) DEFAULT NULL,
    market_cap BIGINT DEFAULT NULL,
    total_volume BIGINT DEFAULT NULL,
    price_change_24h DECIMAL(18,8) DEFAULT NULL,
    price_change_percentage_24h DECIMAL(10,4) DEFAULT NULL,
    collected_at TIMESTAMP NULL DEFAULT NULL,
    archived_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_archive_coin (coin_id),
    CONSTRAINT fk_archive_coin
        FOREIGN KEY (coin_id) REFERENCES coins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;