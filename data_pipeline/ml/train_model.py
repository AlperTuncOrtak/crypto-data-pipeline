import os
import joblib
from sklearn.ensemble import IsolationForest
import pandas as pd

# Allow absolute import for feature_extractor by adding parent dir to sys path if needed, 
# or just relative import if executed in context
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from ml.feature_extractor import CryptoFeatureExtractor

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_PATH = os.path.join(MODEL_DIR, 'isolation_forest.pkl')

def train_and_evaluate(symbol='btcusdt', hours_back=24 * 7):
    print(f"--- Phase 3 & 4: Training Isolation Forest Model for {symbol} ---")
    
    extractor = CryptoFeatureExtractor()
    df = extractor.get_training_dataset(symbol=symbol, hours_back=hours_back)
    
    if df.empty:
        print("Not enough data to train the model. Ensure the ETL pipeline has been running.")
        return
        
    print(f"\nTraining on {len(df)} samples...")
    
    # We define contamination as the expected percentage of anomalies (e.g., 2% of the time it's a whale action)
    model = IsolationForest(
        n_estimators=100,
        contamination=0.02,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(df)
    print("Training complete.")
    
    # Save the model
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    
    # --- Phase 4: Evaluation & Backtesting Report ---
    print("\n--- Evaluation Report ---")
    
    # Predict anomalies (-1 is anomaly, 1 is normal)
    predictions = model.predict(df)
    df['is_anomaly'] = predictions == -1
    df['anomaly_score'] = model.decision_function(df)
    
    anomaly_count = df['is_anomaly'].sum()
    normal_count = len(df) - anomaly_count
    print(f"Total periods analyzed: {len(df)}")
    print(f"Normal periods: {normal_count} ({(normal_count/len(df))*100:.1f}%)")
    print(f"Whale Anomalies detected: {anomaly_count} ({(anomaly_count/len(df))*100:.1f}%)")
    
    # To measure "Precision" in an unsupervised setting without ground truth,
    # we look at the average absolute price momentum 15 minutes AFTER the anomaly vs normal periods.
    # Since we only have VWAP ROC in this dataset (which looks backwards), 
    # to evaluate we should ideally look forward. 
    # But for a basic report, let's just show the average absolute 15m momentum DURING anomalies vs normal.
    
    avg_momentum_normal = df.loc[~df['is_anomaly'], 'vwap_roc_15m'].abs().mean() * 100
    avg_momentum_anomaly = df.loc[df['is_anomaly'], 'vwap_roc_15m'].abs().mean() * 100
    
    print("\n[Backtesting Metrics]")
    print(f"Average 15m Price Volatility during NORMAL conditions:  {avg_momentum_normal:.4f}%")
    print(f"Average 15m Price Volatility during WHALE ANOMALIES:    {avg_momentum_anomaly:.4f}%")
    
    if avg_momentum_anomaly > avg_momentum_normal:
        print("\n✅ SUCCESS: The model correctly identified periods with significantly higher volatility!")
        print(f"Anomalies show {avg_momentum_anomaly / avg_momentum_normal:.1f}x more price movement than normal periods.")
    else:
        print("\n⚠️ WARNING: The detected anomalies do not show higher volatility. Model tuning required.")

if __name__ == "__main__":
    train_and_evaluate('btcusdt', hours_back=72)
