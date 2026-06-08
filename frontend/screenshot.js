import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\trexg\\.gemini\\antigravity\\brain\\f8565669-bf74-4995-9652-c765a63fc5aa';
const BASE_URL = 'http://localhost:4180';

const PAGES = [
  { url: '/', name: 'final_landing' },
  { url: '/pricing', name: 'final_pricing' },
];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });

  for (const p of PAGES) {
    try {
      console.log(`Screenshotting ${p.url}...`);
      await page.goto(BASE_URL + p.url, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `mobile_${p.name}.png`), fullPage: true });
      console.log(`Done: mobile_${p.name}.png`);
    } catch(e) {
      console.error(`Error on ${p.url}:`, e.message);
    }
  }
  await browser.close();
  console.log('All done!');
})();
