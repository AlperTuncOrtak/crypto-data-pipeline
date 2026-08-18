# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-wallet.spec.ts >> test portfolio
- Location: test-wallet.spec.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[placeholder*="Enter ETH Address"]') to be visible

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e8] [cursor=pointer]:
          - generic [ref=e11]: Crypto
          - generic:
            - generic: Analytics
          - generic [ref=e13]: Neko
        - button "Collapse Sidebar" [ref=e14]:
          - img [ref=e15]
      - button "Search anything ⌘ K" [ref=e19]:
        - img [ref=e20]
        - generic [ref=e23]: Search anything
        - generic [ref=e24]:
          - generic [ref=e25]: ⌘
          - generic [ref=e26]: K
      - generic [ref=e27]:
        - generic [ref=e28]:
          - heading "MAIN NAVIGATION" [level=3] [ref=e29]
          - generic [ref=e30]:
            - link "Overview" [ref=e32] [cursor=pointer]:
              - /url: /dashboard
              - img [ref=e33]
              - generic [ref=e38]: Overview
            - link "Swap" [ref=e40] [cursor=pointer]:
              - /url: /swap
              - img [ref=e41]
              - generic [ref=e44]: Swap
            - link "Portfolio" [ref=e46] [cursor=pointer]:
              - /url: /portfolio
              - img [ref=e47]
              - generic [ref=e49]: Portfolio
        - generic [ref=e50]:
          - heading "ANALYTICS & INSIGHTS" [level=3] [ref=e51]
          - generic [ref=e52]:
            - link "Market Data" [ref=e54] [cursor=pointer]:
              - /url: /market
              - img [ref=e55]
              - generic [ref=e56]: Market Data
            - link "AI Analysis" [ref=e58] [cursor=pointer]:
              - /url: /analysis
              - img [ref=e59]
              - generic [ref=e67]: AI Analysis
            - link "TV Analyst" [ref=e69] [cursor=pointer]:
              - /url: /tv-analyst
              - img [ref=e70]
              - generic [ref=e72]: TV Analyst
            - link "Whale X-Ray" [ref=e74] [cursor=pointer]:
              - /url: /whale
              - img [ref=e75]
              - generic [ref=e77]: Whale X-Ray
            - link "Heatmap" [ref=e79] [cursor=pointer]:
              - /url: /heatmap
              - img [ref=e80]
              - generic [ref=e82]: Heatmap
            - link "Time Machine" [ref=e84] [cursor=pointer]:
              - /url: /timemachine
              - img [ref=e85]
              - generic [ref=e88]: Time Machine
      - generic [ref=e89]:
        - heading "SUPPORT" [level=3] [ref=e90]
        - generic [ref=e91]:
          - link "Alerts" [ref=e93] [cursor=pointer]:
            - /url: /alerts
            - img [ref=e94]
            - generic [ref=e97]: Alerts
          - link "Leaderboard" [ref=e99] [cursor=pointer]:
            - /url: /leaderboard
            - img [ref=e100]
            - generic [ref=e105]: Leaderboard
          - link "Help & Support" [ref=e107] [cursor=pointer]:
            - /url: /support
            - img [ref=e108]
            - generic [ref=e111]: Help & Support
          - link "Settings" [ref=e113] [cursor=pointer]:
            - /url: /settings
            - img [ref=e114]
            - generic [ref=e117]: Settings
          - link "Contact Me" [ref=e119] [cursor=pointer]:
            - /url: mailto:support@cryptoneko.com
            - img [ref=e120]
            - generic [ref=e122]: Contact Me
      - generic "Local Dev" [ref=e124] [cursor=pointer]:
        - generic [ref=e125]: L
        - generic [ref=e126]:
          - paragraph [ref=e127]: Local Dev
          - paragraph [ref=e128]: dev@localhost
        - generic [ref=e129]:
          - button "Toggle Theme" [ref=e130]:
            - img [ref=e131]
          - button "Sign Out" [ref=e137]:
            - img [ref=e138]
    - generic [ref=e141]:
      - generic [ref=e142]:
        - generic [ref=e144]:
          - generic [ref=e145]: Overview
          - generic [ref=e146]: /
          - generic [ref=e147]: Portfolio
        - generic [ref=e148]:
          - button "Connect Wallet" [ref=e151] [cursor=pointer]
          - generic [ref=e152]:
            - button [ref=e153]:
              - img [ref=e154]
            - button [ref=e161]:
              - img [ref=e162]
            - button [ref=e167]:
              - img [ref=e168]
      - main [ref=e171]:
        - generic [ref=e174]:
          - generic [ref=e175]:
            - generic [ref=e176]:
              - heading "Total Portfolio Value" [level=1] [ref=e177]
              - paragraph [ref=e178]: Real-time balance tracking for your connected Web3 wallets. DeFi, NFTs, and Cross-chain support coming soon.
            - generic [ref=e179]:
              - button "AI Rebalance" [ref=e180]:
                - img [ref=e181]
                - text: AI Rebalance
              - button "Connect Wallet" [ref=e189]:
                - img [ref=e190]
                - text: Connect Wallet
          - generic [ref=e191]:
            - button "Overview" [ref=e192]
            - button "DeFi Swap" [ref=e193]
          - generic [ref=e195]:
            - generic [ref=e196]:
              - generic [ref=e197]:
                - generic [ref=e198]:
                  - generic [ref=e199]:
                    - generic [ref=e200]: Total equity
                    - generic [ref=e201]: $0.00
                  - img [ref=e205]
                - generic [ref=e208]:
                  - generic [ref=e209]:
                    - generic [ref=e210]: 24H Change
                    - generic [ref=e211]: +$0.00
                  - generic [ref=e212]:
                    - generic [ref=e213]: 24H %
                    - generic [ref=e214]: +0.00%
                  - generic [ref=e215]:
                    - generic [ref=e216]: Status
                    - generic [ref=e217]: Bullish
              - generic [ref=e219]: Allocation
              - generic [ref=e221]:
                - generic [ref=e222]: Stablecoins
                - generic [ref=e223]:
                  - generic [ref=e224]: Buying power
                  - generic [ref=e225]: $0.00
                - generic [ref=e226]:
                  - button "Deposit" [ref=e227]:
                    - img [ref=e228]
                    - text: Deposit
                  - button "Withdraw" [ref=e231]:
                    - img [ref=e232]
                    - text: Withdraw
            - generic [ref=e235]:
              - generic [ref=e236]:
                - generic [ref=e237]:
                  - heading "Cumulative return" [level=3] [ref=e238]
                  - generic [ref=e239]:
                    - generic [ref=e240]:
                      - generic [ref=e241]: Portfolio (24H)
                      - generic [ref=e243]: +0.00%
                    - generic [ref=e244]:
                      - generic [ref=e245]: BTC
                      - generic [ref=e247]: "-0.33%"
                    - generic [ref=e248]:
                      - generic [ref=e249]: ETH
                      - generic [ref=e251]: "-4.27%"
                - img [ref=e255]
              - generic [ref=e259]:
                - button "Watchlist" [ref=e260] [cursor=pointer]
                - button "Trending" [ref=e261] [cursor=pointer]
                - button "Top Gainers" [ref=e262] [cursor=pointer]
        - generic [ref=e266]:
          - generic [ref=e267] [cursor=pointer]:
            - generic [ref=e268]: "N"
            - generic [ref=e269]: CryptoNeko
          - generic [ref=e270]:
            - link "Documentation" [ref=e271] [cursor=pointer]:
              - /url: /docs
            - link "API" [ref=e272] [cursor=pointer]:
              - /url: https://api.cryptoneko.online/docs
            - link "Terms of Service" [ref=e273] [cursor=pointer]:
              - /url: /terms
            - link "Privacy Policy" [ref=e274] [cursor=pointer]:
              - /url: /privacy
          - generic [ref=e275]:
            - generic [ref=e276]:
              - link "X (Twitter)" [ref=e277] [cursor=pointer]:
                - /url: "#"
                - img [ref=e278]
              - link "Discord" [ref=e281] [cursor=pointer]:
                - /url: "#"
                - img [ref=e282]
              - link "GitHub" [ref=e289] [cursor=pointer]:
                - /url: https://github.com/AlperTuncOrtak
                - img [ref=e290]
            - generic [ref=e292]: © 2026 CryptoNeko. All rights reserved.
    - button [ref=e293]:
      - img [ref=e294]
    - region "Notifications alt+T"
  - dialog "Connect a Wallet" [ref=e302]:
    - document [active] [ref=e303]:
      - generic [ref=e307]:
        - generic [ref=e308]:
          - heading "Connect a Wallet" [level=1] [ref=e311]
          - generic [ref=e312]:
            - generic [ref=e314]: Popular
            - generic [ref=e315]:
              - button "Rainbow" [ref=e317] [cursor=pointer]:
                - generic [ref=e319]:
                  - img [ref=e320]:
                    - img [ref=e321]
                  - generic [ref=e324]: Rainbow
              - button "Base" [ref=e326] [cursor=pointer]:
                - generic [ref=e328]:
                  - img [ref=e329]:
                    - img [ref=e330]
                  - generic [ref=e333]: Base
              - button "MetaMask" [ref=e335] [cursor=pointer]:
                - generic [ref=e337]:
                  - img [ref=e338]:
                    - img [ref=e339]
                  - generic [ref=e342]: MetaMask
              - button "WalletConnect" [ref=e344] [cursor=pointer]:
                - generic [ref=e346]:
                  - img [ref=e347]:
                    - img [ref=e348]
                  - generic [ref=e351]: WalletConnect
        - generic [ref=e353]:
          - button "Close" [ref=e355] [cursor=pointer]:
            - img [ref=e356]
          - generic [ref=e360]:
            - generic [ref=e362]: What is a Wallet?
            - generic [ref=e363]:
              - generic [ref=e364]:
                - img [ref=e366]:
                  - img [ref=e367]
                - generic [ref=e368]:
                  - generic [ref=e369]: A Home for your Digital Assets
                  - generic [ref=e370]: Wallets are used to send, receive, store, and display digital assets like Ethereum and NFTs.
              - generic [ref=e371]:
                - img [ref=e373]:
                  - img [ref=e374]
                - generic [ref=e375]:
                  - generic [ref=e376]: A New Way to Log In
                  - generic [ref=e377]: Instead of creating new accounts and passwords on every website, just connect your wallet.
            - generic [ref=e378]:
              - button "Get a Wallet" [ref=e379] [cursor=pointer]:
                - generic [ref=e380]: Get a Wallet
              - link "Learn More" [ref=e381] [cursor=pointer]:
                - /url: https://learn.rainbow.me/understanding-web3?utm_source=rainbowkit&utm_campaign=learnmore
                - generic [ref=e382]: Learn More
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('test portfolio', async ({ page }) => {
  4  |   const messages: string[] = [];
  5  |   page.on('console', msg => messages.push(`CONSOLE: ${msg.text()}`));
  6  |   page.on('pageerror', err => messages.push(`ERROR: ${err.message}`));
  7  |   
  8  |   await page.addInitScript(() => {
  9  |     window.localStorage.setItem('cryptoneko_disclaimer_accepted_v2', Date.now().toString());
  10 |   });
  11 | 
  12 |   await page.goto('http://localhost:5176/portfolio');
  13 |   
  14 |   await page.waitForSelector('button:has-text("Connect Wallet")');
  15 |   await page.getByRole('button', { name: /Connect Wallet/i }).click();
  16 |   
> 17 |   await page.waitForSelector('input[placeholder*="Enter ETH Address"]');
     |              ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  18 |   await page.getByPlaceholder(/Enter ETH Address/).fill('0x00000000219ab540356cBB839Cbe05303d7705Fa');
  19 |   await page.getByRole('button', { name: 'Track' }).click();
  20 |   
  21 |   await page.waitForTimeout(8000);
  22 |   console.log("MESSAGES:", messages);
  23 | });
  24 | 
```