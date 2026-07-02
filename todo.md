# 🚀 CryptoNeko - Gelecek Yol Haritası ve Görevler (TODO)

Bu dosya, projenin sonraki adımlarını koordine etmek için kullanılır.
Uygulamanın ana iskeleti "Premium Bento Box" ve "Cinematic Glow" UI standartlarına geçirilmiştir. Yeni eklenecek tüm özellikler bu tasarım standartlarına uymak zorundadır.

## ✅ Tamamlanan İşler
- **Market (Piyasalar) Sayfası:** Premium Glassmorphism UI'a geçirildi.
- **Heatmap (Köpük Haritası):** Bento Box konteyner ve Glow butonlara güncellendi.
- **AI Narrative Map (Yapay Zeka Trend Haritası):** Framer Motion ile süzülen interaktif küreler ve Bento Box modal tasarımı ile tamamlandı. Vercel'e deploy edilmeye hazır.

## 🟢 Devam Eden / Sıradaki Öncelikli İşler

### 1. Global Command Palette (Cmd + K) - [Sırada]
- **Açıklama:** Kullanıcıların Cmd + K veya Ctrl + K tuşlarına bastığında ekranda beliren, Linear/Raycast tarzı bulanık (backdrop-blur-xl) arka planlı arama ekranı.
- **Görevler:**
  - SearchCommand.tsx bileşenini Premium UI standartlarına göre yeniden tasarla.
  - Tüm sayfalara ve özelliklere (Örn: "Go to Settings", "Toggle Dark Mode", "View BTC") anında erişim sağlayacak komutları ekle.

### 2. Social & Leaderboard (Liderlik Tablosu) - [Sırada]
- **Açıklama:** En iyi kazanan cüzdanları veya AI stratejilerini gösteren şık bir sıralama sayfası.
- **Görevler:**
  - Leaderboard.tsx sayfasını oluştur.
  - Anonim cüzdan skorlarını Bento Box kartları içinde listele.

## 🟡 Sonraki Aşama (Backlog)

### 1. Interactive Onboarding (Kullanıcı Karşılama Akışı)
- Sisteme yeni kayıt olan kullanıcıları karşılayan; cüzdan bağlama, favori coinleri seçme ve AI asistanı ayarlama gibi adımları içeren çok şık bir Setup sihirbazı. (Bu özellik, tüm çekirdek özellikler bittikten sonra en son yapılmalıdır.)

### 2. Whale X-Ray (Balina Cüzdan Röntgencisi)
- Kullanıcıların herhangi bir Solana veya Ethereum cüzdan adresini yapıştırıp, o cüzdanın işlem geçmişini ve yapay zeka risk analizini şık grafiklerle (Bento Box) görebildiği bir araç.

### 3. Time-Travel Backtesting (Zaman Makinesi)
- Kullanıcıların geçmişe yönelik "Eğer 3 ay önce bu portföyü kursaydım veya AI'ı dinleseydim ne olurdu?" sorusunun cevabını gösteren animasyonlu, slider destekli bir test aracı.

---
**Tasarım Notu:** Yeni eklenecek tüm özelliklerde g-[#19191c]/80 backdrop-blur-xl border border-white/5 shadow-2xl cam efekti ve Framer Motion geçişleri kullanılması zorunludur.
