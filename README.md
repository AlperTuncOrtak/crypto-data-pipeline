📈 Crypto Analytics Dashboard

A real-time cryptocurrency data pipeline and analytics dashboard built with Python, MySQL, and Streamlit.

This project collects live market data, stores it efficiently, analyzes price movements, and presents insights through an interactive dashboard with alert detection.

⸻⸻⸻⸻⸻⸻

🚀 Features

🔄 Data Pipeline
	•	Fetches real-time crypto data from CoinGecko API
	•	Stores structured data in MySQL
	•	Maintains:
	•	coins
	•	latest_prices
	•	price_history
	•	price_history_archive
	•	Optimized insert logic to prevent duplicates

⸻⸻⸻⸻⸻⸻

⚙️ Automation & Reliability
	•	Fully automated using macOS launchd
	•	Continuous background data collection
	•	Logging system for monitoring pipeline activity
	•	Error tracking via log files

⸻⸻⸻⸻⸻⸻

📊 Analytics Engine
	•	Top gainers / losers
	•	Highest volume coins
	•	Short-term price movements
	•	Historical price tracking
	•	Multi-coin performance comparison

⸻⸻⸻⸻⸻⸻

📊 Dashboard (Streamlit UI)
	•	Real-time updating interface
	•	Search & filter functionality
	•	Clean formatted tables
	•	Interactive charts
	•	Multi-coin comparison with normalization

⸻⸻⸻⸻⸻⸻

🧠 Advanced Comparison
	•	Compare multiple coins in one chart
	•	Normalized performance (Base = 100)
	•	Best / worst performer detection
	•	Ranked performance summary

⸻⸻⸻⸻⸻⸻

🚨 Alert System

Detects significant market events:
	•	🚀 Strong Increase → 24h price ≥ +5%
	•	🔻 Sharp Drop → 24h price ≤ -5%
	•	⚡ Rapid Movement → short-term price change ≥ 2%

Transforms the dashboard from data display → decision support tool.

⸻⸻⸻⸻⸻⸻

🧱 Architecture

CoinGecko API
      ↓
Data Pipeline (Python)
      ↓
MySQL Database
      ↓
Analytics Layer
      ↓
Streamlit Dashboard

⸻⸻⸻⸻⸻⸻

🛠 Tech Stack
	•	Python
	•	MySQL
	•	Streamlit
	•	Pandas
	•	Altair
	•	CoinGecko API
	•	macOS launchd

⸻⸻⸻⸻⸻⸻

📂 Project Structure

├── src/
│   ├── main.py          # Data pipeline
│   ├── db.py            # Database connection
│   ├── analytics.py     # Analytics & alerts
│   ├── app.py           # Streamlit dashboard
│
├── assets/              # Screenshots for README
├── sql/                 # Database schema / queries
│
├── requirements.txt
├── README.md
└── .gitignore

⸻⸻⸻⸻⸻⸻⸻

▶️ How to Run

1. Clone the repository
git clone https://github.com/AlperTuncOrtak/crypto-data-pipeline.git
cd crypto-data-pipeline

2. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

3. Install dependencies
pip install -r requirements.txt

4. Run the dashboard
streamlit run src/app.py

⸻⸻⸻⸻⸻⸻⸻

📸 Screenshots

### Alerts System
![Alerts](assets/1.png)

### Search & Filter
![Search and Filter](assets/2.png)

### Multi-Coin Comparison
![Multi-Coin Comparison](assets/3.png)

### Dashboard Overview
![Main Dashboard](assets/4.png)

⸻⸻⸻⸻⸻⸻⸻

🧠 What This Project Demonstrates
	•	Building a full data pipeline from API → database → UI
	•	Designing efficient database schemas for time-series data
	•	Implementing real-time analytics
	•	Creating user-friendly dashboards
	•	Developing alert systems based on data patterns
	•	Automation and reliability engineering

⸻⸻⸻⸻⸻⸻⸻

🔮 Future Improvements
	•	Discord alert integration
	•	Advanced anomaly detection
	•	User-defined alert thresholds
	•	Export (CSV / reports)
	•	Deployment (cloud hosting)

⸻⸻⸻⸻⸻⸻⸻

👤 Author

Alper Tunc Ortak

⸻⸻⸻⸻⸻⸻⸻

⭐ Notes

This project was built as part of a portfolio to demonstrate real-world data engineering, analytics, and dashboard development skills.

