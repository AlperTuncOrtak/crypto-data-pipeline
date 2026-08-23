-- ============================================================
-- Supabase SQL Editor Script: portfolio_snapshots tablosu
-- ============================================================
-- NEDEN VAR:
-- Portfoy grafigi bugune kadar gecmis FIYATLARI BUGUNKU miktarlarla
-- carpiyordu. Yani "portfoyum o gun ne ediyordu" degil, "bugunku
-- varliklarim o gun ne ederdi" gosteriyordu; dun alinmis bir coin
-- grafikte bir yildir tutuluyormus gibi gorunuyordu.
--
-- Gercek gecmis ancak kaydedilerek elde edilir. Bu tablo, kullanici
-- portfoyunu her acisinda (saatte en fazla bir kez) toplam degerini
-- yaziyor. Zamanla dogru bir zaman serisi birikiyor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    total_value NUMERIC(24, 8) NOT NULL,
    -- O anki dagilim: [{"symbol": "ETH", "quantity": 0.4, "value": 999.1}, ...]
    -- Toplamin nereden geldigini sonradan denetleyebilmek icin saklaniyor.
    holdings JSONB DEFAULT '[]'::jsonb NOT NULL
);

-- Grafik her zaman "son N gun" seklinde okuyor.
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_time
    ON public.portfolio_snapshots (user_id, captured_at DESC);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own snapshots"
ON public.portfolio_snapshots FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots"
ON public.portfolio_snapshots FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snapshots"
ON public.portfolio_snapshots FOR DELETE
USING (auth.uid() = user_id);
