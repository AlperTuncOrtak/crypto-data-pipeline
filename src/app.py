import streamlit as st
from streamlit_autorefresh import st_autorefresh
import pandas as pd
import altair as alt
from datetime import datetime, timedelta, timezone

from analytics import (
    get_total_tracked_coins,
    get_latest_market_snapshot,
    get_top_gainers,
    get_top_losers,
    get_highest_volume_coins,
    get_recent_price_changes,
    get_multi_coin_history,
    get_multi_coin_performance,
    get_alerts,
)
from db import get_connection


def inject_global_css():
    st.markdown(
        """
        <style>
        /* ---- Genel sayfa padding ---- */
        .block-container {
            padding-top: 1.5rem;
            padding-bottom: 1rem;
            padding-left: 2rem;
            padding-right: 2rem;
        }

        /* ---- Metric kartları ---- */
        div[data-testid="stMetric"] {
            position: relative;
            background: linear-gradient(
                180deg,
                rgba(15, 23, 42, 0.96) 0%,
                rgba(17, 24, 39, 0.92) 100%
            );
            padding: 18px 18px 16px 18px;
            border-radius: 16px;
            border: 1px solid rgba(124, 58, 237, 0.14);
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
            overflow: hidden;
            transition: all 0.2s ease;
        }

        /* ---- Glow layer ---- */
        div[data-testid="stMetric"]::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 16px;
            background: linear-gradient(
                120deg,
                rgba(99, 102, 241, 0.15),
                rgba(56, 189, 248, 0.12),
                transparent
            );
            opacity: 0;
            transition: opacity 0.25s ease;
        }

        /* ---- Hover efekti ---- */
        div[data-testid="stMetric"]:hover {
            transform: translateY(-3px) scale(1.01);
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.32);
            border-color: rgba(56, 189, 248, 0.28);
        }

        /* ---- Hover glow aktif ---- */
        div[data-testid="stMetric"]:hover::before {
            opacity: 1;
        }

        /* ---- Metric label ---- */
        div[data-testid="stMetricLabel"] {
            color: #94A3B8 !important;
            font-size: 0.92rem !important;
            font-weight: 500 !important;
        }

        /* ---- Metric value ---- */
        div[data-testid="stMetricValue"] {
            color: #E5E7EB !important;
            font-weight: 750 !important;
            letter-spacing: -0.02em !important;
            font-size: 1.65rem !important;
            line-height: 1.1;
        }

        /* ---- Başlık spacing ---- */
        h1, h2, h3 {
            margin-bottom: 0.45rem;
        }

        /* ---- Divider ---- */
        hr {
            border: none;
            border-top: 1px solid rgba(255,255,255,0.08);
        }

        /* ---- Dataframe çevresi ---- */
        div[data-testid="stDataFrame"] {
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid rgba(124, 58, 237, 0.10);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
            background: rgba(15, 23, 42, 0.72);
        }

        /* ---- Selectbox / input üst boşluk ---- */
        div[data-baseweb="select"],
        div[data-testid="stTextInput"] {
            margin-bottom: 0.2rem;
        }

        /* ---- Container (table panels) ---- */
        div[data-testid="stVerticalBlockBorderWrapper"] {
            background: rgba(15, 23, 42, 0.52);
            border-radius: 16px;
            border: 1px solid rgba(124, 58, 237, 0.10);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);
            padding: 0.35rem 0.35rem 0.2rem 0.35rem;
        }

        /* ---- TABLE HEADER STYLE ---- */
        thead tr th {
            background: linear-gradient(
                90deg,
                rgba(124, 58, 237, 0.45),
                rgba(99, 102, 241, 0.35),
                rgba(56, 189, 248, 0.25)
            ) !important;
            color: #E5E7EB !important;
            font-weight: 600 !important;
            border-bottom: 1px solid rgba(255,255,255,0.08) !important;
            backdrop-filter: blur(6px);
        }

        /* ---- Rounded header corners ---- */
        thead tr th:first-child {
            border-top-left-radius: 12px;
        }

        thead tr th:last-child {
            border-top-right-radius: 12px;
        }

        /* ---- TABLE CELL ---- */
        tbody tr td {
            color: #CBD5F5 !important;
            font-size: 0.92rem;
        }

        /* ---- ROW HOVER ---- */
        tbody tr:hover {
            background-color: rgba(56, 189, 248, 0.08) !important;
        }

        /* ---- ZEBRA STRIPING ---- */
        tbody tr:nth-child(even) {
            background-color: rgba(255,255,255,0.02);
        }

        /* ---- FILTER PANEL ---- */
        div[data-testid="stVerticalBlockBorderWrapper"]:has(input),
        div[data-testid="stVerticalBlockBorderWrapper"]:has(select),
        div[data-testid="stVerticalBlockBorderWrapper"]:has(div[data-baseweb="select"]) {
            background: linear-gradient(
                180deg,
                rgba(30, 27, 75, 0.55),
                rgba(15, 23, 42, 0.55)
            );
            border: 1px solid rgba(124, 58, 237, 0.18);
            box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }

        /* ---- INPUT STYLE ---- */
        input {
            background-color: rgba(15, 23, 42, 0.6) !important;
            border: 1px solid rgba(124, 58, 237, 0.25) !important;
            border-radius: 10px !important;
            color: white !important;
        }

        /* ---- INPUT PLACEHOLDER ---- */
        input::placeholder {
            color: #94A3B8 !important;
            opacity: 1 !important;
        }

        /* ---- SELECTBOX WRAPPER ---- */
        div[data-baseweb="select"] {
            background-color: rgba(15, 23, 42, 0.6) !important;
            border-radius: 10px !important;
        }

        /* ---- SELECTBOX CONTROL ---- */
        div[data-baseweb="select"] > div {
            background-color: rgba(15, 23, 42, 0.6) !important;
            border: 1px solid rgba(124, 58, 237, 0.25) !important;
            border-radius: 10px !important;
            color: #E5E7EB !important;
            box-shadow: none !important;
        }

        /* ---- SELECTED TEXT ---- */
        div[data-baseweb="select"] span {
            color: #E5E7EB !important;
        }

        /* ---- LABELS ---- */
        label, .stTextInput label, .stSelectbox label {
            color: #CBD5F5 !important;
            font-weight: 500 !important;
        }

        /* ---- SIDEBAR TEXT ---- */
        section[data-testid="stSidebar"] h1,
        section[data-testid="stSidebar"] h2,
        section[data-testid="stSidebar"] h3,
        section[data-testid="stSidebar"] p,
        section[data-testid="stSidebar"] label,
        section[data-testid="stSidebar"] div {
            color: #E5E7EB !important;
        }

        /* ---- SIDEBAR BUTTONS ---- */
        section[data-testid="stSidebar"] .stButton > button {
            width: 100%;
            text-align: left;
            justify-content: flex-start;
            border-radius: 12px;
            padding: 0.72rem 0.9rem;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(124, 58, 237, 0.10);
            color: #CBD5F5;
            font-weight: 600;
            box-shadow: none;
            transition: all 0.18s ease;
        }

        section[data-testid="stSidebar"] .stButton > button:hover {
            background: rgba(124, 58, 237, 0.12);
            border-color: rgba(124, 58, 237, 0.28);
            color: #FFFFFF;
            transform: translateX(2px);
        }

        /* ---- PRIMARY BUTTON IN SIDEBAR ---- */
        section[data-testid="stSidebar"] .stButton > button[kind="primary"] {
            background: linear-gradient(
                90deg,
                rgba(124, 58, 237, 0.75),
                rgba(99, 102, 241, 0.75)
            );
            border: 1px solid rgba(124, 58, 237, 0.35);
            color: white;
            box-shadow: 0 10px 24px rgba(0,0,0,0.22);
        }

        /* ---- SIDEBAR DIVIDER ---- */
        section[data-testid="stSidebar"] hr {
            border: none;
            border-top: 1px solid rgba(255,255,255,0.08);
            margin-top: 1rem;
            margin-bottom: 1rem;
        }

        a:hover {
            color: #7c3aed !important;
        }

        </style>
        """,
        unsafe_allow_html=True
    )


