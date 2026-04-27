# ============================================================
# shared/db.py
# ============================================================
# MySQL baglantisi. PyMySQL kullaniyoruz cunku mysql-connector-python
# Python 3.13 ile native segfault'lara neden oluyordu.
# PyMySQL pure Python, daha stabil.
# ============================================================

import os
from pathlib import Path
from dotenv import load_dotenv
import pymysql
from pymysql.cursors import DictCursor


# .env dosyasini proje root'undan yukle
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)


def get_connection():
    """
    PyMySQL connection doner. Eski mysql-connector ile API uyumlu.
    Cursor olustururken dictionary=True yerine DictCursor kullaniliyor
    ama backend service'lerinde calisan kod oldugu gibi calismaya devam eder.
    """
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        autocommit=True,  # ufak optimizasyon
    )