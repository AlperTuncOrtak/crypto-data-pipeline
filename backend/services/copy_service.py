"""
Copy Trading Faz 1 — kuratorlu balina listesi ve takip kayitlari.

Bu fazda para hareketi yok. Liderlerin istatistikleri Alchemy'den GERCEK
bakiye verisiyle uretiliyor; veri gelmezse uydurulmuyor, "available: False"
donuluyor (Whale X-Ray ile ayni kural).
"""
import json
import logging
import re

from fastapi import HTTPException
from pymysql.cursors import DictCursor

from shared.db import get_connection
from backend.services.alchemy_service import get_wallet_balances

logger = logging.getLogger(__name__)

EVM_ADDRESS = re.compile(r"^0x[a-fA-F0-9]{40}$")

# Anlik goruntu bu dakikadan eskiyse tazelenir. Bayatlik kararini SQL
# veriyor: NOW() UTC donuyor (get_connection time_zone'u +00:00'a cekiyor),
# Python tarafinda karsilastirmak makinenin saat dilimine gore kayardi.
STALE_MINUTES = 30

# Liste sorgusu — bayatlik bayragi SQL'de hesaplaniyor, iki yerde
# tekrarlanmasin diye tek sabit.
#
# Gorunurluk: kuratorlu liste (added_by NULL) + kullanicinin kendi ekledigi
# adresler + takip ettigi her sey. Son sart onemli: adres tablosunda global
# unique, yani ayni balinayi ikinci kullanici eklediginde ilk kaydin id'si
# donuyor; o kaydi takip edip listede goremezse takip hayalet olurdu.
_LEADERS_SQL = """
    SELECT *,
           (last_synced_at IS NULL OR last_synced_at < NOW() - INTERVAL %s MINUTE) AS is_stale
    FROM whale_leaders
    WHERE is_active = 1
      AND (added_by IS NULL
           OR added_by = %s
           OR id IN (SELECT leader_id FROM copy_follows WHERE user_id = %s AND is_active = 1))
    ORDER BY sort_order, id
"""

# Tek istekte en fazla kac lider tazelenir. Bir lider = 5 zincire paralel
# RPC; 20 liderin hepsini ayni istekte tazelemek endpoint'i dakikalarca
# bekletir. Bayat olanlar sirayla tazeleniyor, liste birkac yuklemede isinir.
# ponytail: tazeleme istegin icinde, lider sayisi 50'yi gecerse cron'a tasi
MAX_REFRESH_PER_REQUEST = 3

TOP_HOLDINGS_COUNT = 5

MIN_ALLOCATION_USD = 10
MAX_ALLOCATION_USD = 100_000


def _snapshot(address: str) -> dict:
    """Bir adresin anlik portfoy goruntusunu Alchemy'den ceker."""
    portfolio = get_wallet_balances(address)
    if portfolio.get("error"):
        return {"error": portfolio["error"][:255]}

    priced = [b for b in portfolio.get("balances", []) if (b.get("usd_value") or 0) > 0]
    top = [
        {
            "symbol": b["symbol"],
            "chain": b["chain_name"],
            "usd_value": round(b["usd_value"], 2),
        }
        for b in priced[:TOP_HOLDINGS_COUNT]
    ]
    return {"total_usd": round(portfolio.get("total_usd") or 0, 2), "top_holdings": top}


def _refresh(cursor, leader_id: int, address: str) -> None:
    """Lideri tazeler ve sonucu (hatayi da) tabloya yazar."""
    snap = _snapshot(address)
    if "error" in snap:
        # Hata da kaydediliyor: yoksa her istekte ayni bozuk adres icin
        # tekrar tekrar Alchemy'ye gidilir.
        cursor.execute(
            "UPDATE whale_leaders SET last_sync_error = %s, last_synced_at = NOW() WHERE id = %s",
            (snap["error"], leader_id),
        )
        return
    cursor.execute(
        """UPDATE whale_leaders
           SET last_total_usd = %s, last_top_holdings = %s,
               last_synced_at = NOW(), last_sync_error = NULL
           WHERE id = %s""",
        (snap["total_usd"], json.dumps(snap["top_holdings"]), leader_id),
    )


def _format(row: dict, following: dict) -> dict:
    holdings = row.get("last_top_holdings")
    if isinstance(holdings, str):
        holdings = json.loads(holdings)

    follow = following.get(row["id"])
    return {
        "id": row["id"],
        "address": row["address"],
        "label": row["label"],
        "note": row["note"],
        # Veri gelmediyse durustce soyluyoruz — sahte rakam yok.
        "available": row["last_sync_error"] is None and row["last_total_usd"] is not None,
        "reason": row["last_sync_error"],
        "total_usd": float(row["last_total_usd"]) if row["last_total_usd"] is not None else None,
        "top_holdings": holdings or [],
        "synced_at": row["last_synced_at"].isoformat() if row["last_synced_at"] else None,
        "is_following": follow is not None,
        "allocation_usd": float(follow["allocation_usd"]) if follow else None,
    }


def _following_map(cursor, user_id: str | None) -> dict:
    if not user_id:
        return {}
    cursor.execute(
        "SELECT leader_id, allocation_usd FROM copy_follows WHERE user_id = %s AND is_active = 1",
        (user_id,),
    )
    return {r["leader_id"]: r for r in cursor.fetchall()}


