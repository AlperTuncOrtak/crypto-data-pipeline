# ============================================================
# backend/services/volume_anomaly.py
# ============================================================
# Hacim anomalisi tespiti.
#
# Mantık:
#   - Her coin için Redis'te son 20 volume ölçümü tutulur (rolling window)
#   - Anlık volume, bu pencerenin ortalamasının SPIKE_MULTIPLIER katını
#     geçiyorsa "spike" kabul edilir
#   - Minimum volume eşiği: küçük coinlerdeki gürültüyü filtreler
#   - Son spike zamanı kaydedilir — aynı coin için 10 dk cooldown
#
# Redis key'leri:
#   volume_history:{SYMBOL}  → list (son 20 anlık volume)
#   volume_spike:{SYMBOL}    → spike timestamp (cooldown için)
# ============================================================

import time
import json
import logging
import os
import redis as aioredis

log = logging.getLogger("volume_anomaly")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = aioredis.from_url(REDIS_URL, decode_responses=True)

# ── Konfigürasyon ─────────────────────────────────────────────
SPIKE_MULTIPLIER = 3.0  # Anlık volume > ortalama × 3 → spike
MIN_VOLUME_USD = 100_000  # Minimum günlük volume ($100K altı = gürültü)
HISTORY_SIZE = 20  # Rolling window boyutu (ölçüm sayısı)
COOLDOWN_SECONDS = 600  # Aynı coin için min. 10 dakika arası
MIN_HISTORY = 5  # En az 5 ölçüm olmadan spike bildirme


def update_volume_history(symbol: str, volume: float) -> None:
    """Her yeni ticker geldiğinde volume history'e ekle."""
    key = f"volume_history:{symbol.upper()}"
    r.rpush(key, volume)
    r.ltrim(key, -HISTORY_SIZE, -1)  # Son 20 ölçümü tut
    r.expire(key, 3600)  # 1 saat TTL


def check_volume_spike(symbol: str, current_volume: float) -> dict | None:
    """
    Anlık volume geçmiş ortalamayı SPIKE_MULTIPLIER katından fazla geçiyorsa
    spike dict döner, aksi halde None döner.

    Dönen dict:
    {
        "symbol": str,
        "current_volume": float,
        "avg_volume": float,
        "multiplier": float,    # kaç katı
        "severity": str,        # "high" | "extreme"
    }
    """
    sym = symbol.upper()

    # Minimum volume kontrolü
    if current_volume < MIN_VOLUME_USD:
        return None

    # Cooldown kontrolü
    cooldown_key = f"volume_spike:{sym}"
    last_spike = r.get(cooldown_key)
    if last_spike and (time.time() - float(last_spike)) < COOLDOWN_SECONDS:
        return None

    # History'den ortalama hesapla
    history_key = f"volume_history:{sym}"
    raw_history = r.lrange(history_key, 0, -1)

    if len(raw_history) < MIN_HISTORY:
        return None

    history = [float(v) for v in raw_history if float(v) > 0]
    if not history:
        return None

    avg_volume = sum(history) / len(history)

    # Ortalama çok düşükse (veri henüz stable değil) atla
    if avg_volume < MIN_VOLUME_USD * 0.1:
        return None

    multiplier = current_volume / avg_volume if avg_volume > 0 else 0

    if multiplier < SPIKE_MULTIPLIER:
        return None

    # Spike tespit edildi — cooldown kaydet
    r.set(cooldown_key, time.time(), ex=COOLDOWN_SECONDS)

    severity = "extreme" if multiplier >= 10 else "high"

    log.info(
        f"Volume spike: {sym} {multiplier:.1f}x "
        f"(current={current_volume:,.0f}, avg={avg_volume:,.0f}) [{severity}]"
    )

    return {
        "symbol": sym,
        "current_volume": current_volume,
        "avg_volume": avg_volume,
        "multiplier": round(multiplier, 2),
        "severity": severity,
    }


def get_recent_spikes(limit: int = 10) -> list:
    """
    Son spike'ları Redis'ten çek.
    multi_exchange_ws.py spike tespit edince buraya yazar.
    """
    key = "volume_spikes_log"
    raw = r.lrange(key, 0, limit - 1)
    result = []
    for item in raw:
        try:
            result.append(json.loads(item))
        except Exception:
            pass
    return result


def log_spike(spike: dict, price: float = None) -> None:
    """Spike'ı Redis log listesine ekle (son 50 spike tutulur)."""
    spike["timestamp"] = time.time()
    spike["price"] = price
    key = "volume_spikes_log"
    r.lpush(key, json.dumps(spike))
    r.ltrim(key, 0, 49)
    r.expire(key, 86400)  # 24 saat TTL
