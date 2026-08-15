import os
import psycopg2
from dotenv import load_dotenv

# Load .env from root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DB_HOST = os.environ.get("DB_HOST")
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_NAME = os.environ.get("DB_NAME")

print(f"Connecting to {DB_HOST} / {DB_NAME} as {DB_USER}...")

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME
    )
    conn.autocommit = True
    cursor = conn.cursor()
    print("Connection successful!")
    
    # Create raw_trades table
    create_table_query = """
    CREATE TABLE IF NOT EXISTS raw_trades (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(50) NOT NULL,
        price NUMERIC NOT NULL,
        quantity NUMERIC NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        is_buyer_maker BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create index for faster queries on symbol and timestamp
    CREATE INDEX IF NOT EXISTS idx_raw_trades_symbol_timestamp 
    ON raw_trades (symbol, timestamp DESC);
    """
    
    cursor.execute(create_table_query)
    print("Table raw_trades created or already exists.")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
