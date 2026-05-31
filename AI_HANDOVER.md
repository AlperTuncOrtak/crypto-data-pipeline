# Crypto Data Pipeline - AI Handover Guide

Merhaba! Ben Antigravity. Bu proje üzerinde benimle veya başka bir geliştirici AI (Cursor, Copilot, ChatGPT vb.) ile çalışacaksan, projeyi hızlıca kavrayıp doğrudan katkı sağlaman için gereken tüm bilgileri aşağıda özetliyorum.

## 🏗️ Proje Mimarisi ve Teknoloji Yığını (Tech Stack)

Bu proje, kripto para yatırımcıları için bir portföy yönetimi ve yapay zeka destekli piyasa analizi (AI Pulse) platformudur.

*   **Frontend (İstemci):** React (Vite tabanlı), TailwindCSS, Recharts, RainbowKit + Wagmi (Web3 Cüzdan bağlantıları için).
    *   *Tasarım Dili:* "Soft Web3" (Aave, Uniswap tarzı). Klasik sert kenarlı, katı kutular yerine yumuşak geçişler (transition-all), saydamlık (`bg-white/[0.02]`), blur efektleri (`backdrop-blur-xl`) ve renkli glow/gölge detayları kullanılır. Arayüzde `Portfolio.jsx` sayfasını inceleyerek temel "SoftCard" kullanımını görebilirsin.
    *   *Canlı Ortam:* Vercel üzerinde host ediliyor.
*   **Backend (Sunucu):** Python (FastAPI).
    *   *Önemli Not:* Backend şu anda **sadece lokalde** (`http://localhost:8000`) çalışıyor. Vercel üzerinde canlıya alınmış bir backend yok. AI Pulse uç noktaları buradan servis ediliyor.
*   **Veritabanı ve Auth:** Supabase. Kullanıcı oturum açma işlemleri (Auth) ve portföy/trade geçmişi (PostgreSQL) burada tutuluyor.

---

## 📂 Dizin Yapısı ve Önemli Dosyalar

```text
crypto-data-pipeline/
├── backend/                  # FastAPI Sunucusu
│   ├── main.py               # API endpointleri (AI Pulse vb.)
│   ├── requirements.txt      # Python bağımlılıkları
│   └── ...
├── frontend/                 # React (Vite) Uygulaması
│   ├── src/
│   │   ├── api/client.js     # Axios instance (Lokal 8000 portuna ayarlı)
│   │   ├── components/       # UI bileşenleri (Navbar vb.)
│   │   ├── pages/            # Sayfalar (Portfolio.jsx çok kritik, baştan yazıldı)
│   │   ├── hooks/            # useAuth, useMarket vb. custom hook'lar
│   │   └── index.css         # Global stiller ve temel Tailwind ayarları
│   ├── package.json          # Node bağımlılıkları
│   ├── tailwind.config.js    # Tailwind konfigürasyonu
│   └── vercel.json           # Vercel SPA routing ve build ayarları
└── todo.md                   # Proje içi teknik borç, planlamalar ve yapılacaklar
```

---

## 🚀 Projeyi Nasıl Çalıştırırsın?

Geliştirme yaparken (özellikle backend gereken işler için) her iki ortamı da ayağa kaldırmalısın.

### 1. Frontend'i Çalıştırmak
```bash
cd frontend
npm install
npm run dev
```
Uygulama `http://localhost:5173` adresinde çalışacaktır. Vite tabanlı olduğu için HMR (Hot Module Replacement) çok hızlıdır.

### 2. Backend'i Çalıştırmak (AI Pulse, Analizler vb. için)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
API, `http://localhost:8000` portunda çalışacaktır. 

---

## ⚠️ Dikkat Edilmesi Gereken Kritik Noktalar

1.  **Backend Deployment Engeli (CORS/URL):** Frontend Vercel'de yayınlanıyor ancak backend hala sadece `localhost`'ta. Bu yüzden Vercel üzerindeki canlı (production) siteden AI Pulse gibi özellikler çağrıldığında backend'e ulaşılamaz. Kullanıcı (USER) backend'i uzak bir sunucuya (Render, Railway vb.) taşıyana kadar Vercel üzerindeki API yönlendirmelerine (`vite api url` vb.) **dokunmuyoruz**. "Dokunmadan geçelim" kararı alındı.
2.  **Portfolio.jsx Tasarımı:** Portfolio sayfası önceden 3000 satırlık, inline CSS (`style={{...}}`) dolu, karmaşık bir yapıydı. Yakın zamanda bunu tamamen yıktık ve `SoftCard` yapısıyla 200 satırlık temiz Tailwind class'larına (`className="..."`) dönüştürdük. Buraya eklenecek yeni UI parçalarında kesinlikle eski inline-style yapısını kullanma.
3.  **State ve Senkronizasyon:** Portföy CSV yüklemeleri ve borsa (Binance) key'leri anlık tepki verebilmesi için önce `localStorage`'da tutuluyor, arka planda ise Supabase ile eşitleniyor.
4.  **Stripe/Pro Entegrasyonu (Work In Progress):** Başka bir takım arkadaşı (Alper) şu sıralar repo üzerinde Stripe entegrasyonu kodluyor. Senin yapacağın branch değişikliklerinde veya pull komutlarında olası `merge conflict`'lere dikkat etmelisin.

---

## 💡 Planlanan Sonraki Geliştirmeler

*   **Açık Tema (Light Theme) Düzeltmesi:** Tema geçişi (dark/light) bozuk. Sistem koyu temaya (`#0D111C`) göre kodlandığı için, light mod'da yazılar okunmuyor. Açık temanın Tailwind (`dark:` veya CSS variables) ile baştan ayarlanması veya şimdilik tamamen devre dışı bırakılması gerekiyor.
*   **Whale Alerts (Balina Hareketleri):** Projede planlanmış, `todo.md`'de yer alan ama önceliği şimdilik düşük olan bir özellik.

İyi kodlamalar! 🚀
