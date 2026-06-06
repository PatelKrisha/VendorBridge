const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[JS ERROR]: ${err.message}`);
  });

  try {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'approver@acme.com');
    await page.fill('input[type="password"]', 'Password@1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    await page.goto('http://localhost:3000/purchase-orders', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Clicking View PO Details Eye button...');
    const eyeBtn = page.locator('button[title="View PO Details"]').first();
    await eyeBtn.click();
    await page.waitForTimeout(2000);

    const isModalVisible = await page.locator('h3:has-text("Ordered items")').isVisible();
    console.log('Is PO Details modal visible?', isModalVisible);

    if (isModalVisible) {
      console.log('Closing PO Details modal...');
      await page.locator('div[class*="fixed"] button:has(svg)').first().click();
      await page.waitForTimeout(1000);
    }

    console.log('Clicking Download PO Details button...');
    const downloadBtn = page.locator('button[title="Download PO Details"]').first();
    await downloadBtn.click();
    await page.waitForTimeout(2000);

    console.log('Done.');

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
