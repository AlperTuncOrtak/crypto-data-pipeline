import os
import time
import pandas as pd
import sqlalchemy
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
MODEL_PATH = MODELS_DIR / "whale_anomaly_v1.pkl"
SCALER_PATH = MODELS_DIR / "whale_scaler_v1.pkl"

def run_inference():
    if not MODEL_PATH.exists() or not SCALER_PATH.exists():
        print("Model or scaler not found. Please run train_isolation_forest.py first.")
        return

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

    engine = sqlalchemy.create_engine(DB_CONN_STR)
    
    # We need the last 24h to calculate rolling means, so we fetch recent data
    # Then we only predict for rows where anomaly_score = 0.0 (default)
    query = """
        SELECT id, symbol, timestamp, vwap_1h, total_volume, buy_volume, sell_volume, anomaly_score
        FROM features_vwap
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
        ORDER BY symbol, timestamp ASC
    """
    
    df = pd.read_sql(query, engine)
    if df.empty:
        return
        
    # Derive features
    df['buyer_seller_imbalance'] = df['buy_volume'] / (df['sell_volume'] + 1e-9)
    df['volume_sma_24h'] = df.groupby('symbol')['total_volume'].transform(lambda x: x.rolling(24, min_periods=1).mean())
    df['volume_spike_ratio'] = df['total_volume'] / (df['volume_sma_24h'] + 1e-9)
    df['vwap_roc'] = df.groupby('symbol')['vwap_1h'].pct_change().fillna(0)
    
    # Filter rows that need scoring
    unscored = df[df['anomaly_score'] == 0.0].copy()
    if unscored.empty:
        return
        
    features = ['buyer_seller_imbalance', 'volume_spike_ratio', 'vwap_roc']
    X = unscored[features]
    
    # Handle NaNs from rolling (if any)
    X = X.fillna(0)
    
    X_scaled = scaler.transform(X)
    
    # Predict (1 = normal, -1 = anomaly)
    preds = model.predict(X_scaled)
    
    # Convert -1/1 to anomaly score 
    # Decision function returns raw scores, negative values are anomalies
    scores = model.decision_function(X_scaled)
    
    # We will just map it so that positive score = anomaly for easier DB reading
    # Usually isolation forest: < 0 is anomaly. So we store -scores.
    unscored['anomaly_score'] = -scores
    
    # Update DB
    with engine.begin() as conn:
        for _, row in unscored.iterrows():
            if row['anomaly_score'] > 0:
                print(f"🐋 Whale Detected on {row['symbol']}! Score: {row['anomaly_score']:.2f}, Volume Spike: {row['volume_spike_ratio']:.2f}")
                
            update_sql = sqlalchemy.text("UPDATE features_vwap SET anomaly_score = :score WHERE id = :id")
            conn.execute(update_sql, {"score": row['anomaly_score'], "id": row['id']})

if __name__ == "__main__":
    print("Starting ML Inference Worker...")
    while True:
        try:
            run_inference()
        except Exception as e:
            print(f"Error during inference: {e}")
        # Run every 5 minutes
        time.sleep(300)
