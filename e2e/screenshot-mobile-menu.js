const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3099');
  await page.waitForLoadState('networkidle');
  
  // Click hamburger
  await page.click('button[aria-label="Toggle menu"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'e2e/screenshots/mobile-menu-open.png' });
  
  // Click again to close
  await page.click('button[aria-label="Toggle menu"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'e2e/screenshots/mobile-menu-closed.png' });
  
  await browser.close();
  console.log('Done');
})();
