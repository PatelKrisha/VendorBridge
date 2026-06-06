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

    // Clear decisions before test
    await page.evaluate(() => {
      localStorage.removeItem('vendorbridge_approval_decisions');
    });
    await page.reload({ waitUntil: 'networkidle' });

    console.log('--- Initial Pending approvals ---');
    console.log(await page.evaluate(() => {
      return Array.from(document.querySelectorAll('main > div > div')).map(el => el.innerText.substring(0, 100));
    }));

    console.log('Clicking first Approve...');
    await page.locator('main button:has-text("Approve")').first().click();
    await page.waitForTimeout(2000);

    console.log('--- After Click Pending approvals ---');
    const content = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('main > div > div')).map(el => ({
        text: el.innerText.substring(0, 150),
        className: el.className
      }));
    });
    console.log(JSON.stringify(content, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
