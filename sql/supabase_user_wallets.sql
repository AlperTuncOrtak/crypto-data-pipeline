-- ============================================================
-- Supabase SQL Editor Script: user_wallets tablosu
-- ============================================================
-- 1. Tabloyu olustur (Supabase PostgreSQL)
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    provider VARCHAR(50) DEFAULT 'metamask',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Bir kullanicinin ayni cuzdani iki kez eklemesini engellemek icin:
    UNIQUE(user_id, wallet_address)
);

-- Bir cüzdan sadece TEK BİR hesaba bağlanabilsin (tek cüzdan politikası gereği)
ALTER TABLE public.user_wallets ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);

-- 2. Row Level Security (RLS) - Güvenlik Kuralları
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Kullanici SADECE KENDI cuzdanlarini gorebilir
CREATE POLICY "Users can view their own wallets" 
ON public.user_wallets FOR SELECT 
USING (auth.uid() = user_id);

-- Kullanici SADECE KENDI hesabina cuzdan ekleyebilir/silebilir
CREATE POLICY "Users can insert their own wallets" 
ON public.user_wallets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets" 
ON public.user_wallets FOR DELETE 
USING (auth.uid() = user_id);
