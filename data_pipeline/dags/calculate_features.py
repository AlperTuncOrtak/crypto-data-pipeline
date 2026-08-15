from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from datetime import datetime, timedelta
import pandas as pd

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=1),
}

def setup_features_table():
    """Create features_1m table if it doesn't exist."""
    hook = PostgresHook(postgres_conn_id="airflow_db")
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS features_1m (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(50) NOT NULL,
        timestamp_minute TIMESTAMP NOT NULL,
        vwap NUMERIC NOT NULL,
        total_volume NUMERIC NOT NULL,
        trade_count INTEGER NOT NULL,
        large_trade_count INTEGER NOT NULL,
        sell_pressure NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(symbol, timestamp_minute)
    );
    
    CREATE INDEX IF NOT EXISTS idx_features_symbol_time 
    ON features_1m (symbol, timestamp_minute DESC);
    """
    hook.run(create_table_sql)

def calculate_minute_features():
    """
    Calculate 1-minute aggregations (VWAP, Volume, etc.) from raw_trades.
    This runs continuously in production, so we only process the last few minutes.
    For this MVP DAG, we'll calculate it for the last 5 minutes of data.
    """
    hook = PostgresHook(postgres_conn_id="airflow_db")
    engine = hook.get_sqlalchemy_engine()
    
    # Query raw trades from the last 5 minutes
    # In a perfect production environment, we would track a high-water mark to avoid re-processing.
    # Here we use UPSERT (ON CONFLICT) to safely re-calculate the last 5 minutes.
    query = """
    SELECT 
        symbol,
        price,
        quantity,
        timestamp,
        is_buyer_maker
    FROM raw_trades
    WHERE timestamp >= NOW() - INTERVAL '5 minutes'
    """
    
    try:
        df = pd.read_sql(query, engine)
        if df.empty:
            print("No new raw trades to process.")
            return

        # Convert timestamp to minute floor
        df['timestamp_minute'] = df['timestamp'].dt.floor('min')
        
        # Calculate large trades (e.g. top 5% or fixed threshold. For crypto, let's say quantity * price > 50000 USD is large)
        # Assuming price is in USDT and quantity is in base asset
        df['trade_value'] = df['price'] * df['quantity']
        df['is_large'] = df['trade_value'] > 50000
        
        # Group by symbol and minute
        grouped = df.groupby(['symbol', 'timestamp_minute'])
        
        features = pd.DataFrame()
        
        # VWAP = Sum(Price * Quantity) / Sum(Quantity)
        features['vwap'] = grouped.apply(lambda x: (x['price'] * x['quantity']).sum() / x['quantity'].sum())
        features['total_volume'] = grouped['quantity'].sum()
        features['trade_count'] = grouped.size()
        features['large_trade_count'] = grouped['is_large'].sum()
        
        # Sell pressure = volume of trades where buyer was maker (meaning seller crossed the spread) / total volume
        features['sell_pressure'] = grouped.apply(
            lambda x: x.loc[x['is_buyer_maker'] == True, 'quantity'].sum() / x['quantity'].sum()
        )
        
        features = features.reset_index()
        
        print(f"Calculated features for {len(features)} minute-symbol pairs.")
        
        # Upsert into PostgreSQL (using raw connection for ON CONFLICT logic)
        conn = engine.raw_connection()
        cur = conn.cursor()
        
        insert_query = """
            INSERT INTO features_1m (symbol, timestamp_minute, vwap, total_volume, trade_count, large_trade_count, sell_pressure)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (symbol, timestamp_minute) 
            DO UPDATE SET 
                vwap = EXCLUDED.vwap,
                total_volume = EXCLUDED.total_volume,
                trade_count = EXCLUDED.trade_count,
                large_trade_count = EXCLUDED.large_trade_count,
                sell_pressure = EXCLUDED.sell_pressure;
        """
        
        for _, row in features.iterrows():
            cur.execute(insert_query, (
                row['symbol'],
                row['timestamp_minute'],
                float(row['vwap']),
                float(row['total_volume']),
                int(row['trade_count']),
                int(row['large_trade_count']),
                float(row['sell_pressure'])
            ))
            
        conn.commit()
        cur.close()
        conn.close()
        print("Successfully saved features to Data Warehouse.")
        
    except Exception as e:
        print(f"Error calculating features: {e}")


with DAG(
    'calculate_minute_features',
    default_args=default_args,
    description='Calculate 1m VWAP and features from raw_trades',
    schedule_interval=timedelta(minutes=1),
    start_date=datetime(2023, 1, 1),
    catchup=False,
    tags=['ml', 'crypto', 'features'],
) as dag:

    task_setup = PythonOperator(
        task_id='setup_features_table',
        python_callable=setup_features_table,
    )

    task_calculate = PythonOperator(
        task_id='calculate_minute_features',
        python_callable=calculate_minute_features,
    )

    task_setup >> task_calculate
