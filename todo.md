# 🚀 CryptoNeko - Gelecek Yol Haritası ve Görevler (TODO)

Bu dosya, projenin sonraki adımlarını koordine etmek için kullanılır.
Uygulamanın ana iskeleti "Premium Bento Box" ve "Cinematic Glow" UI standartlarına geçirilmiştir. Yeni eklenecek tüm özellikler bu tasarım standartlarına uymak zorundadır.

## ✅ Tamamlanan İşler
- **Market (Piyasalar) Sayfası:** Premium Glassmorphism UI'a geçirildi.
- **Heatmap (Köpük Haritası):** Bento Box konteyner ve Glow butonlara güncellendi.
- **AI Narrative Map (Yapay Zeka Trend Haritası):** Framer Motion ile süzülen interaktif küreler eklendi.
- **Global Command Palette (Cmd + K):** Sistem geneli arama ve navigasyon tamamlandı.
- **Social & Leaderboard:** En iyi stratejilerin gösterildiği tablo tamamlandı.
- **Whale X-Ray:** Balina cüzdan inceleme aracı eklendi.
- **Time-Machine Backtesting:** CoinGecko API destekli gerçekçi geriye dönük test (Backtesting) aracı tamamlandı.
- **AI Chat Memory:** Hetzner backend ile entegre gerçek zamanlı AI hafıza sorunu çözüldü.

## 🚨 Kritik Hata Çözümleri (Bug Fixes)
- [x] **PWA Cache / Update Sorunu:** Yeni sürüm yayınlandığında kullanıcıların sürekli "Ctrl + Shift + R" yapmak zorunda kalmasını engellemek için `vite-plugin-pwa`'nın `PromptForUpdate` (Yeni Sürüm Var, Yenile) bileşeni eklendi.
- [x] **Market Heatmap:** Görsel hizalama ve veri çekme sorunları düzeltildi.
- [x] **Portfolio Arka Planı:** Tasarımsal arka plan uyumsuzlukları giderildi.

## 💎 PRO Sürüm Özellikleri (Aylık Abonelik Modeli)
Ücretsiz sürüm temel piyasa verilerini sağlarken, aşağıdaki özellikler **CryptoNeko PRO** abonelerine özel kilitli olacak:
- [x] **Whale X-Ray:** Balina hareketleri ve on-chain para akışı.
- [x] **Time-Machine Backtesting:** Geçmişe dönük simülasyon ve portföy performansı.
- [x] **AI Candlestick Vision:** Grafikler üzerinde yapay zekanın formasyonları çizmesi (destek, direnç, whale zone).
- [x] **Sınırsız AI Chat:** Ücretsiz kullanıcılara günlük 5 mesaj, PRO'lara sınırsız sohbet.
- [x] **Özelleştirilebilir Dashboard (Widget Builder):** Kullanıcının ana sayfasını kendi istediği grafiklerle dizayn etmesi. (PRO)

## 🎯 Sıradaki Öncelikli İşler (Yeni Özellikler)

