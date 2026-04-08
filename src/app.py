import streamlit as st
from streamlit_autorefresh import st_autorefresh
import pandas as pd
import altair as alt
from analytics import (
    get_total_tracked_coins,
    get_latest_market_snapshot,
    get_top_gainers,
    get_top_losers,
    get_highest_volume_coins,
    get_recent_price_changes,
    get_multi_coin_history,
    get_multi_coin_performance,
    get_alerts
)
from db import get_connection

# -----------------------
# PAGE CONFIG
# -----------------------
st.set_page_config(page_title="Crypto Dashboard", layout="wide")

# Auto refresh
st_autorefresh(interval=60 * 1000, key="refresh")

# -----------------------
# HEADER
# -----------------------
st.title("📈 Crypto Analytics Dashboard")
st.caption("Built by Alper Ortak • Automated via launchd • CoinGecko API → MySQL → Real-time analytics dashboard")

# -----------------------
# HELPERS
# -----------------------

def get_last_update_time():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(updated_at) FROM latest_prices")
    result = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return result


def get_coin_list():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT symbol FROM coins ORDER BY symbol")
    coins = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return coins


# -----------------------
# METRICS
# -----------------------

col1, col2 = st.columns(2)
col1.metric("Tracked Coins", get_total_tracked_coins())
col2.metric("Last Update", str(get_last_update_time()))

st.divider()

# -----------------------
# ALERTS
# -----------------------

st.subheader("🚨 Alerts")

alerts = get_alerts()

if alerts:
    alerts_df = pd.DataFrame(alerts)
    st.dataframe(alerts_df, use_container_width=True)
else:
    st.success("No active alerts at the moment.")

st.divider()

# -----------------------
# SEARCH + FILTER
# -----------------------

st.subheader("🔎 Search & Filter")

search = st.text_input("Search coin (BTC, ETH...)")

snapshot = pd.DataFrame(get_latest_market_snapshot(100))

if not snapshot.empty:
    snapshot["symbol"] = snapshot["symbol"].astype(str)
    snapshot["name"] = snapshot["name"].astype(str)

    numeric_cols = [
        "current_price",
        "total_volume",
        "price_change_percentage_24h"
    ]

    for col in numeric_cols:
        if col in snapshot.columns:
            snapshot[col] = pd.to_numeric(snapshot[col], errors="coerce")

    if search:
        snapshot = snapshot[snapshot["symbol"].str.contains(search.upper(), na=False)]

    display_snapshot = snapshot.copy()

    if "current_price" in display_snapshot.columns:
        display_snapshot["current_price"] = display_snapshot["current_price"].map(
            lambda x: f"${x:,.6f}" if pd.notnull(x) else "N/A"
        )

    if "total_volume" in display_snapshot.columns:
        display_snapshot["total_volume"] = display_snapshot["total_volume"].map(
            lambda x: f"{int(x):,}" if pd.notnull(x) else "N/A"
        )

    if "price_change_percentage_24h" in display_snapshot.columns:
        display_snapshot["price_change_percentage_24h"] = display_snapshot["price_change_percentage_24h"].map(
            lambda x: f"{x:.4f}%" if pd.notnull(x) else "N/A"
        )

    st.dataframe(display_snapshot, use_container_width=True)
else:
    st.warning("No data found in snapshot")

st.divider()

# -----------------------
# TOP TABLES
# -----------------------

col1, col2 = st.columns(2)

with col1:
    st.subheader("Top Gainers")
    gainers_df = pd.DataFrame(get_top_gainers(5))
    if not gainers_df.empty:
        if "current_price" in gainers_df.columns:
            gainers_df["current_price"] = pd.to_numeric(gainers_df["current_price"], errors="coerce")
            gainers_df["current_price"] = gainers_df["current_price"].map(
                lambda x: f"${x:,.6f}" if pd.notnull(x) else "N/A"
            )
        if "price_change_percentage_24h" in gainers_df.columns:
            gainers_df["price_change_percentage_24h"] = pd.to_numeric(
                gainers_df["price_change_percentage_24h"], errors="coerce"
            )
            gainers_df["price_change_percentage_24h"] = gainers_df["price_change_percentage_24h"].map(
                lambda x: f"{x:.4f}%" if pd.notnull(x) else "N/A"
            )
    st.dataframe(gainers_df, use_container_width=True)

