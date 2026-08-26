import os
import pymysql
from dotenv import load_dotenv

load_dotenv()
DB_HOST = os.environ.get("DB_HOST", "167.233.18.232")
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "Alper222.")
DB_NAME = os.environ.get("DB_NAME", "crypto_analysis")

conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, db=DB_NAME)
cursor = conn.cursor()

cursor.execute('''
CREATE TABLE IF NOT EXISTS promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    trial_days INT NOT NULL,
    max_uses INT NOT NULL DEFAULT 1000,
    current_uses INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS promo_redemptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    promo_code VARCHAR(50) NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (user_id, promo_code),
    INDEX idx_device_fingerprint (device_fingerprint),
    INDEX idx_ip_address (ip_address)
);
''')

# Insert a default PROMO code for testing
cursor.execute("INSERT IGNORE INTO promo_codes (code, trial_days, max_uses) VALUES ('NEKOPRO', 7, 10000);")
conn.commit()
print("Promo tables created successfully.")