def list_leaders(user_id: str | None = None) -> dict:
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        cursor.execute(_LEADERS_SQL, (STALE_MINUTES, user_id, user_id))
        rows = cursor.fetchall()

        stale = [r for r in rows if r["is_stale"]]
        for r in stale[:MAX_REFRESH_PER_REQUEST]:
            try:
                _refresh(cursor, r["id"], r["address"])
            except Exception as e:
                logger.warning("Leader refresh failed for %s: %s", r["address"], e)

        if stale:
            cursor.execute(_LEADERS_SQL, (STALE_MINUTES, user_id, user_id))
            rows = cursor.fetchall()

        following = _following_map(cursor, user_id)
        return {
            "leaders": [_format(r, following) for r in rows],
            "refreshing": max(0, len(stale) - MAX_REFRESH_PER_REQUEST),
        }
    finally:
        conn.close()


def follow(user_id: str, leader_id: int, allocation_usd: float) -> dict:
    if not MIN_ALLOCATION_USD <= allocation_usd <= MAX_ALLOCATION_USD:
        raise HTTPException(
            status_code=400,
            detail=f"Allocation must be between ${MIN_ALLOCATION_USD} and ${MAX_ALLOCATION_USD:,}",
        )

    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        # Gorunurluk kontrolu: baskasinin ozel ekledigi adres id tahminiyle
        # takip edilip listede gorunur hale getirilmesin.
        cursor.execute(
            """SELECT id FROM whale_leaders
               WHERE id = %s AND is_active = 1 AND (added_by IS NULL OR added_by = %s)""",
            (leader_id, user_id),
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Leader not found")

        cursor.execute(
            """INSERT INTO copy_follows (user_id, leader_id, allocation_usd, is_active)
               VALUES (%s, %s, %s, 1)
               ON DUPLICATE KEY UPDATE allocation_usd = VALUES(allocation_usd), is_active = 1""",
            (user_id, leader_id, allocation_usd),
        )
        return {"status": "following", "leader_id": leader_id, "allocation_usd": allocation_usd}
    finally:
        conn.close()


def unfollow(user_id: str, leader_id: int) -> dict:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE copy_follows SET is_active = 0 WHERE user_id = %s AND leader_id = %s",
            (user_id, leader_id),
        )
        return {"status": "unfollowed", "leader_id": leader_id}
    finally:
        conn.close()


def list_following(user_id: str) -> dict:
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        cursor.execute(
            """SELECT l.*, f.allocation_usd
               FROM copy_follows f
               JOIN whale_leaders l ON l.id = f.leader_id
               WHERE f.user_id = %s AND f.is_active = 1
               ORDER BY f.created_at DESC""",
            (user_id,),
        )
        rows = cursor.fetchall()
        following = {r["id"]: r for r in rows}
        return {"following": [_format(r, following) for r in rows]}
    finally:
        conn.close()


def add_leader(user_id: str, address: str, label: str, note: str | None = None) -> dict:
    """
    Kullanicinin elle ekledigi adres — sadece ona gorunur (added_by dolu).
    Adres dogrulamasi burada tek noktada.
    """
    address = address.strip().lower()
    if not EVM_ADDRESS.match(address):
        raise HTTPException(status_code=400, detail="Invalid EVM address format")
    label = (label or "").strip()
    if not label:
        raise HTTPException(status_code=400, detail="Label is required")

    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        # Adres global unique: kuratorlu listede veya baska bir kullanicida
        # zaten varsa yenisini yaratmiyoruz, mevcut kaydi donuyoruz.
        cursor.execute("SELECT id FROM whale_leaders WHERE address = %s", (address,))
        row = cursor.fetchone()
        if row:
            return {"id": row["id"], "address": address, "existing": True}

        cursor.execute(
            """INSERT INTO whale_leaders (address, label, note, added_by, sort_order)
               VALUES (%s, %s, %s, %s, 1000)""",
            (address, label[:60], (note or "").strip()[:255] or None, user_id),
        )
        return {"id": cursor.lastrowid, "address": address, "existing": False}
    finally:
        conn.close()


if __name__ == "__main__":
    # ponytail: DB gerektirmeyen tek kontrol — dogrulama sinirlari ve
    # "veri yoksa uydurma" kurali. Kalani entegrasyon isi.
    def _raises(fn, code):
        try:
            fn()
        except HTTPException as e:
            return e.status_code == code
        return False

    assert EVM_ADDRESS.match("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
    assert not EVM_ADDRESS.match("0xNOPE")
    assert not EVM_ADDRESS.match("d8da6bf26964af9d7eed9e03e53415d37aa96045")

    # Dogrulama DB'ye gitmeden once calismali, yoksa bozuk veri baglantiyi harcar.
    assert _raises(lambda: add_leader("u1", "0xbad", "Balina"), 400)
    assert _raises(lambda: add_leader("u1", "0x" + "a" * 40, "   "), 400)
    assert _raises(lambda: follow("u1", 1, MIN_ALLOCATION_USD - 1), 400)
    assert _raises(lambda: follow("u1", 1, MAX_ALLOCATION_USD + 1), 400)

    # Senkron hatasi olan lider: available False, rakam YOK.
    broken = {
        "id": 1, "address": "0x" + "a" * 40, "label": "X", "note": None,
        "last_sync_error": "ALCHEMY_API_KEY is not configured",
        "last_total_usd": None, "last_top_holdings": None, "last_synced_at": None,
    }
    out = _format(broken, {})
    assert out["available"] is False and out["total_usd"] is None, out
    assert out["reason"], "hata sebebi kullaniciya soylenmeli"

    # Saglikli lider: JSON string olarak gelen holdings parse edilmeli.
    ok = dict(broken, last_sync_error=None, last_total_usd=1234.5,
              last_top_holdings='[{"symbol": "ETH", "chain": "Base", "usd_value": 1234.5}]')
    out = _format(ok, {})
    assert out["available"] is True and out["total_usd"] == 1234.5
    assert out["top_holdings"][0]["symbol"] == "ETH"
    assert out["is_following"] is False and out["allocation_usd"] is None

    print("copy_service self-check OK")
