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
- [ ] **Sınırsız AI Chat:** Ücretsiz kullanıcılara günlük 5 mesaj, PRO'lara sınırsız sohbet.
- [ ] **Özelleştirilebilir Dashboard (Widget Builder):** Kullanıcının ana sayfasını kendi istediği grafiklerle dizayn etmesi. (PRO)

## 🎯 Sıradaki Öncelikli İşler (Yeni Özellikler)

### 1. Stripe Entegrasyonu ve Abonelik Sistemi
- PRO özellikleri kilitlemek ve ödeme altyapısını kurmak için Stripe Checkout ve Webhook entegrasyonu. (Supabase Auth ile senkronize çalışacak).

### 2. Native Mobil Uygulama (iOS & Android) - [ÖNCELİKLİ]
- **Açıklama:** Sitenin mevcut responsive yapısını tamamen "Native Mobil Uygulama" hissiyatına geçirmek. Masaüstü uygulamasından daha öncelikli olarak hedeflenmektedir.
- **Görevler:**
  - PWA (Progressive Web App) özelliklerini (Service Worker, Manifest) kusursuzlaştır.
  - Capacitor.js kullanarak mevcut React uygulamasını App Store / Google Play'e yüklenebilecek formata getir.
  - Alt menü (Bottom Navigation) ve kaydırma (Swipe) jestleri ekle.
  - Mobil cihazlarda dokunmatik titreşim (Haptic Feedback) API'sini entegre et.

## 📌 Sonraki Aşama (Backlog)

### 1. Masaüstü Uygulaması (Tauri / Electron)
- Mobilden sonra değerlendirilecek. Kullanıcıların bilgisayarına indirip Alt Bar'a sabitleyebileceği, terminal hissiyatlı standalone uygulama.

### 2. Sesli AI Asistan (Voice Mode + Audio Visualizer)
- Sağ alttaki AI Chat ekranına mikrofon butonu ekle. Web Speech API ile sesi metne (STT), metni sese (TTS) çevir ve yanıt gelirken şık bir ses dalgası (visualizer) animasyonu oynat.

### 3. Uygulama İçi Takas (DEX Swap Entegrasyonu)
- 1inch veya Jupiter API'sini bağlayarak kullanıcıların siteyi terk etmeden cüzdanlarındaki token'ları anında takas (Swap) yapabilmesini sağla.

---
**Tasarım Notu:** Yeni eklenecek tüm özelliklerde `bg-[#19191c]/80 backdrop-blur-xl border border-white/5 shadow-2xl` cam efekti ve Framer Motion geçişleri kullanılması zorunludur.
