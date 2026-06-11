# CryptoNeko TODO List

## High Priority
- [ ] **Fix all localhost references:** There are multiple places (such as the Supabase Email confirmation link, API endpoints, or hardcoded URLs) that still point to `localhost:3000` or `localhost:5173`. All of these must be found and replaced with the production URL (`https://www.cryptoneko.online/`) or environment variables. This includes updating the Supabase Dashboard under Authentication -> URL Configuration -> Site URL & Redirect URLs to `https://www.cryptoneko.online/`.
- [ ] **Fix Light Theme:** The current light mode aesthetics are broken/poor compared to the deep dark mode. Need to overhaul the light color palette, adjust shadows (drop-shadows instead of glow), and fix contrast issues across all cards and navbar.

## UI & Design Tasks
- [ ] **Theme & Colors:** Deal with light and dark themes, decide on a primary page theme color, and apply it consistently. (açık/koyu tema, sayfa tema rengi)
- [ ] **General UI Fixes:** General improvements and fixes to the interface. (arayüzü düzelt)
- [ ] **Fix Warning Message:** Fix the display/styling of the current warning message. (uyarıyı düzelt)
- [ ] **Login Button:** Fix the login button design and interactions. (login butonunu düzelt)
- [ ] **Footer Warning:** Add a small warning message back into the footer. (footera küçük uyarı ekle)

## Upcoming Ideas & Features
- [ ] **Stripe/Paywall Integration:** Implement the planned Pro/Enterprise tier paywalls for advanced AI analysis and alerts.
- [ ] **Portfolio Performance Chart:** Add a historical performance chart (like Zerion's beautiful line charts) to the Portfolio page.
- [ ] **On-Chain Transactions Feed:** Show a live feed of recent large swaps/whale movements using a sleek, bento-box design.
- [ ] **Tokenomics & Unlocks Widget:** Add a section in the CoinDetail page to track upcoming token unlocks (visualized with a progress bar).
