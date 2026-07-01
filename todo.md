# CryptoNeko TODO List

## Completed Recently

## High Priority
- [x] **Fix all localhost references:** Ensure no `localhost:3000` or `localhost:5173` links remain in production (check Supabase email confirmations, API endpoints).
- [ ] **Fix Light Theme:** Overhaul the light color palette and shadows (drop-shadows instead of glow) for better contrast.
- [ ] **Fix Pricing Page Bugs:** The Pricing tab keeps resetting automatically and the 'year' toggle is unclickable. The design also needs to be tweaked to seamlessly match the current global aesthetic.

## Upcoming Ideas & Features
- [ ] **Stripe/Paywall Integration:** Implement Pro/Enterprise tier paywalls.
- [x] **Portfolio Performance Chart:** Added interactive Recharts area chart plotting total historical value of current holdings (24H/7D/30D).
- [ ] **On-Chain Transactions Feed:** Live feed of recent large swaps/whale movements.
- [x] **Tokenomics & Unlocks Widget:** Add upcoming token unlocks to CoinDetail page.

## UI/UX Overhaul Roadmap
- [x] **Dashboard:** Premium Bento Box arayüzü eklendi, framer-motion ve NumberFlow kuruldu.
- [ ] **Market:** Liste tasarimlari, filtreler ve genel sayfa yapisi premium hisse gore bastan tasarlanacak.
- [ ] **Portfolio:** Varlik kutulari ve grafikler goz yormayan, ultra-premium duzene gecirilecek.
- [ ] **Alerts:** Eski uyari sayfalari ve pop-up'lar yeni sade/siyah estetigine uygun olacak sekilde yeniden yapilacak.
- [ ] **Analysis:** AI destekli analiz sayfasi, CoinDetail kalitesinde surukleyici bir deneyime donusturulecek.

## Modern Tech Stack Integration Roadmap
- [ ] **PostHog Integration:** Kullanıcı hareketlerini, tıklama dönüşümlerini ve A/B testlerini izlemek için PostHog'u React frontend'e entegre et.
- [ ] **Resend Email Service:** "Hoş geldin", "Abonelik Onayı" ve "Fiyat Alarmları (Alerts)" e-postaları için Resend (React Email ile) altyapısını kur.
- [ ] **Sentry Error Tracking:** Üretim ortamında (production) oluşacak frontend ve backend hatalarını anında yakalamak için Sentry yapılandırmasını ekle.
- [ ] **Upstash (Redis):** Kripto API istek limitlerini aşmamak ve platform hızını artırmak için Upstash ile rate-limiting/caching stratejisi oluştur (İhtiyaç halinde).