### 1. Uçtan Uca Data Engineering & Machine Learning Pipeline (Whale Anomaly Detection)
- [ ] **Faz 1: ETL Pipeline (MVP / Veri Ambarı)**: Kapsamı yönetilebilir tutmak adına tüm coinler yerine **sadece en yüksek hacimli Top 20-50 coin (BTC, ETH vb.)** ile sınırlanarak; Gate.io / Bybit / OKX WebSocket'lerinden saniyede akan *Trade (Alım/Satım)* ve *Fiyat Tick* verilerini alıp temizleyerek Data Warehouse'a (BigQuery/Postgres) düzenli aktaran minimal Airflow yapısının kurulması.
- [ ] **Faz 2: Feature Engineering**: Toplanan ham "Trade Tick" verileri üzerinde özellik mühendisliği yapılarak modelin anlayabileceği "Hacim Sıçramaları", "Zaman Ağırlıklı Ortalamalar (VWAP)" ve "Anormal İşlem Boyutları" gibi veri noktalarının üretilmesi.
- [ ] **Faz 3: Özel ML Modeli (Anomaly Detection)**: Gerçekleşmesi çok zor olan "kesin fiyat tahmini" yerine, somut ve ölçülebilir bir problem olan "Balina Hareketlerinin Tespiti" (Anomaly Detection / Unsupervised Learning - Isolation Forest vb.) üzerine odaklanan bir Makine Öğrenmesi modelinin eğitilip Whale X-Ray modülüne bağlanması.
- [ ] **Faz 4: Değerlendirme & Backtesting (Ground Truth & Başarı Ölçütü)**: Unsupervised (etiketsiz) veride klasik 'doğruluk (accuracy)' ölçülemeyeceği için;
  - Modelin işaretlediği anomalilerin (Whale Alert API veya on-chain verileri gibi) **gerçek dış kaynaklarla (Ground Truth) çapraz doğrulanması**.
  - Performansın "Accuracy" yerine **"Tespit Oranı (Hit Rate) ve Precision@k"** gibi doğru metriklerle ölçümlenerek raporlanması.
- [ ] **Amacı:** Bu dörtlü yapı, CV için "Top 50 coinin canlı verisiyle Minimum Viable bir ETL kurdum, VWAP ve hacim sıçraması feature'ları ürettim, Isolation Forest modeli eğittim ve performansını dış on-chain verilerle (Ground Truth) doğruladım" diyebileceğin, mülakatlarda her türlü teknik sorguya dayanıklı kusursuz bir veri mühendisliği hikayesi sunacak.

### 2. Stripe Entegrasyonu ve Abonelik Sistemi
- [x] PRO özellikleri kilitlemek ve ödeme altyapısını kurmak için Stripe Checkout ve Webhook entegrasyonu. (Supabase Auth ile senkronize çalışacak).

### 2. Native Mobil Uygulama (iOS & Android) - [ÖNCELİKLİ]
- **Açıklama:** Sitenin mevcut responsive yapısını tamamen "Native Mobil Uygulama" hissiyatına geçirmek. Masaüstü uygulamasından daha öncelikli olarak hedeflenmektedir.
- **Görevler:**
  - [x] PWA (Progressive Web App) özelliklerini (Service Worker, Manifest) kusursuzlaştır.
  - [x] Capacitor.js kullanarak mevcut React uygulamasını App Store / Google Play'e yüklenebilecek formata getir.
  - [x] Alt menü (Bottom Navigation) ve kaydırma (Swipe) jestleri ekle.
  - [x] Mobil cihazlarda dokunmatik titreşim (Haptic Feedback) API'sini entegre et.
  - [ ] **Mobil Uygulama Testleri:** Xcode ve Android Studio üzerinde derleyip, gerçek cihaz/simülatör testlerinin (UI/UX, Stripe Modal, Haptics) yapılması.

## 📌 Sonraki Aşama (Backlog)

### 3. Uygulama İçi Takas (DEX Swap Entegrasyonu)
- [x] 1inch veya Jupiter API'sini bağlayarak kullanıcıların siteyi terk etmeden cüzdanlarındaki token'ları anında takas (Swap) yapabilmesini sağla. (Li.Fi Widget ile tamamlandı)

### 4. UI/UX ve Genel İyileştirmeler
- [x] Orijinal kedi logosunun (CryptoNeko) sisteme tekrar entegre edilmesi.
- [x] Ayarlar (Settings) menüsüne dil değiştirme (Language Switcher) seçeneğinin eklenmesi.
# 🚀 CryptoNeko - Gelecek Yol Haritası ve Görevler (TODO)

Bu dosya, projenin sonraki adımlarını koordine etmek için kullanılır.
Uygulamanın ana iskeleti "Premium Bento Box" ve "Cinematic Glow" UI standartlarına geçirilmiştir. Yeni eklenecek tüm özellikler bu tasarım standartlarına uymak zorundadır.

