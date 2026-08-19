import { test, expect } from '@playwright/test';

test('test portfolio', async ({ page }) => {
  const messages: string[] = [];
  page.on('console', msg => messages.push(`CONSOLE: ${msg.text()}`));
  page.on('pageerror', err => messages.push(`ERROR: ${err.message}`));
  
  await page.addInitScript(() => {
    window.localStorage.setItem('cryptoneko_disclaimer_accepted_v2', Date.now().toString());
  });

  await page.goto('http://localhost:5176/portfolio');
  
  await page.waitForSelector('button:has-text("Connect Wallet")');
  await page.getByRole('button', { name: /Connect Wallet/i }).click();
  
  await page.waitForSelector('input[placeholder*="Enter ETH Address"]');
  await page.getByPlaceholder(/Enter ETH Address/).fill('0x00000000219ab540356cBB839Cbe05303d7705Fa');
  await page.getByRole('button', { name: 'Track' }).click();
  
  await page.waitForTimeout(8000);
  console.log("MESSAGES:", messages);
});
