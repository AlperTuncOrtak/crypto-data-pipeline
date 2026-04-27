# ============================================================
# src/db.py
# ============================================================
# Eski worker (src/main.py + src/insert_data.py) icin DB baglantisi.
# PyMySQL kullaniyoruz (mysql-connector Python 3.13 ile crash veriyordu).
#
# Worker hala src/'den import ettigi icin bu dosya buradan kalmaya
# devam ediyor. Faz 2'de worker'i yeniden yazacagiz, o zaman bu
# dosyayi silip shared/db.py'ye yonlendirecegiz.
# ============================================================

import os
from pathlib import Path
from dotenv import load_dotenv
import pymysql

# Load .env from project root
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)


def get_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        autocommit=False,   # worker manual commit ediyor (insert_data.py'de conn.commit())
    )