## ✅ Tamamlanan İşler
- **Market (Piyasalar) Sayfası:** Premium Glassmorphism UI'a geçirildi.
- **Heatmap (Köpük Haritası):** Bento Box konteyner ve Glow butonlara güncellendi.
- **AI Narrative Map (Yapay Zeka Trend Haritası):** Framer Motion ile süzülen interaktif küreler eklendi.
- **Global Command Palette (Cmd + K):** Sistem geneli arama ve navigasyon tamamlandı.
- **Social & Leaderboard:** En iyi stratejilerin gösterildiği tablo tamamlandı.
- **Whale X-Ray:** Balina cüzdan inceleme aracı eklendi.
- **Time-Machine Backtesting:** CoinGecko API destekli gerçekçi geriye dönük test (Backtesting) aracı tamamlandı.
- **AI Chat Memory:** Hetzner backend ile entegre gerçek zamanlı AI hafıza sorunu çözüldü.

## 🚨 Kritik Hata Çözümleri (Bug Fixes)
- [x] **PWA Cache / Update Sorunu:** Yeni sürüm yayınlandığında kullanıcıların sürekli "Ctrl + Shift + R" yapmak zorunda kalmasını engellemek için `vite-plugin-pwa`'nın `PromptForUpdate` (Yeni Sürüm Var, Yenile) bileşeni eklendi.
- [x] **Market Heatmap:** Görsel hizalama ve veri çekme sorunları düzeltildi.
- [x] **Portfolio Arka Planı:** Tasarımsal arka plan uyumsuzlukları giderildi.

## 💎 PRO Sürüm Özellikleri (Aylık Abonelik Modeli)
Ücretsiz sürüm temel piyasa verilerini sağlarken, aşağıdaki özellikler **CryptoNeko PRO** abonelerine özel kilitli olacak:
- [x] **Whale X-Ray:** Balina hareketleri ve on-chain para akışı.
- [x] **Time-Machine Backtesting:** Geçmişe dönük simülasyon ve portföy performansı.
- [x] **AI Candlestick Vision:** Grafikler üzerinde yapay zekanın formasyonları çizmesi (destek, direnç, whale zone).
- [x] **Sınırsız AI Chat:** Ücretsiz kullanıcılara günlük 5 mesaj, PRO'lara sınırsız sohbet.
- [x] **Özelleştirilebilir Dashboard (Widget Builder):** Kullanıcının ana sayfasını kendi istediği grafiklerle dizayn etmesi. (PRO)

## 🎯 Sıradaki Öncelikli İşler (Yeni Özellikler)

### 1. Uçtan Uca Data Engineering & Machine Learning Pipeline (Whale Anomaly Detection)
- [ ] **Faz 1: ETL Pipeline (MVP / Veri Ambarı)**: Kapsamı yönetilebilir tutmak adına tüm coinler yerine **sadece en yüksek hacimli Top 20-50 coin (BTC, ETH vb.)** ile sınırlanarak; Gate.io / Bybit / OKX WebSocket'lerinden saniyede akan *Trade (Alım/Satım)* ve *Fiyat Tick* verilerini alıp temizleyerek Data Warehouse'a (BigQuery/Postgres) düzenli aktaran minimal Airflow yapısının kurulması.
- [ ] **Faz 2: Feature Engineering**: Toplanan ham "Trade Tick" verileri üzerinde özellik mühendisliği yapılarak modelin anlayabileceği "Hacim Sıçramaları", "Zaman Ağırlıklı Ortalamalar (VWAP)" ve "Anormal İşlem Boyutları" gibi veri noktalarının üretilmesi.
- [ ] **Faz 3: Özel ML Modeli (Anomaly Detection)**: Gerçekleşmesi çok zor olan "kesin fiyat tahmini" yerine, somut ve ölçülebilir bir problem olan "Balina Hareketlerinin Tespiti" (Anomaly Detection / Unsupervised Learning - Isolation Forest vb.) üzerine odaklanan bir Makine Öğrenmesi modelinin eğitilip Whale X-Ray modülüne bağlanması.
- [ ] **Faz 4: Değerlendirme & Backtesting (Ground Truth & Başarı Ölçütü)**: Unsupervised (etiketsiz) veride klasik 'doğruluk (accuracy)' ölçülemeyeceği için;
  - Modelin işaretlediği anomalilerin (Whale Alert API veya on-chain verileri gibi) **gerçek dış kaynaklarla (Ground Truth) çapraz doğrulanması**.
  - Performansın "Accuracy" yerine **"Tespit Oranı (Hit Rate) ve Precision@k"** gibi doğru metriklerle ölçümlenerek raporlanması.
