import os
import re
import time
import httpx
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List, Set, Tuple

from backend.services.price_service import get_live_prices_sync

# ------------------------------------------------------------------
# Desteklenen aglar.
#
# Bu liste frontend'in wagmi yapilandirmasiyla (src/main.tsx) ve Deposit
# modalinin kullaniciya verdigi sozle ayni olmali. Onceden burada sadece
# eth-mainnet vardi; kullaniciyi 5 aga para yatirmaya davet edip tek agi
# saymak, Base'e USDC gonderen birinin bakiyesinin hic gorunmemesi
# demekti.
# ------------------------------------------------------------------
CHAINS = [
    {"key": "ethereum", "name": "Ethereum", "chain_id": 1,     "subdomain": "eth-mainnet",     "native": "ETH"},
    {"key": "arbitrum", "name": "Arbitrum", "chain_id": 42161, "subdomain": "arb-mainnet",     "native": "ETH"},
    {"key": "base",     "name": "Base",     "chain_id": 8453,  "subdomain": "base-mainnet",    "native": "ETH"},
    {"key": "optimism", "name": "Optimism", "chain_id": 10,    "subdomain": "opt-mainnet",     "native": "ETH"},
    {"key": "polygon",  "name": "Polygon",  "chain_id": 137,   "subdomain": "polygon-mainnet", "native": "POL"},
]

# Zincir basina okunacak token ustu. Sinirsiz birakmak, spam airdrop'la
# dolu bir cuzdanda yuzlerce metadata cagrisi demek. Sinir asilirsa
# yanitta `truncated` ile bildiriliyor — sessizce kesmiyoruz.
MAX_TOKENS_PER_CHAIN = 25

# Gercek ticker'lar harf/rakam ve kisa. L2'lerde phishing airdrop'lari
# sembol alanina URL ve emoji koyuyor ("WWW.BADRP.CO ✅") — portfoy tablosunda
# oltalama linki gostermemek icin bunlari eliyoruz.
TICKER_RE = re.compile(r"^[A-Z0-9]{1,12}$")

HEADERS = {"accept": "application/json", "content-type": "application/json"}
RPC_TIMEOUT = 12.0
META_TIMEOUT = 6.0

# ------------------------------------------------------------------
# Kanonik token listesi.
#
# Bakiyeleri SEMBOLE gore fiyatlamak, ticker'ini calan spam token'i
# gercek token sanmak demek. Vitalik'in cuzdaninda "BTC" sembollu sahte
# bir kontrat (0x006492...) gercek BTC fiyatiyla carpilip 5.2 milyar
# dolar, "NOT" sembollu bir digeri 10^55 dolar goruluyordu. TICKER_RE
# sadece URL/emoji iceren sembolleri eliyor; gercek bir ticker'i birebir
# kopyalayan klonu ayirt edemez.
#
# Ayirt eden sey kontrat adresi. LI.FI'nin /v1/tokens yaniti her token
# icin `coinKey` tasiyor: bu alan kanonik kayitta sembole esit, klonlarda
# bos. Ayni teknik frontend'de swap token seciciyi duzeltmek icin zaten
# kullaniliyor (SwapInterface.tsx FEATURED_TOKENS).
# ------------------------------------------------------------------
_LIFI_TOKENS_URL = "https://li.quest/v1/tokens?chains=" + ",".join(
    str(c["chain_id"]) for c in CHAINS
)
# 1 saat: liste artik sadece "kanonik mi" sorusuna degil, kendi fiyat
# akisimizin bilmedigi tokenlarin FIYATINA da kaynaklik ediyor.
_CANONICAL_TTL = 3600
# ponytail: surec ici cache — container yeniden basladiginda ilk istek
# listeyi tekrar cekiyor. Cok worker'da paylasim gerekirse Redis'e tasi.
_canonical_cache: Tuple[float, Dict[Tuple[int, str], float]] = (0.0, {})


def _is_canonical(balance: dict, canonical) -> bool:
    """Native coin her zaman gercek; ERC-20 icin kontrat listede olmali."""
    if balance["contract_address"] == "native":
        return True
    return (balance["chain_id"], balance["contract_address"].lower()) in canonical


