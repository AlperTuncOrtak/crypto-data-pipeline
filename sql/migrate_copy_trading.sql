-- ============================================================
-- migrate_copy_trading.sql
-- Copy Trading Faz 1: kuratorlu balina listesi + takip kaydi.
-- Bu fazda para hareketi YOK. Sadece "kimi takip ediyorum".
-- ============================================================

-- 1. Balina liderleri — listeyi elle sen dolduruyorsun.
--    Otomatik siralama/kesif yok; Faz 2'nin sinyal verisi birikene kadar
--    "iyi balina" iddiasini dogrulayacak bir olcumumuz yok.
CREATE TABLE IF NOT EXISTS whale_leaders (
    id INT NOT NULL AUTO_INCREMENT,
    address VARCHAR(42) NOT NULL,
    label VARCHAR(60) NOT NULL,
    note VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    -- NULL = senin kuratorlu listen, herkese gorunur.
    -- Dolu = o kullanicinin elle ekledigi adres, sadece ona gorunur.
    added_by VARCHAR(36) NULL,

    -- Alchemy'den cekilen son anlik goruntu. Ayri bir worker yok:
    -- /copy/leaders cagrildiginda bayatlamis kayitlar tazeleniyor.
    last_total_usd DECIMAL(20,2) NULL,
    last_top_holdings JSON NULL,
    last_synced_at TIMESTAMP NULL,
    last_sync_error VARCHAR(255) NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_whale_address (address),
    KEY idx_added_by (added_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Takip kayitlari.
--    allocation_usd Faz 1'de kullanilmiyor ama Faz 2'nin "kopyalasaydin
--    ne olurdu" simulasyonu bir tutar olmadan hesaplanamiyor.
CREATE TABLE IF NOT EXISTS copy_follows (
    id INT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    leader_id INT NOT NULL,
    allocation_usd DECIMAL(12,2) NOT NULL DEFAULT 50.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_leader (user_id, leader_id),
    -- Faz 2 fan-out'u "bu balinayi kim takip ediyor" diye soracak.
    KEY idx_leader_active (leader_id, is_active),
    CONSTRAINT fk_copy_follows_leader FOREIGN KEY (leader_id) REFERENCES whale_leaders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Ornek kayit — sayfanin gercek veriyle calistigini gormek icin.
-- Adres Vitalik Buterin'in herkese acik cuzdani; "iyi trader" iddiasi
-- degil, sadece Alchemy'den veri donen dogrulanabilir bir adres.
-- KENDI LISTENI EKLEYINCE BU SATIRI SIL.
-- ------------------------------------------------------------
INSERT IGNORE INTO whale_leaders (address, label, note, sort_order) VALUES
('0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 'vitalik.eth', 'Ornek kayit — kendi listeni ekleyince sil.', 100);

-- Yeni balina eklemek icin sablon:
-- INSERT INTO whale_leaders (address, label, note, sort_order)
-- VALUES ('0x...', 'Balina adi', 'Neden listede oldugunun kisa notu', 10);

SELECT 'Copy Trading Faz 1 tables created.' AS status;
