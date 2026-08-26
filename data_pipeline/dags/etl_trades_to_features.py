from datetime import datetime, timedelta
import os
import glob
import pandas as pd
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
import sqlalchemy

DATA_LAKE_DIR = "/opt/airflow/data_lake/raw_trades"

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2026, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def process_trades_to_vwap():
    """Reads latest parquet files, calculates VWAP, and writes to MySQL."""
    files = glob.glob(os.path.join(DATA_LAKE_DIR, "*.parquet"))
    if not files:
        print("No raw trade files found in data lake.")
        return
        
    dfs = []
    for f in files:
        try:
            df = pd.read_parquet(f)
            dfs.append(df)
        except Exception as e:
            print(f"Failed to read {f}: {e}")
            
    if not dfs:
        return
        
    combined = pd.concat(dfs, ignore_index=True)
    
    # Calculate VWAP
    # VWAP = sum(Price * Volume) / sum(Volume)
    combined['pv'] = combined['price'] * combined['quantity']
    
    # Group by symbol and hour
    # We round timestamp to nearest hour for the aggregation
    combined['hour'] = combined['timestamp'].dt.floor('H')
    
    grouped = combined.groupby(['symbol', 'hour']).agg(
        total_pv=('pv', 'sum'),
        total_volume=('quantity', 'sum'),
        buy_volume=('quantity', lambda x: x[combined.loc[x.index, 'is_buyer_maker'] == False].sum()),
        sell_volume=('quantity', lambda x: x[combined.loc[x.index, 'is_buyer_maker'] == True].sum())
    ).reset_index()
    
    grouped['vwap_1h'] = grouped['total_pv'] / grouped['total_volume']
    
    # Anomaly score mockup (to be filled by ML in Phase 3)
    grouped['anomaly_score'] = 0.0 
    
    # Rename columns to match db
    features = grouped[['symbol', 'hour', 'vwap_1h', 'total_volume', 'buy_volume', 'sell_volume', 'anomaly_score']]
    features = features.rename(columns={'hour': 'timestamp'})
    
    print(f"Calculated features for {len(features)} groups.")
    
    # Write to database
    hook = PostgresHook(postgres_conn_id="airflow_db")
    engine = hook.get_sqlalchemy_engine()
    with engine.begin() as conn:
        features.to_sql('features_vwap', con=conn, if_exists='append', index=False)
        
    # Optional: Archive processed files
    # for f in files:
    #     os.remove(f)
    print("ETL Job completed successfully.")

with DAG(
    'etl_trades_to_features',
    default_args=default_args,
    description='Calculate VWAP features from raw trades',
    schedule_interval=timedelta(hours=1),
    catchup=False,
    tags=['etl', 'crypto'],
) as dag:
    
    calculate_vwap = PythonOperator(
        task_id='calculate_vwap',
        python_callable=process_trades_to_vwap,
    )