# -----------------------
# PAGE CONFIG
# -----------------------
st.set_page_config(page_title="Crypto Dashboard", layout="wide")
inject_global_css()

# Auto refresh
st_autorefresh(interval=120 * 1000, key="refresh")

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


def get_system_status():
    last_update = get_last_update_time()

    if last_update is None:
        return "Offline", "🔴"

    if last_update.tzinfo is None:
        last_update = last_update.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    diff = (now - last_update).total_seconds() / 60

    PIPELINE_INTERVAL = 15

    if diff < PIPELINE_INTERVAL:
        return "Live", "🟢"
    elif diff < PIPELINE_INTERVAL * 2:
        return "Delayed", "🟡"
    else:
        return "Offline", "🔴"
    
def get_market_signal():
    snapshot = pd.DataFrame(get_latest_market_snapshot(100))

    if snapshot.empty or "price_change_percentage_24h" not in snapshot.columns:
        return {
            "label": "Unknown",
            "confidence": 0,
            "message": "Not enough data to evaluate market conditions.",
            "color": "#94A3B8"
        }

    snapshot["price_change_percentage_24h"] = pd.to_numeric(
        snapshot["price_change_percentage_24h"],
        errors="coerce"
    )

    valid_changes = snapshot["price_change_percentage_24h"].dropna()

    if valid_changes.empty:
        return {
            "label": "Unknown",
            "confidence": 0,
            "message": "No valid change data available.",
            "color": "#94A3B8"
        }

    gainers_count = (valid_changes > 0).sum()
    losers_count = (valid_changes < 0).sum()
    total = gainers_count + losers_count
    avg_change = valid_changes.mean()

    if total == 0:
        return {
            "label": "Neutral",
            "confidence": 50,
            "message": "Market activity is mixed with limited directional signal.",
            "color": "#CBD5F5"
        }

    bullish_score = (gainers_count / total) * 100

    if avg_change > 0 and gainers_count > losers_count:
        label = "Bullish"
        confidence = round(min(95, bullish_score))
        message = "More gainers than losers with positive average 24h momentum."
        color = "#22c55e"
    elif avg_change < 0 and losers_count > gainers_count:
        label = "Bearish"
        confidence = round(min(95, 100 - bullish_score))
        message = "More losers than gainers with negative average 24h momentum."
        color = "#ef4444"
    else:
        label = "Mixed"
        confidence = 55
        message = "Market conditions are balanced without strong directional dominance."
        color = "#f59e0b"

    return {
        "label": label,
        "confidence": confidence,
        "message": message,
        "color": color
    }


