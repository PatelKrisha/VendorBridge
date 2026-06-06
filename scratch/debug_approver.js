const { chromium } = require('playwright');

(async () => {
  console.log('Starting debug script...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[BROWSER JS ERROR]: ${err.message}`);
  });

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    console.log('Logging in as approver...');
    await page.fill('input[type="email"]', 'approver@acme.com');
    await page.fill('input[type="password"]', 'Password@1234');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);
    console.log(`Current URL: ${page.url()}`);

    // Test Quick Actions
    console.log('\n--- Testing Quick Actions ---');
    const quickActionsCount = await page.locator('a[href="/rfqs"], a[href="/vendors"], a[href="/approvals"], a[href="/payment-ledger"]').count();
    console.log(`Quick Actions link elements found: ${quickActionsCount}`);
    
    // Let's print their outer HTML
    const htmls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.map(l => ({ text: l.innerText, href: l.getAttribute('href'), outerHTML: l.outerHTML }));
    });
    console.log('Links on page:', JSON.stringify(htmls.filter(l => l.href && (l.href.includes('rfq') || l.href.includes('vendor') || l.href.includes('approval') || l.href.includes('ledger') || l.href.includes('settings'))), null, 2));

    // Try to click "View Approvals Queue"
    const approvalsLink = page.locator('a[href="/approvals"]').first();
    if (await approvalsLink.count() > 0) {
      console.log('Clicking Approvals Queue...');
      await approvalsLink.click();
      await page.waitForTimeout(1000);
      console.log(`URL after clicking Approvals Queue: ${page.url()}`);
      await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    }

    // Try to click profile menu and settings
    console.log('\n--- Testing Profile Settings Click ---');
    await page.click('#profile-menu-button');
    await page.waitForTimeout(500);
    const settingsLink = page.locator('a[href="/settings"]').first();
    console.log(`Settings Link visible: ${await settingsLink.isVisible()}`);
    await settingsLink.click();
    await page.waitForTimeout(1000);
    console.log(`URL after clicking settings: ${page.url()}`);

    // Go to Approvals page
    console.log('\n--- Testing Approvals Page ---');
    await page.goto('http://localhost:3000/approvals', { waitUntil: 'networkidle' });
    console.log(`Approvals page URL: ${page.url()}`);
    
    // Check if approvals load
    const pendingText = await page.locator('body').innerText();
    console.log(`Contains pending approvals text: ${pendingText.includes('Pending')}`);

    // Go to Purchase Orders
    console.log('\n--- Testing Purchase Orders Actions ---');
    await page.goto('http://localhost:3000/purchase-orders', { waitUntil: 'networkidle' });
    console.log(`PO URL: ${page.url()}`);
    
    // List elements in table row
    const actionButtons = await page.locator('tbody tr button').count();
    console.log(`Action buttons in table: ${actionButtons}`);
    
  } catch (err) {
    console.error('Debug script failed:', err);
  } finally {
    await browser.close();
    console.log('Done.');
  }
})();
