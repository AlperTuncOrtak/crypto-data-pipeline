# CryptoNeko TODO List

## Completed Recently
- [x] **MotoGame Physics Fix:** Resolved the startup crash and infinite restart loops. Implemented auto-stabilization (gyroscope physics), precise trigonometric terrain spawn alignment, velocity clamping, and adjusted terrain scaling to handle highly volatile crypto charts.

## High Priority
- [x] **Fix all localhost references:** Ensure no `localhost:3000` or `localhost:5173` links remain in production (check Supabase email confirmations, API endpoints).
- [x] **Fix Light Theme:** Overhaul the light color palette and shadows (drop-shadows instead of glow) for better contrast.

## Upcoming Ideas & Features
- [ ] **Stripe/Paywall Integration:** Implement Pro/Enterprise tier paywalls.
- [x] **Portfolio Performance Chart:** Added interactive Recharts area chart plotting total historical value of current holdings (24H/7D/30D).
- [ ] **On-Chain Transactions Feed:** Live feed of recent large swaps/whale movements.
- [ ] **Tokenomics & Unlocks Widget:** Add upcoming token unlocks to CoinDetail page.