def get_coin_list():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT symbol FROM coins ORDER BY symbol")
    coins = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return coins


def render_page_header(title: str, description: str):
    st.subheader(title)
    st.caption(description)
    st.divider()


def sync_watchlist():
    st.session_state["watchlist_saved"] = st.session_state["watchlist_widget"].copy()


def style_change_columns(df: pd.DataFrame):
    def color_change(val):
        if pd.isna(val):
            return ""

        text = str(val).strip()

        if text.startswith("-"):
            return "color: #ef4444; font-weight: 600;"
        elif text.startswith("+"):
            return "color: #22c55e; font-weight: 600;"
        return "color: #E5E7EB;"

    styled = df.style

    change_cols = [col for col in ["24h Change", "Change %"] if col in df.columns]

    if change_cols:
        styled = styled.map(color_change, subset=change_cols)

    return styled


def render_small_table(title: str, subtitle: str, df: pd.DataFrame):
    with st.container(border=True):
        st.markdown(f"### {title}")
        st.caption(subtitle)
        styled_df = style_change_columns(df)
        st.table(styled_df.hide(axis="index"))


def render_large_table(title: str, subtitle: str, df: pd.DataFrame, height: int = 420):
    with st.container(border=True):
        st.markdown(f"### {title}")
        st.caption(subtitle)

        styled_df = style_change_columns(df)

        st.dataframe(
            styled_df,
            use_container_width=True,
            height=height,
            hide_index=True
        )


