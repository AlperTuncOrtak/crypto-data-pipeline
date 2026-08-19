const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2', timeout: 10000 }).catch(e => console.log('Goto error:', e));
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
