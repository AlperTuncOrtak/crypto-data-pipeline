import random
from datetime import datetime

def generate_leaderboard():
    """
    Generates a pseudo-random leaderboard that changes slightly every day to simulate live rankings.
    """
    # Use current day as seed to have daily changing rankings
    seed_int = int(datetime.utcnow().strftime('%Y%m%d'))
    rng = random.Random(seed_int)
    
    names = [
        "0xWhale.eth", "AlgoSniper", "DeFiDegen", "SushiMaster", 
        "SolSurfer", "EthMaxi", "Liquidator", "ArbBot_v2", 
        "YieldFarmer", "DegenApe", "SmartMoney", "SniperKing"
    ]
    
    # Generate 10 random traders for today
    today_traders = rng.sample(names, 8)
    
    traders = []
    for i, name in enumerate(today_traders):
        # Top 3 get special colors and shadows, others are regular
        rank = i + 1
        
        base_pnl = 500_000 - (rank * 45_000)
        pnl = base_pnl + rng.uniform(-10000, 30000)
        
        roi = rng.uniform(100, 1500)
        win_rate = rng.uniform(55, 95)
        
        trader = {
            "rank": rank,
            "name": name,
            "pnl": f"+${pnl:,.0f}",
            "roi": f"+{roi:.0f}%",
            "winRate": f"{win_rate:.0f}%",
            "avatar": name[0] if not name.startswith("0x") else "W"
        }
        
        if rank == 1:
            trader["color"] = "from-[#533afd] to-[#f96bee]"
            trader["shadow"] = "shadow-[0_0_40px_rgba(83,58,253,0.3)]"
        elif rank == 2:
            trader["color"] = "from-[#10b981] to-[#047857]"
            trader["shadow"] = "shadow-[0_0_40px_rgba(16,185,129,0.2)]"
        elif rank == 3:
            trader["color"] = "from-[#f59e0b] to-[#b45309]"
            trader["shadow"] = "shadow-[0_0_40px_rgba(245,158,11,0.2)]"
            
        traders.append(trader)
        
    return {
        "top": traders[:3],
        "others": traders[3:]
    }