# -----------------------
# FORMATTERS
# -----------------------
def format_snapshot_df(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    df = df.copy()

    if "symbol" in df.columns:
        df["symbol"] = df["symbol"].astype(str)

    if "name" in df.columns:
        df["name"] = df["name"].astype(str)

    if "current_price" in df.columns:
        df["current_price"] = pd.to_numeric(df["current_price"], errors="coerce")
        df["current_price"] = df["current_price"].map(
            lambda x: f"${x:,.4f}" if pd.notnull(x) else "N/A"
        )

    if "market_cap" in df.columns:
        df["market_cap"] = pd.to_numeric(df["market_cap"], errors="coerce")
        df["market_cap"] = df["market_cap"].map(
            lambda x: f"{int(x):,}" if pd.notnull(x) else "N/A"
        )

    if "total_volume" in df.columns:
        df["total_volume"] = pd.to_numeric(df["total_volume"], errors="coerce")
        df["total_volume"] = df["total_volume"].map(
            lambda x: f"{int(x):,}" if pd.notnull(x) else "N/A"
        )

    if "price_change_percentage_24h" in df.columns:
        df["price_change_percentage_24h"] = pd.to_numeric(
            df["price_change_percentage_24h"], errors="coerce"
        )
        df["price_change_percentage_24h"] = df["price_change_percentage_24h"].map(
            lambda x: f"{x:+.2f}%" if pd.notnull(x) else "N/A"
        )

    rename_map = {
        "symbol": "Symbol",
        "name": "Name",
        "current_price": "Price",
        "market_cap": "Market Cap",
        "total_volume": "Volume",
        "price_change_percentage_24h": "24h Change",
        "updated_at": "Updated At",
    }

    df = df.rename(columns=rename_map)

    preferred_order = [
        "Symbol",
        "Name",
        "Price",
        "Market Cap",
        "Volume",
        "24h Change",
        "Updated At",
    ]
    existing_cols = [col for col in preferred_order if col in df.columns]
    remaining_cols = [col for col in df.columns if col not in existing_cols]

    return df[existing_cols + remaining_cols]


def format_gainers_losers_df(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    df = df.copy()

    if "symbol" in df.columns:
        df["symbol"] = df["symbol"].astype(str)

    if "current_price" in df.columns:
        df["current_price"] = pd.to_numeric(df["current_price"], errors="coerce")
        df["current_price"] = df["current_price"].map(
            lambda x: f"${x:,.4f}" if pd.notnull(x) else "N/A"
        )

    if "price_change_percentage_24h" in df.columns:
        df["price_change_percentage_24h"] = pd.to_numeric(
            df["price_change_percentage_24h"], errors="coerce"
        )
        df["price_change_percentage_24h"] = df["price_change_percentage_24h"].map(
            lambda x: f"{x:+.2f}%" if pd.notnull(x) else "N/A"
        )

    df = df.rename(columns={
        "symbol": "Symbol",
        "current_price": "Price",
        "price_change_percentage_24h": "24h Change",
    })

    preferred_order = ["Symbol", "Price", "24h Change"]
    existing_cols = [col for col in preferred_order if col in df.columns]

    return df[existing_cols]


def format_volume_df(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    df = df.copy()

    if "symbol" in df.columns:
        df["symbol"] = df["symbol"].astype(str)

    if "current_price" in df.columns:
        df["current_price"] = pd.to_numeric(df["current_price"], errors="coerce")
        df["current_price"] = df["current_price"].map(
            lambda x: f"${x:,.4f}" if pd.notnull(x) else "N/A"
        )

    if "total_volume" in df.columns:
        df["total_volume"] = pd.to_numeric(df["total_volume"], errors="coerce")
        df["total_volume"] = df["total_volume"].map(
            lambda x: f"{int(x):,}" if pd.notnull(x) else "N/A"
        )

    df = df.rename(columns={
        "symbol": "Symbol",
        "current_price": "Price",
        "total_volume": "Volume",
    })

    preferred_order = ["Symbol", "Price", "Volume"]
    existing_cols = [col for col in preferred_order if col in df.columns]

    return df[existing_cols]


def format_movers_df(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    df = df.copy()

    if "symbol" in df.columns:
        df["symbol"] = df["symbol"].astype(str)

    if "latest_price" in df.columns:
        df["latest_price"] = pd.to_numeric(df["latest_price"], errors="coerce")
        df["latest_price"] = df["latest_price"].map(
            lambda x: f"${x:,.4f}" if pd.notnull(x) else "N/A"
        )

    if "previous_price" in df.columns:
        df["previous_price"] = pd.to_numeric(df["previous_price"], errors="coerce")
        df["previous_price"] = df["previous_price"].map(
            lambda x: f"${x:,.4f}" if pd.notnull(x) else "N/A"
        )

    if "price_change_pct" in df.columns:
        df["price_change_pct"] = pd.to_numeric(df["price_change_pct"], errors="coerce")
        df["price_change_pct"] = df["price_change_pct"].map(
            lambda x: f"{x:+.2f}%" if pd.notnull(x) else "N/A"
        )

    df = df.rename(columns={
        "symbol": "Symbol",
        "latest_price": "Latest Price",
        "previous_price": "Previous Price",
        "price_change_pct": "Change %",
    })

    preferred_order = ["Symbol", "Latest Price", "Previous Price", "Change %"]
    existing_cols = [col for col in preferred_order if col in df.columns]

    return df[existing_cols]


# -----------------------
# SIDEBAR NAVIGATION
# -----------------------
# -----------------------
# SIDEBAR NAVIGATION
# -----------------------
def set_page(page_name: str):
    st.session_state["page"] = page_name


if "page" not in st.session_state:
    st.session_state["page"] = "Dashboard"

with st.sidebar:
    st.markdown("## 🚀 Crypto Platform")
    st.caption("Market intelligence dashboard")

    status, emoji = get_system_status()
    last_update = get_last_update_time()

    if last_update:
        last_update_str = last_update.strftime("%d %b %H:%M")
    else:
        last_update_str = "N/A"

    st.markdown(
        f"""
        <div style="
            background: linear-gradient(
                180deg,
                rgba(30, 27, 75, 0.55),
                rgba(15, 23, 42, 0.65)
            );
            border: 1px solid rgba(124, 58, 237, 0.16);
            border-radius: 14px;
            padding: 12px 14px;
            margin: 10px 0 18px 0;
        ">
            <div style="font-size: 14px; color: #CBD5F5; font-weight: 600;">
                {emoji} {status}
            </div>
            <div style="font-size: 12px; color: #94A3B8; margin-top: 4px;">
                Updated: {last_update_str}<br>
                <span style="font-size: 11px; color: #64748B;">
                    Refresh: 15 min cycle
                </span>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

    alerts = get_alerts()
    alert_count = len(alerts)

    high_alerts = sum(1 for alert in alerts if alert.get("severity") == "High")
    medium_alerts = sum(1 for alert in alerts if alert.get("severity") == "Medium")
    low_alerts = sum(1 for alert in alerts if alert.get("severity") == "Low")

    watchlist_preview = st.session_state.get("watchlist_saved", [])[:3]
    market_signal = get_market_signal()

    st.markdown(
        f"""
        <div style="
            background: linear-gradient(
                180deg,
                rgba(30, 27, 75, 0.45),
                rgba(15, 23, 42, 0.60)
            );
            border: 1px solid rgba(124, 58, 237, 0.14);
            border-radius: 14px;
            padding: 12px 14px;
            margin: 0 0 18px 0;
        ">
            <div style="font-size: 12px; color: #94A3B8; font-weight: 600;">
                Market Signal
            </div>
            <div style="font-size: 16px; color: {market_signal['color']}; font-weight: 700; margin-top: 4px;">
                {market_signal['label']}
            </div>
            <div style="font-size: 11px; color: #CBD5F5; margin-top: 4px;">
                Confidence: {market_signal['confidence']}%
            </div>
            <div style="font-size: 11px; color: #94A3B8; margin-top: 6px; line-height: 1.45;">
                {market_signal['message']}
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

    st.markdown(
        f"""
        <div style="
            background: linear-gradient(
                180deg,
                rgba(30, 27, 75, 0.45),
                rgba(15, 23, 42, 0.60)
            );
            border: 1px solid rgba(124, 58, 237, 0.14);
            border-radius: 14px;
            padding: 12px 14px;
            margin: 0 0 18px 0;
        ">
            <div style="font-size: 12px; color: #94A3B8; font-weight: 600;">
                Alerts Summary
            </div>
            <div style="font-size: 11px; color: #E5E7EB; margin-top: 8px; line-height: 1.7;">
                <span style="color: #ef4444; font-weight: 700;">High:</span> {high_alerts}<br>
                <span style="color: #f59e0b; font-weight: 700;">Medium:</span> {medium_alerts}<br>
                <span style="color: #22c55e; font-weight: 700;">Low:</span> {low_alerts}
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

    st.markdown("### 🧱 Core")
    core_items = [
        ("🏠 Dashboard", "Dashboard"),
        ("📊 Market", "Market"),
    ]

    current_page = st.session_state["page"]

    for label, page_name in core_items:
        is_active = current_page == page_name
        button_type = "primary" if is_active else "secondary"

        st.button(
            label,
            key=f"nav_{page_name}",
            use_container_width=True,
            type=button_type,
            on_click=set_page,
            args=(page_name,),
        )

    st.markdown("### 🧠 Intelligence")
    intelligence_items = [
        ("📈 Analysis", "Analysis"),
        (f"🚨 Alerts ({alert_count})", "Alerts"),
    ]

    for label, page_name in intelligence_items:
        is_active = current_page == page_name
        button_type = "primary" if is_active else "secondary"

        st.button(
            label,
            key=f"nav_{page_name}",
            use_container_width=True,
            type=button_type,
            on_click=set_page,
            args=(page_name,),
        )

    st.markdown("### 👤 Personal")
    personal_items = [
        ("⭐ Watchlist", "Watchlist"),
    ]

    for label, page_name in personal_items:
        is_active = current_page == page_name
        button_type = "primary" if is_active else "secondary"

        st.button(
            label,
            key=f"nav_{page_name}",
            use_container_width=True,
            type=button_type,
            on_click=set_page,
            args=(page_name,),
        )

    if watchlist_preview:
        st.markdown("---")
        st.markdown("### ⭐ Quick Watchlist")

        watchlist_snapshot = pd.DataFrame(get_latest_market_snapshot(100))

        if not watchlist_snapshot.empty:
            watchlist_snapshot = watchlist_snapshot[
                watchlist_snapshot["symbol"].isin(watchlist_preview)
            ].copy()

            if "price_change_percentage_24h" in watchlist_snapshot.columns:
                watchlist_snapshot["price_change_percentage_24h"] = pd.to_numeric(
                    watchlist_snapshot["price_change_percentage_24h"],
                    errors="coerce"
                )

            for symbol in watchlist_preview:
                row = watchlist_snapshot[watchlist_snapshot["symbol"] == symbol]

                if not row.empty:
                    change_val = row.iloc[0]["price_change_percentage_24h"]

                    if pd.notnull(change_val):
                        change_text = f"{change_val:+.2f}%"

                        if change_val > 0:
                            change_color = "#22c55e"
                        elif change_val < 0:
                            change_color = "#ef4444"
                        else:
                            change_color = "#CBD5F5"
                    else:
                        change_text = "N/A"
                        change_color = "#94A3B8"
                else:
                    change_text = "N/A"
                    change_color = "#94A3B8"

                st.markdown(
                    f"""
                    <div style="
                        background: linear-gradient(
                            90deg,
                            rgba(30, 27, 75, 0.35),
                            rgba(15, 23, 42, 0.55)
                        );
                        border: 1px solid rgba(124, 58, 237, 0.12);
                        border-radius: 12px;
                        padding: 10px 12px;
                        margin-bottom: 10px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 13px;
                    ">
                        <span style="color: #E5E7EB; font-weight: 600;">{symbol}</span>
                        <span style="color: {change_color}; font-weight: 700;">
                            {change_text}
                        </span>
                    </div>
                    """,
                    unsafe_allow_html=True
                )

    st.markdown("---")

    footer_html = """
    <div style="
        background: linear-gradient(180deg, rgba(30, 27, 75, 0.55), rgba(15, 23, 42, 0.65));
        border: 1px solid rgba(124, 58, 237, 0.16);
        border-radius: 14px;
        padding: 12px 14px;
        margin-top: 10px;
        text-align: center;
    ">
        <div style="font-size: 13px; font-weight: 700; color: #E5E7EB;">
            Built by Alper Ortak
        </div>
        <div style="
            margin-top: 6px;
            font-size: 10px;
            color: #64748B;
            letter-spacing: 0.5px;
        ">
            v1.0 • Live System
        </div>
        <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">
            Crypto analytics &amp; market monitoring
        </div>
        <div style="margin-top: 8px;">
            <a href="https://github.com/AlperTuncOrtak" target="_blank"
               style="font-size: 11px; color: #38bdf8; text-decoration: none; font-weight: 600;">
                View on GitHub
            </a>
        </div>
    </div>
    """
    st.markdown(footer_html, unsafe_allow_html=True)

page = st.session_state["page"]

# -----------------------
# SESSION STATE
# -----------------------
all_coins = get_coin_list()

if "watchlist_saved" not in st.session_state:
    st.session_state["watchlist_saved"] = all_coins[:5] if len(all_coins) >= 5 else all_coins

if "watchlist_widget" not in st.session_state:
    st.session_state["watchlist_widget"] = st.session_state["watchlist_saved"].copy()

# -----------------------
# GLOBAL HEADER
# -----------------------
st.title("📈 Crypto Analytics Platform")
st.caption("Real-time insights powered by an automated crypto data pipeline")

# -----------------------
# PAGE RENDERERS
# -----------------------
def render_dashboard():
    render_page_header(
        "🏠 Overview",
        "Track the latest market conditions, movers, and quick insights."
    )

    snapshot_kpi = pd.DataFrame(get_latest_market_snapshot(100))

    avg_change = None
    gainers_count = 0
    losers_count = 0
    insight_text = "Market insight is currently unavailable."

    if not snapshot_kpi.empty and "price_change_percentage_24h" in snapshot_kpi.columns:
        snapshot_kpi["price_change_percentage_24h"] = pd.to_numeric(
            snapshot_kpi["price_change_percentage_24h"],
            errors="coerce"
        )

        valid_changes = snapshot_kpi["price_change_percentage_24h"].dropna()

        if not valid_changes.empty:
            avg_change = valid_changes.mean()
            gainers_count = (valid_changes > 0).sum()
            losers_count = (valid_changes < 0).sum()

            if avg_change > 0 and gainers_count > losers_count:
                insight_text = (
                    "Market is leaning bullish today, with more gainers than losers "
                    "and a positive average 24h change."
                )
            elif avg_change < 0 and losers_count > gainers_count:
                insight_text = (
                    "Market is under bearish pressure today, with more losers than gainers "
                    "and a negative average 24h change."
                )
            else:
                insight_text = (
                    "Market conditions are mixed right now, with no strong directional dominance."
                )

    last_update = get_last_update_time()

    if last_update:
        last_update_str = last_update.strftime("%d %b %H:%M")
    else:
        last_update_str = "N/A"

    col1, col2, col3 = st.columns(3)

    col1.metric("Tracked Coins", get_total_tracked_coins())

    if avg_change is not None:
        col2.metric("Avg 24h Change", f"{avg_change:.2f}%")
    else:
        col2.metric("Avg 24h Change", "N/A")

    col3.metric("Gainers / Losers", f"{gainers_count} / {losers_count}")

    st.info(f"🧠 Quick Market Insight: {insight_text}")

    st.subheader("📊 Market Overview")

    col1, col2 = st.columns(2)

    with col1:
        gainers_df = pd.DataFrame(get_top_gainers(5))
        render_small_table(
            "Top Gainers",
            "Best 24h performers among tracked coins.",
            format_gainers_losers_df(gainers_df)
        )

    with col2:
        losers_df = pd.DataFrame(get_top_losers(5))
        render_small_table(
            "Top Losers",
            "Weakest 24h performers among tracked coins.",
            format_gainers_losers_df(losers_df)
        )

    col1, col2 = st.columns(2)

    with col1:
        volume_df = pd.DataFrame(get_highest_volume_coins(5))
        render_small_table(
            "Highest Volume",
            "Most actively traded coins by volume.",
            format_volume_df(volume_df)
        )

    with col2:
        movers_df = pd.DataFrame(get_recent_price_changes(10))
        render_small_table(
            "Top Movers",
            "Recent short-term price movement across tracked coins.",
            format_movers_df(movers_df)
        )

    st.divider()

    latest_snapshot_df = pd.DataFrame(get_latest_market_snapshot(20))
    if not latest_snapshot_df.empty:
        render_large_table(
            "Latest Market Snapshot",
            "Latest market snapshot for tracked coins.",
            format_snapshot_df(latest_snapshot_df),
            height=420
        )
    else:
        st.warning("No latest snapshot data found.")


def render_market():
    render_page_header(
        "📊 Market Explorer",
        "Search and explore tracked cryptocurrencies."
    )

    with st.container(border=True):
        st.markdown("### 🎛️ Market Filters")
        st.caption("Refine your market view with search, sorting, and direction controls.")

        # ÜST SATIR (3 filtre)
        col1, col2, col3 = st.columns(3)

        with col1:
            top_n = st.selectbox("Top N", [10, 20, 50, 100], index=1)

        with col2:
            direction = st.selectbox("Direction", ["All", "Gainers", "Losers"])

        with col3:
            sort_by = st.selectbox(
                "Sort By",
                ["24h Change", "Volume", "Price", "Market Cap"],
                index=0
            )

        # ALT SATIR (search full width)
        st.markdown("")
        search = st.text_input("🔍 Search coin", placeholder="BTC, ETH...")

    snapshot = pd.DataFrame(get_latest_market_snapshot(100))

    if not snapshot.empty:
        snapshot["symbol"] = snapshot["symbol"].astype(str)
        snapshot["name"] = snapshot["name"].astype(str)

        numeric_cols = [
            "current_price",
            "total_volume",
            "price_change_percentage_24h",
            "market_cap"
        ]

        for col in numeric_cols:
            if col in snapshot.columns:
                snapshot[col] = pd.to_numeric(snapshot[col], errors="coerce")

        if search:
            symbol_match = snapshot["symbol"].str.contains(search.upper(), na=False)
            name_match = snapshot["name"].str.contains(search, case=False, na=False)
            snapshot = snapshot[symbol_match | name_match]

        if direction == "Gainers":
            snapshot = snapshot[snapshot["price_change_percentage_24h"] > 0]
        elif direction == "Losers":
            snapshot = snapshot[snapshot["price_change_percentage_24h"] < 0]

        if sort_by == "24h Change":
            if direction == "Losers":
                snapshot = snapshot.sort_values(
                    by="price_change_percentage_24h",
                    ascending=True
                )
            else:
                snapshot = snapshot.sort_values(
                    by="price_change_percentage_24h",
                    ascending=False
                )

        elif sort_by == "Volume":
            snapshot = snapshot.sort_values(
                by="total_volume",
                ascending=False
            )

        elif sort_by == "Price":
            snapshot = snapshot.sort_values(
                by="current_price",
                ascending=False
            )

        elif sort_by == "Market Cap":
            snapshot = snapshot.sort_values(
                by="market_cap",
                ascending=False
            )

        snapshot = snapshot.head(top_n)

        if snapshot.empty:
            st.warning("No results found with current filters.")
            return

        render_large_table(
            "Filtered Market View",
            "Live filtered market data based on your current selection.",
            format_snapshot_df(snapshot),
            height=520
        )
    else:
        st.warning("No data found in snapshot.")


def render_analysis():
    render_page_header(
        "📈 Analysis",
        "Compare multiple assets and evaluate relative performance."
    )

    coins = get_coin_list()

    col1, col2 = st.columns([2, 1])

    with col1:
        selected = st.multiselect(
            "Select coins to compare",
            coins,
            default=coins[:3]
        )

    with col2:
        time_range = st.selectbox(
            "Time Range",
            ["1H", "6H", "24H", "7D"],
            index=2
        )

    if len(selected) > 4:
        st.warning("Please select up to 4 coins for a cleaner comparison chart.")
        return

    if not selected:
        st.info("Select at least one coin to begin analysis.")
        return

    data = get_multi_coin_history(selected)
    df = pd.DataFrame(data)

    if df.empty:
        st.warning("No historical data found for selected coins.")
        return

    df["current_price"] = pd.to_numeric(df["current_price"], errors="coerce")
    df["collected_at"] = pd.to_datetime(df["collected_at"])
    df = df.dropna(subset=["current_price", "collected_at"])

    latest_time = df["collected_at"].max()

    if time_range == "1H":
        cutoff_time = latest_time - timedelta(hours=1)
    elif time_range == "6H":
        cutoff_time = latest_time - timedelta(hours=6)
    elif time_range == "24H":
        cutoff_time = latest_time - timedelta(hours=24)
    elif time_range == "7D":
        cutoff_time = latest_time - timedelta(days=7)
    else:
        cutoff_time = df["collected_at"].min()

    df = df[df["collected_at"] >= cutoff_time]

    if df.empty:
        st.warning("No data available for the selected time range.")
        return

    performance_results = []

    for symbol, group in df.groupby("symbol"):
        group = group.sort_values("collected_at")

        if len(group) < 2:
            continue

        start_price = group["current_price"].iloc[0]
        latest_price = group["current_price"].iloc[-1]
        total_return_pct = ((latest_price - start_price) / start_price) * 100

        performance_results.append({
            "symbol": symbol,
            "start_price": start_price,
            "latest_price": latest_price,
            "total_return_pct": total_return_pct
        })

    performance_df = pd.DataFrame(performance_results)

    if not performance_df.empty:
        performance_df = performance_df.sort_values(
            by="total_return_pct",
            ascending=False
        ).reset_index(drop=True)

        best_coin = performance_df.iloc[0]
        worst_coin = performance_df.iloc[-1]

        col1, col2 = st.columns(2)
        col1.metric("Best Performer", best_coin["symbol"], f"{best_coin['total_return_pct']:.2f}%")
        col2.metric("Worst Performer", worst_coin["symbol"], f"{worst_coin['total_return_pct']:.2f}%")

        display_perf = performance_df.copy()
        display_perf["start_price"] = display_perf["start_price"].map(lambda x: f"${x:,.6f}")
        display_perf["latest_price"] = display_perf["latest_price"].map(lambda x: f"${x:,.6f}")
        display_perf["total_return_pct"] = display_perf["total_return_pct"].map(lambda x: f"{x:.2f}%")

        render_large_table(
            "Comparison Summary",
            "Performance comparison for the selected time range.",
            display_perf,
            height=260
            )

    df = df.sort_values(["symbol", "collected_at"])

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

    chart = (line + points).properties(height=500).interactive()
    st.altair_chart(chart, use_container_width=True)


def render_alerts():
    render_page_header(
        "🚨 Market Alerts",
        "Review recent alert conditions generated from market activity."
    )

    alerts = get_alerts()

    if not alerts:
        st.success("No active alerts at the moment.")
        return

    alerts_df = pd.DataFrame(alerts)

    high_count = (alerts_df["severity"] == "High").sum()
    medium_count = (alerts_df["severity"] == "Medium").sum()
    low_count = (alerts_df["severity"] == "Low").sum()

    col1, col2, col3 = st.columns(3)
    col1.metric("🔴 High Alerts", high_count)
    col2.metric("🟡 Medium Alerts", medium_count)
    col3.metric("🟢 Low Alerts", low_count)

    st.markdown("### Active Alerts")

    severity_style = {
        "High": ("🔴", "#ff4d4d"),
        "Medium": ("🟡", "#ffc107"),
        "Low": ("🟢", "#28a745"),
    }

    for alert in alerts:
        emoji, color = severity_style.get(alert["severity"], ("⚪", "#6b7280"))

        with st.container(border=True):
            st.markdown(
                f"""
                <div style="border-left: 6px solid {color}; padding-left: 12px;">
                    <div style="font-size: 20px; font-weight: 700;">
                        {emoji} {alert['type']} — {alert['symbol']}
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )

            st.write(alert["message"])
            st.caption(f"Severity: {alert['severity']}")


def render_watchlist():
    render_page_header(
        "⭐ Your Watchlist",
        "Monitor your selected coins in one place."
    )

    coins = get_coin_list()

    st.multiselect(
        "Select favorite coins",
        coins,
        key="watchlist_widget",
        on_change=sync_watchlist
    )

    selected_watchlist = st.session_state["watchlist_saved"]

    if selected_watchlist:
        snapshot = pd.DataFrame(get_latest_market_snapshot(100))
        if not snapshot.empty:
            snapshot = snapshot[snapshot["symbol"].isin(selected_watchlist)]
            render_large_table(
            "Watchlist Snapshot",
            "Live market view for your selected coins.",
            format_snapshot_df(snapshot),
            height=360
            )
        else:
            st.warning("No data available for watchlist.")
    else:
        st.info("Choose coins to build your watchlist.")


# -----------------------
# ROUTING
# -----------------------
if page == "Dashboard":
    render_dashboard()
elif page == "Market":
    render_market()
elif page == "Analysis":
    render_analysis()
elif page == "Alerts":
    render_alerts()
elif page == "Watchlist":
    render_watchlist()