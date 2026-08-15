import os
import pandas as pd
from sqlalchemy import create_engine
import numpy as np

class CryptoFeatureExtractor:
    def __init__(self, db_conn_string=None):
        """
        Initialize the feature extractor.
        If db_conn_string is not provided, it defaults to the local Airflow Postgres DB.
        """
        self.db_conn_string = db_conn_string or "postgresql+psycopg2://airflow:airflow@localhost:5432/airflow"
        self.engine = create_engine(self.db_conn_string)
        
    def fetch_features(self, symbol, hours_back=24):
        """Fetch base features for a specific symbol from the database."""
        query = f"""
        SELECT 
            timestamp_minute,
            vwap,
            total_volume,
            trade_count,
            large_trade_count,
            sell_pressure
        FROM features_1m
        WHERE symbol = '{symbol}'
          AND timestamp_minute >= NOW() - INTERVAL '{hours_back} hours'
        ORDER BY timestamp_minute ASC
        """
        df = pd.read_sql(query, self.engine)
        if not df.empty:
            df.set_index('timestamp_minute', inplace=True)
            # Ensure consecutive minutes are present (forward fill gaps if any, though VWAP shouldn't be blindly ffilled, 
            # for strict ML, we might leave it as NaN or fill with 0 volume)
            df = df.resample('1min').ffill()
        return df

    def enrich_with_rolling_features(self, df):
        """
        Calculate complex rolling features like Volume Spikes and Price Momentum.
        This is done in memory (Pandas) rather than SQL for maximum flexibility.
        """
        if df.empty:
            return df
            
        df = df.copy()
        
        # 1. Volume Spikes (compare current 1m volume to moving average of last 60 minutes)
        # Add 1e-8 to avoid division by zero
        df['vol_ma_60'] = df['total_volume'].rolling(window=60, min_periods=1).mean()
        df['volume_spike_ratio'] = df['total_volume'] / (df['vol_ma_60'] + 1e-8)
        
        # 2. VWAP Momentum (ROC - Rate of Change over 5 and 15 mins)
        df['vwap_roc_5m'] = df['vwap'].pct_change(periods=5)
        df['vwap_roc_15m'] = df['vwap'].pct_change(periods=15)
        
        # 3. Large Trade Intensity
        df['large_trade_ratio'] = df['large_trade_count'] / (df['trade_count'] + 1e-8)
        
        # 4. Sell Pressure Momentum
        df['sell_pressure_ma_15'] = df['sell_pressure'].rolling(window=15, min_periods=1).mean()
        df['sell_pressure_deviation'] = df['sell_pressure'] - df['sell_pressure_ma_15']
        
        # Drop NaN rows created by rolling windows (if strict)
        # df = df.dropna()
        
        return df

    def get_training_dataset(self, symbol, hours_back=24 * 7):
        """Fetch and fully prepare the dataset for Anomaly Detection (Isolation Forest)."""
        print(f"Fetching {hours_back} hours of data for {symbol}...")
        base_df = self.fetch_features(symbol, hours_back)
        
        if base_df.empty:
            print(f"No data found for {symbol}.")
            return base_df
            
        print("Calculating rolling features...")
        enriched_df = self.enrich_with_rolling_features(base_df)
        
        # Drop columns that are 'leaky' or just raw absolute values not suitable for pure anomaly detection,
        # keeping mostly ratios and momentums.
        features_to_keep = [
            'volume_spike_ratio',
            'vwap_roc_5m',
            'vwap_roc_15m',
            'large_trade_ratio',
            'sell_pressure',
            'sell_pressure_deviation'
        ]
        
        final_dataset = enriched_df[features_to_keep].dropna()
        print(f"Dataset ready: {len(final_dataset)} rows, {len(final_dataset.columns)} features.")
        return final_dataset

if __name__ == "__main__":
    # Quick test when running the script directly
    extractor = CryptoFeatureExtractor()
    dataset = extractor.get_training_dataset(symbol="btcusdt", hours_back=24)
    if not dataset.empty:
        print(dataset.head())
