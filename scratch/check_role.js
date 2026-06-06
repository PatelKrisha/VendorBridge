const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'approver@acme.com');
    await page.fill('input[type="password"]', 'Password@1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const roleText = await page.locator('aside').innerText();
    console.log('Sidebar text:\n', roleText);

    const bodyText = await page.locator('body').innerText();
    console.log('Is Aishwarya Nair present?', bodyText.includes('Aishwarya Nair'));
    console.log('Is Priya Mehta present?', bodyText.includes('Priya Mehta'));

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