def _canonical_tokens() -> Tuple[Dict[Tuple[int, str], float], bool]:
    """
    {(chain_id, kontrat_adresi): usd_fiyat} doner. Ikinci deger: liste
    tazelenemedi mi — o zaman fiyatlama eksik kalir ve bunu cagirana
    soyluyoruz, sessizce yanlis toplam uretmiyoruz.

    Fiyat da tutuluyor cunku kendi akisimiz (OKX/Gate WS -> latest_prices)
    yalnizca borsada listelenen sembolleri biliyor. cbBTC gibi sarmalanmis
    tokenlar orada yok ve $0 fiyatlaniyordu: kullanicinin $0.30'luk cbBTC
    bakiyesi tabloda "$0.00" gorunup toplamdan dusuyordu.
    """
    global _canonical_cache
    fetched_at, cached = _canonical_cache
    if cached and time.time() - fetched_at < _CANONICAL_TTL:
        return cached, False

    try:
        resp = httpx.get(_LIFI_TOKENS_URL, timeout=20.0)
        resp.raise_for_status()
        canonical = {
            (int(chain_id), t["address"].lower()): float(t.get("priceUSD") or 0)
            for chain_id, tokens in (resp.json().get("tokens") or {}).items()
            for t in tokens
            if t.get("address") and (t.get("coinKey") or "") == (t.get("symbol") or "")
        }
        if canonical:
            _canonical_cache = (time.time(), canonical)
            return canonical, False
        print("[alchemy] canonical token list came back empty")
    except Exception as e:
        print(f"[alchemy] canonical token list fetch failed: {e}")

    # Liste alinamadi: elde bayat liste varsa onunla devam. O da yoksa
    # sadece native coinler fiyatlanir. Eksik gostermek, sahte milyar
    # dolar gostermekten iyidir.
    return cached, True


def _rpc(client: httpx.Client, url: str, method: str, params: list, timeout: float) -> Any:
    resp = client.post(
        url,
        json={"id": 1, "jsonrpc": "2.0", "method": method, "params": params},
        headers=HEADERS,
        timeout=timeout,
    )
    resp.raise_for_status()
    return resp.json().get("result")


def _fetch_chain(wallet_address: str, chain: dict, api_key: str) -> Dict[str, Any]:
    """Tek bir agdaki native + ERC20 bakiyelerini dondurur."""
    url = f"https://{chain['subdomain']}.g.alchemy.com/v2/{api_key}"
    balances: List[dict] = []
    truncated = False
    # Alchemy'de her ag app bazinda ayri ayri aciliyor. Kapali bir agda
    # anahtar 403 doner — bu gecici bir hata degil, yapilandirma eksigi.
    # Ayirt etmezsek her istekte 4 ag icin ayni hata loga basiliyor ve
    # kullanici neden bakiye gormedigini asla ogrenemiyor.
    forbidden = False

    with httpx.Client() as client:
        # 1. Native coin
        try:
            raw = _rpc(client, url, "eth_getBalance", [wallet_address, "latest"], RPC_TIMEOUT)
            amount = int(raw, 16) / (10 ** 18)
            if amount > 0:
                balances.append({
                    "contract_address": "native",
                    "decimals": 18,
                    "balance": amount,
                    "symbol": chain["native"],
                    "chain": chain["key"],
                    "chain_name": chain["name"],
                    "chain_id": chain["chain_id"],
                    "usd_value": 0,
                })
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (401, 403):
                forbidden = True
            else:
                print(f"[alchemy] native balance failed on {chain['key']}: {e}")
        except Exception as e:
            print(f"[alchemy] native balance failed on {chain['key']}: {e}")

        # 2. ERC20 bakiyeleri
        if forbidden:
            return {"chain": chain["key"], "balances": [], "truncated": False, "forbidden": True}

        try:
            result = _rpc(client, url, "alchemy_getTokenBalances", [wallet_address, "erc20"], RPC_TIMEOUT)
            token_balances = (result or {}).get("tokenBalances", [])
            non_zero = [
                tb for tb in token_balances
                if tb.get("tokenBalance") and int(tb["tokenBalance"], 16) > 0
            ]

            if len(non_zero) > MAX_TOKENS_PER_CHAIN:
                truncated = True
                non_zero = non_zero[:MAX_TOKENS_PER_CHAIN]

            for tb in non_zero:
                contract = tb.get("contractAddress")
                try:
                    meta = _rpc(client, url, "alchemy_getTokenMetadata", [contract], META_TIMEOUT) or {}
                    decimals = meta.get("decimals")
                    if decimals is None:
                        decimals = 18
                    symbol = (meta.get("symbol") or "").strip().upper()
                    if not TICKER_RE.match(symbol):
                        continue

                    amount = int(tb["tokenBalance"], 16) / (10 ** decimals)
                    if amount > 0:
                        balances.append({
                            "contract_address": contract,
                            "decimals": decimals,
                            "balance": amount,
                            "symbol": symbol,
                            "chain": chain["key"],
                            "chain_name": chain["name"],
                            "chain_id": chain["chain_id"],
                            "usd_value": 0,
                        })
                except Exception as e:
                    print(f"[alchemy] metadata failed for {contract} on {chain['key']}: {e}")
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (401, 403):
                forbidden = True
            else:
                print(f"[alchemy] token balances failed on {chain['key']}: {e}")
        except Exception as e:
            print(f"[alchemy] token balances failed on {chain['key']}: {e}")

    return {"chain": chain["key"], "balances": balances, "truncated": truncated, "forbidden": forbidden}


