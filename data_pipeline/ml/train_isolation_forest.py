import os
import pandas as pd
import sqlalchemy
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path
from dotenv import load_dotenv

# Load env
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASSWORD", "root")
DB_NAME = os.getenv("DB_NAME", "crypto_analysis")

DB_CONN_STR = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:3306/{DB_NAME}"

MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

def fetch_training_data():
    engine = sqlalchemy.create_engine(DB_CONN_STR)
    query = """
        SELECT symbol, timestamp, vwap_1h, total_volume, buy_volume, sell_volume
        FROM features_vwap
        ORDER BY symbol, timestamp ASC
    """
    df = pd.read_sql(query, engine)
    return df

def feature_engineering(df):
    if df.empty:
        return df
        
    # Derive features
    df['buyer_seller_imbalance'] = df['buy_volume'] / (df['sell_volume'] + 1e-9)
    
    # Calculate rolling metrics per symbol
    df['volume_sma_24h'] = df.groupby('symbol')['total_volume'].transform(lambda x: x.rolling(24, min_periods=1).mean())
    df['volume_spike_ratio'] = df['total_volume'] / (df['volume_sma_24h'] + 1e-9)
    
    df['vwap_roc'] = df.groupby('symbol')['vwap_1h'].pct_change().fillna(0)
    
    # Drop NaNs created by rolling
    df = df.dropna()
    return df

def train_model():
    print("Fetching data from DB...")
    df = fetch_training_data()
    
    if df.empty or len(df) < 50:
        print("Not enough data to train the model. Generating synthetic data for demonstration...")
        # Generate synthetic data for testing if DB is empty
        import numpy as np
        dates = pd.date_range(end=pd.Timestamp.now(), periods=1000, freq='H')
        df = pd.DataFrame({
            'symbol': 'btcusdt',
            'timestamp': dates,
            'vwap_1h': np.random.normal(60000, 1000, 1000),
            'total_volume': np.random.normal(1000, 200, 1000),
            'buy_volume': np.random.normal(500, 100, 1000),
            'sell_volume': np.random.normal(500, 100, 1000)
        })
        # Inject anomalies
        anomaly_idx = np.random.choice(1000, 20, replace=False)
        df.loc[anomaly_idx, 'total_volume'] *= 5
        df.loc[anomaly_idx, 'buy_volume'] *= 8
        
    df = feature_engineering(df)
    
    features = ['buyer_seller_imbalance', 'volume_spike_ratio', 'vwap_roc']
    X = df[features]
    
    print("Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    print("Training Isolation Forest...")
    # contamination=0.02 means we expect ~2% of the data to be anomalies (Whales)
    model = IsolationForest(n_estimators=100, contamination=0.02, random_state=42)
    model.fit(X_scaled)
    
    # Save the model and scaler
    model_path = MODELS_DIR / "whale_anomaly_v1.pkl"
    scaler_path = MODELS_DIR / "whale_scaler_v1.pkl"
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"Model saved to {model_path}")
    print(f"Scaler saved to {scaler_path}")

if __name__ == "__main__":
    train_model()