- [ ] **Amacı:** Bu dörtlü yapı, CV için "Top 50 coinin canlı verisiyle Minimum Viable bir ETL kurdum, VWAP ve hacim sıçraması feature'ları ürettim, Isolation Forest modeli eğittim ve performansını dış on-chain verilerle (Ground Truth) doğruladım" diyebileceğin, mülakatlarda her türlü teknik sorguya dayanıklı kusursuz bir veri mühendisliği hikayesi sunacak.

### 2. Stripe Entegrasyonu ve Abonelik Sistemi
- [x] PRO özellikleri kilitlemek ve ödeme altyapısını kurmak için Stripe Checkout ve Webhook entegrasyonu. (Supabase Auth ile senkronize çalışacak).

### 2. Native Mobil Uygulama (iOS & Android) - [ÖNCELİKLİ]
- **Açıklama:** Sitenin mevcut responsive yapısını tamamen "Native Mobil Uygulama" hissiyatına geçirmek. Masaüstü uygulamasından daha öncelikli olarak hedeflenmektedir.
- **Görevler:**
  - [x] PWA (Progressive Web App) özelliklerini (Service Worker, Manifest) kusursuzlaştır.
  - [x] Capacitor.js kullanarak mevcut React uygulamasını App Store / Google Play'e yüklenebilecek formata getir.
  - [x] Alt menü (Bottom Navigation) ve kaydırma (Swipe) jestleri ekle.
  - [x] Mobil cihazlarda dokunmatik titreşim (Haptic Feedback) API'sini entegre et.
  - [ ] **Mobil Uygulama Testleri:** Xcode ve Android Studio üzerinde derleyip, gerçek cihaz/simülatör testlerinin (UI/UX, Stripe Modal, Haptics) yapılması.

## 💰 Gelir Modeli & Komisyon Ayarları (Monetization & Treasury)
- [ ] **Swap (DEX) Komisyon Ayarı (.env):** Kullanıcıların yaptığı her swap işleminden kasamıza %0.5 (binde 5) kripto komisyonu kalması için `.env` dosyasına şu değişkenler tanımlanmalı:
  ```env
  VITE_TREASURY_ADDRESS="0xSizinCuzdanAdresiniz..." # Komisyonların otomatik aktarılacağı EVM cüzdan adresi
  VITE_FEE_PERCENTAGE="0.005"                       # %0.5 komisyon (ör: 0.01 yapılırsa %1 olur)
  VITE_0X_API_KEY="your-0x-api-key"                 # Gerçek mainnet işlemleri için 0x API key
  ```
- [ ] **Stripe Kredi Kartı Abonelikleri (.env):** PRO/Enterprise paket satışlarının banka hesabına aktarılması için:
  ```env
  STRIPE_SECRET_KEY="sk_live_..."
  STRIPE_WEBHOOK_SECRET="whsec_..."
  STRIPE_PRICE_PRO_MONTHLY="price_..."
  STRIPE_PRICE_PRO_YEARLY="price_..."
  ```

---
**Tasarım Notu:** Yeni eklenecek tüm özelliklerde `#09090b` (zinc-950) koyu zemin ve `white/[0.04]` Ethena cam efekti standarttır.

- [x] Fix Live VPS Deployment & Docker SSL issues for AI Portfolio Engine
- [x] Landing page hero section animasyonları
- [x] Portfolio sayfası USD hesaplamaları & Dust filtreleri (price_service.py)
- [x] Swap motoru 0x allowanceTarget ve transaction receipt bekletme geliştirmeleri