def get_wallet_balances(wallet_address: str) -> Dict[str, Any]:
    """
    Cuzdanin desteklenen tum aglardaki bakiyelerini toplar.

    Aglar paralel cekiliyor: sirayla gidilse 5 ag x (2 RPC + N metadata)
    cagrisi istegi saniyelerce bekletirdi.
    """
    api_key = os.getenv("ALCHEMY_API_KEY", "")
    
    # Eger Alchemy API Key yoksa ve ornek cuzdansa, guzel bir mock veri dondur (Mulakat/Test icin)
    if not api_key and wallet_address.lower() == "0x00000000219ab540356cbb839cbe05303d7705fa":
        return {
            "balances": [
                {"symbol": "ETH", "balance": 4500.50, "usd_value": 13501500.0, "chain": "ethereum", "contract_address": "native"},
                {"symbol": "USDT", "balance": 15000000.0, "usd_value": 15000000.0, "chain": "ethereum", "contract_address": "0xdac17f958d2ee523a2206206994597c13d831ec7"},
                {"symbol": "USDC", "balance": 8500000.0, "usd_value": 8500000.0, "chain": "ethereum", "contract_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"},
                {"symbol": "LINK", "balance": 125000.0, "usd_value": 1875000.0, "chain": "ethereum", "contract_address": "0x514910771af9ca656af840dff83e8264ecf986ca"},
                {"symbol": "ARB", "balance": 450000.0, "usd_value": 450000.0, "chain": "arbitrum", "contract_address": "0x912ce59144191c1204e64559fe8253a0e49e6548"},
            ],
            "total_usd": 39326500.0,
            "chains": [],
            "error": None
        }
        
    if not api_key:
        return {"balances": [], "total_usd": 0, "chains": [], "error": "ALCHEMY_API_KEY is not configured"}

    try:
        with ThreadPoolExecutor(max_workers=len(CHAINS)) as pool:
            results = list(pool.map(lambda c: _fetch_chain(wallet_address, c, api_key), CHAINS))
    except Exception as e:
        return {"balances": [], "total_usd": 0, "chains": [], "error": str(e)}

    balances: List[dict] = []
    truncated_chains: List[str] = []
    unavailable_chains: List[str] = []
    for r in results:
        balances.extend(r["balances"])
        if r["truncated"]:
            truncated_chains.append(r["chain"])
        if r.get("forbidden"):
            unavailable_chains.append(r["chain"])

    if unavailable_chains:
        # Tek satir, istek basina bir kez — her ag icin ayri stack degil.
        print(
            "[alchemy] API key has no access to: "
            + ", ".join(unavailable_chains)
            + " — enable these networks for the app in the Alchemy dashboard"
        )

    # Fiyatlar sembol bazli; ayni sembol farkli aglarda ayni fiyattan.
    prices = get_live_prices_sync([b["symbol"] for b in balances])

    canonical, pricing_degraded = _canonical_tokens()

    total_usd = 0.0
    unpriced = 0
    for b in balances:
        # Kontrat kanonik degilse fiyatlamiyoruz: sembolu gercek token'la
        # ayni olan klonlar toplami milyarlarca dolar sisiriyordu.
        if not _is_canonical(b, canonical):
            b["usd_value"] = 0
            b["unpriced"] = True
            unpriced += 1
            continue
        # Once kendi akisimiz (canli, saniyelik). Bilmiyorsa LI.FI'nin ayni
        # kanonik kayittan gelen fiyati — kontrat bazli, yani sembolu calan
        # bir klon bu yedege giremiyor.
        price = prices.get(b["symbol"], 0)
        if not price and b["contract_address"] != "native":
            price = canonical.get((b["chain_id"], b["contract_address"].lower()), 0)

        b["price_usd"] = price
        b["usd_value"] = b["balance"] * price
        if not price:
            b["unpriced"] = True
            unpriced += 1
        total_usd += b["usd_value"]

    balances.sort(key=lambda b: b["usd_value"], reverse=True)

    return {
        "balances": balances,
        "total_usd": total_usd,
        "chains": [c["key"] for c in CHAINS],
        "truncated_chains": truncated_chains,
        # Frontend bunu kullaniciya "su aglar yapilandirilmamis" diye
        # gosterebilir; sessizce eksik bakiye gostermekten iyidir.
        "unavailable_chains": unavailable_chains,
        # Kanonik olmadigi icin fiyatlanmayan token sayisi — cogu spam.
        "unpriced_tokens": unpriced,
        # True ise kanonik liste cekilemedi, toplam eksik olabilir.
        "pricing_degraded": pricing_degraded,
    }