with col2:
    st.subheader("Top Losers")
    losers_df = pd.DataFrame(get_top_losers(5))
    if not losers_df.empty:
        if "current_price" in losers_df.columns:
            losers_df["current_price"] = pd.to_numeric(losers_df["current_price"], errors="coerce")
            losers_df["current_price"] = losers_df["current_price"].map(
                lambda x: f"${x:,.6f}" if pd.notnull(x) else "N/A"
            )
        if "price_change_percentage_24h" in losers_df.columns:
            losers_df["price_change_percentage_24h"] = pd.to_numeric(
                losers_df["price_change_percentage_24h"], errors="coerce"
            )
            losers_df["price_change_percentage_24h"] = losers_df["price_change_percentage_24h"].map(
                lambda x: f"{x:.4f}%" if pd.notnull(x) else "N/A"
            )
    st.dataframe(losers_df, use_container_width=True)

col1, col2 = st.columns(2)

with col1:
    st.subheader("Highest Volume")
    volume_df = pd.DataFrame(get_highest_volume_coins(5))
    if not volume_df.empty:
        if "current_price" in volume_df.columns:
            volume_df["current_price"] = pd.to_numeric(volume_df["current_price"], errors="coerce")
            volume_df["current_price"] = volume_df["current_price"].map(
                lambda x: f"${x:,.6f}" if pd.notnull(x) else "N/A"
            )
        if "total_volume" in volume_df.columns:
            volume_df["total_volume"] = pd.to_numeric(volume_df["total_volume"], errors="coerce")
            volume_df["total_volume"] = volume_df["total_volume"].map(
                lambda x: f"{int(x):,}" if pd.notnull(x) else "N/A"
            )
    st.dataframe(volume_df, use_container_width=True)

with col2:
    st.subheader("Top Movers")
    movers_df = pd.DataFrame(get_recent_price_changes(10))
    if not movers_df.empty:
        if "latest_price" in movers_df.columns:
            movers_df["latest_price"] = pd.to_numeric(movers_df["latest_price"], errors="coerce")
            movers_df["latest_price"] = movers_df["latest_price"].map(
                lambda x: f"${x:,.6f}" if pd.notnull(x) else "N/A"
            )
        if "previous_price" in movers_df.columns:
            movers_df["previous_price"] = pd.to_numeric(movers_df["previous_price"], errors="coerce")
            movers_df["previous_price"] = movers_df["previous_price"].map(
                lambda x: f"${x:,.6f}" if pd.notnull(x) else "N/A"
            )
        if "price_change_pct" in movers_df.columns:
            movers_df["price_change_pct"] = pd.to_numeric(movers_df["price_change_pct"], errors="coerce")
            movers_df["price_change_pct"] = movers_df["price_change_pct"].map(
                lambda x: f"{x:.4f}%" if pd.notnull(x) else "N/A"
            )
    st.dataframe(movers_df, use_container_width=True)

st.divider()

# -----------------------
# MULTI COIN COMPARISON
# -----------------------

st.subheader("📊 Multi-Coin Comparison")
st.caption("Compare up to 4 coins at the same time. Prices are normalized to Base = 100.")

coins = get_coin_list()

selected = st.multiselect(
    "Select coins to compare",
    coins,
    default=coins[:3]
)

if len(selected) > 4:
    st.warning("Please select up to 4 coins for a cleaner comparison chart.")
