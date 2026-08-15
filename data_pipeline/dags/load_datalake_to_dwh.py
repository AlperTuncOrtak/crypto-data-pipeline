from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from datetime import datetime, timedelta
import os
import shutil
import pandas as pd

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=1),
}

DATA_LAKE_DIR = "/opt/airflow/data_lake/raw_trades"
PROCESSED_DIR = "/opt/airflow/data_lake/processed_trades"

def setup_database():
    """Create raw_trades table if it doesn't exist."""
    hook = PostgresHook(postgres_conn_id="airflow_db")
    
    # We are using the airflow database itself as the DWH for this MVP
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS raw_trades (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(50) NOT NULL,
        price NUMERIC NOT NULL,
        quantity NUMERIC NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        is_buyer_maker BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_raw_trades_symbol_timestamp 
    ON raw_trades (symbol, timestamp DESC);
    """
    hook.run(create_table_sql)


def load_parquet_to_postgres():
    """Find parquet files, load them to pandas, and write to postgres."""
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    os.makedirs(DATA_LAKE_DIR, exist_ok=True)

    files = [f for f in os.listdir(DATA_LAKE_DIR) if f.endswith('.parquet')]
    
    if not files:
        print("No new parquet files to process.")
        return

    hook = PostgresHook(postgres_conn_id="airflow_db")
    engine = hook.get_sqlalchemy_engine()
    
    processed_count = 0
    for file in files:
        filepath = os.path.join(DATA_LAKE_DIR, file)
        try:
            print(f"Processing {filepath}...")
            df = pd.read_parquet(filepath)
            
            # Map column names if necessary, ws_consumer saves them as:
            # symbol, price, quantity, timestamp, is_buyer_maker
            
            # Write to postgres
            df.to_sql('raw_trades', engine, if_exists='append', index=False)
            
            # Move to processed
            shutil.move(filepath, os.path.join(PROCESSED_DIR, file))
            processed_count += 1
            print(f"Successfully loaded {len(df)} rows from {file}")
            
        except Exception as e:
            print(f"Error processing {file}: {e}")
            
    print(f"Finished processing {processed_count} files.")


with DAG(
    'load_datalake_to_dwh',
    default_args=default_args,
    description='Load Parquet trades from Data Lake to PostgreSQL',
    schedule_interval=timedelta(minutes=1),
    start_date=datetime(2023, 1, 1),
    catchup=False,
    tags=['etl', 'crypto'],
) as dag:

    task_setup_db = PythonOperator(
        task_id='setup_database',
        python_callable=setup_database,
    )

    task_load_data = PythonOperator(
        task_id='load_parquet_to_postgres',
        python_callable=load_parquet_to_postgres,
    )

    task_setup_db >> task_load_data