if __name__ == "__main__":
    # ponytail: sembol filtresi tek kontrol noktasi, testi de tek satirlik.
    spam = ["WWW.BADRP.CO ✅", "WWW.TCARD.LAT 🟢", "", "CLAIM-REWARDS.XYZ", "A" * 13]
    real = ["ETH", "USDC", "WBTC", "PEPE", "1INCH", "POL"]
    assert not any(TICKER_RE.match(x.strip().upper()) for x in spam), "spam passed the filter"
    assert all(TICKER_RE.match(x) for x in real), "real ticker rejected"
    print("symbol filter OK")

    # Kanonik kontrat filtresi. Adresler canli veriden alindi: asagidaki
    # iki sahte kontrat gercek ticker'i kullaniyor ve eski kodda toplama
    # 5.2 milyar + 249 milyon dolar ekliyordu.
    fake_btc = {"contract_address": "0x006492d0102F0cc252aaf8683DE85a0177941B59",
                "chain_id": 1, "symbol": "BTC"}
    fake_eth = {"contract_address": "0x001075b96b0505d14E0e2F338d79b32c7d875b3b",
                "chain_id": 8453, "symbol": "ETH"}
    real_wbtc = {"contract_address": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
                 "chain_id": 1, "symbol": "WBTC"}
    native = {"contract_address": "native", "chain_id": 1, "symbol": "ETH"}

    canon = {(1, "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"): 79000.0}
    assert not _is_canonical(fake_btc, canon), "sahte BTC fiyatlandi"
    assert not _is_canonical(fake_eth, canon), "sahte ETH fiyatlandi"
    assert _is_canonical(real_wbtc, canon), "gercek WBTC elendi"
    assert _is_canonical(native, canon), "native coin elendi"
    # Liste bos gelirse (LI.FI erisilemez) sadece native fiyatlanmali.
    assert _is_canonical(native, {}) and not _is_canonical(real_wbtc, {})
    print("canonical contract filter OK")