elif selected:
    data = get_multi_coin_history(selected)
    df = pd.DataFrame(data)

    performance = get_multi_coin_performance(selected)
    performance_df = pd.DataFrame(performance)

    if not performance_df.empty:
        best_coin = performance_df.iloc[0]
        worst_coin = performance_df.iloc[-1]

        col1, col2 = st.columns(2)
        col1.metric(
            "Best Performer",
            best_coin["symbol"],
            f"{best_coin['total_return_pct']:.2f}%"
        )
        col2.metric(
            "Worst Performer",
            worst_coin["symbol"],
            f"{worst_coin['total_return_pct']:.2f}%"
        )

        display_perf = performance_df.copy()
        display_perf["start_price"] = display_perf["start_price"].map(lambda x: f"${x:,.6f}")
        display_perf["latest_price"] = display_perf["latest_price"].map(lambda x: f"${x:,.6f}")
        display_perf["total_return_pct"] = display_perf["total_return_pct"].map(lambda x: f"{x:.2f}%")

        st.subheader("Comparison Summary")
        st.dataframe(display_perf, use_container_width=True)

    if not df.empty:
        df["current_price"] = pd.to_numeric(df["current_price"], errors="coerce")
        df["collected_at"] = pd.to_datetime(df["collected_at"])
        df = df.dropna(subset=["current_price", "collected_at"])

        df["normalized"] = df.groupby("symbol")["current_price"].transform(
            lambda x: x / x.iloc[0] * 100 if len(x) > 0 else x
        )

        base = alt.Chart(df).encode(
            x=alt.X(
                "collected_at:T",
                title="Time",
                axis=alt.Axis(labelAngle=0, tickCount=8)
            ),
            y=alt.Y(
                "normalized:Q",
                title="Normalized Price (Base=100)"
            ),
            color=alt.Color("symbol:N", title="Symbol"),
            tooltip=[
                alt.Tooltip("symbol:N", title="Coin"),
                alt.Tooltip("collected_at:T", title="Time"),
                alt.Tooltip("normalized:Q", title="Normalized", format=".2f")
            ]
        )

        line = base.mark_line(strokeWidth=3)
        points = base.mark_circle(size=55, opacity=0.45)

        chart = (line + points).properties(
            height=500
        ).interactive()

        st.altair_chart(chart, use_container_width=True)
    else:
        st.warning("No historical data found for selected coins.")

st.divider()

# -----------------------
# MARKET SNAPSHOT
# -----------------------

st.subheader("Latest Market Snapshot")

latest_snapshot_df = pd.DataFrame(get_latest_market_snapshot(20))

if not latest_snapshot_df.empty:
    latest_snapshot_df["symbol"] = latest_snapshot_df["symbol"].astype(str)
    latest_snapshot_df["name"] = latest_snapshot_df["name"].astype(str)

    if "current_price" in latest_snapshot_df.columns:
        latest_snapshot_df["current_price"] = pd.to_numeric(latest_snapshot_df["current_price"], errors="coerce")
        latest_snapshot_df["current_price"] = latest_snapshot_df["current_price"].map(
            lambda x: f"${x:,.6f}" if pd.notnull(x) else "N/A"
        )

    if "total_volume" in latest_snapshot_df.columns:
        latest_snapshot_df["total_volume"] = pd.to_numeric(latest_snapshot_df["total_volume"], errors="coerce")
        latest_snapshot_df["total_volume"] = latest_snapshot_df["total_volume"].map(
            lambda x: f"{int(x):,}" if pd.notnull(x) else "N/A"
        )

    if "price_change_percentage_24h" in latest_snapshot_df.columns:
        latest_snapshot_df["price_change_percentage_24h"] = pd.to_numeric(
            latest_snapshot_df["price_change_percentage_24h"], errors="coerce"
        )
        latest_snapshot_df["price_change_percentage_24h"] = latest_snapshot_df["price_change_percentage_24h"].map(
            lambda x: f"{x:.4f}%" if pd.notnull(x) else "N/A"
        )

    st.dataframe(latest_snapshot_df, use_container_width=True)
else:
    st.warning("No latest snapshot data found.")