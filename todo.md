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

### 1. Uçtan Uca Data Engineering & Machine Learning Pipeline
- [ ] **Faz 1: ETL Pipeline (Veri Ambarı)**: Gate.io / Bybit / OKX WebSocket'lerinden saniyede akan yüksek frekanslı emir defteri ve hacim verilerini (Tick Data) alıp işleyerek kalıcı bir Data Warehouse'a (BigQuery/Postgres) düzenli olarak aktaran Apache Airflow yapısının kurulması.
- [ ] **Faz 2: Feature Engineering**: Toplanan bu ham tarihsel veri havuzu üzerinde özellik mühendisliği (Feature Engineering) yapılarak modelin anlayabileceği sinyallerin (hareketli ortalamalar, hacim anomalileri, RSI uyumsuzlukları) üretilmesi.
- [ ] **Faz 3: Kendi ML Modelimizi Eğitme**: Sadece Groq/Gemini gibi dış API'lere prompt göndermek yerine; kendi altyapımızda çalışan (scikit-learn vb.) ve bu temizlenmiş verilerle eğitilen "Özel Yapay Zeka (ML) Modelinin" kurulması.
- [ ] **Amacı:** Bu üçlü yapı (ETL → Feature Engineering → Custom ML Model), CV için sıradan bir API entegrasyonundan çok daha güçlü olan gerçek bir "Uçtan Uca Veri Mühendisliği" hikayesi sunacak ve sistemdeki tüm analitik modülleri (Whale X-Ray, Trade Signals vb.) benzersiz bir zekayla besleyecek.

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

### 1. Masaüstü Uygulaması (Tauri / Electron)
- Mobilden sonra değerlendirilecek. Kullanıcıların bilgisayarına indirip Alt Bar'a sabitleyebileceği, terminal hissiyatlı standalone uygulama.


### 3. Uygulama İçi Takas (DEX Swap Entegrasyonu)
- [x] 1inch veya Jupiter API'sini bağlayarak kullanıcıların siteyi terk etmeden cüzdanlarındaki token'ları anında takas (Swap) yapabilmesini sağla. (Li.Fi Widget ile tamamlandı)

### 4. UI/UX ve Genel İyileştirmeler
- [x] Orijinal kedi logosunun (CryptoNeko) sisteme tekrar entegre edilmesi.
- [x] Ayarlar (Settings) menüsüne dil değiştirme (Language Switcher) seçeneğinin eklenmesi.
- [x] Destek (Support) veya iletişim kısımlarına "Contact Me" bölümünün eklenmesi.

---
**Tasarım Notu:** Yeni eklenecek tüm özelliklerde `bg-[#19191c]/80 backdrop-blur-xl border border-white/5 shadow-2xl` cam efekti ve Framer Motion geçişleri kullanılması zorunludur.

- [x] TODO: Fix Live VPS Deployment & Docker SSL issues for AI Portfolio Engine (AI Rebalance live API 404/SSL errors)
