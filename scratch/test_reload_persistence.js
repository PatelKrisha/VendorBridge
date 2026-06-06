const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE]: ${msg.text()}`);
  });

  try {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'approver@acme.com');
    await page.fill('input[type="password"]', 'Password@1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    await page.goto('http://localhost:3000/approvals', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Clear decisions and set a test decision directly
    await page.evaluate(() => {
      localStorage.setItem('vendorbridge_approval_decisions', JSON.stringify({
        "1": { action: "APPROVED", actedAt: new Date().toISOString() }
      }));
    });

    console.log('Set decision in localStorage. Reloading page...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const storage = await page.evaluate(() => {
      return localStorage.getItem('vendorbridge_approval_decisions');
    });
    console.log('localStorage after reload:', storage);

    const bodyText = await page.locator('body').innerText();
    console.log('Is RFQ-2026-000001 still in pending list?', bodyText.includes('RFQ-2026-000001') && !bodyText.includes('Actioned'));
    console.log('Is RFQ-2026-000001 under Actioned?', bodyText.includes('Actioned') && bodyText.includes('Supernova Logistics'));

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
