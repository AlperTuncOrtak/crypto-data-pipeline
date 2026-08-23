import os
import httpx
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List

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

HEADERS = {"accept": "application/json", "content-type": "application/json"}
RPC_TIMEOUT = 12.0
META_TIMEOUT = 6.0


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
                    symbol = (meta.get("symbol") or "").upper()
                    if not symbol:
                        # Isimsiz token neredeyse her zaman spam; fiyatlayamayiz.
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

    total_usd = 0.0
    for b in balances:
        price = prices.get(b["symbol"], 0)
        b["usd_value"] = b["balance"] * price
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
    }
