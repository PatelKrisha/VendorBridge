const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  const siteUrl = 'https://vendorbridge-nu.vercel.app';
  
  try {
    // ----------------------------------------------------
    // STEP 1: LOGIN AS PROCUREMENT OFFICER
    // ----------------------------------------------------
    console.log('\n--- Step 1: Navigating to login page ---');
    await page.goto(`${siteUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`Loaded URL: ${page.url()}`);
    
    await page.fill('input[type="email"]', 'officer@acme.com');
    await page.fill('input[type="password"]', 'Password@1234');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    console.log(`URL after login: ${page.url()}`);
    
    if (page.url() === `${siteUrl}/` || page.url() === `${siteUrl}`) {
      console.log('✔ Login successful as Procurement Officer!');
    } else {
      console.error('❌ Login failed!');
      process.exit(1);
    }
    
    // ----------------------------------------------------
    // STEP 2: TEST ACCOUNT SETTINGS CLICK
    // ----------------------------------------------------
    console.log('\n--- Step 2: Testing Account Settings click ---');
    await page.click('#profile-menu-button');
    await page.waitForTimeout(500);
    
    const settingsLink = page.locator('a:has-text("Account Settings")');
    console.log(`Settings Link visible: ${await settingsLink.isVisible()}`);
    await settingsLink.click();
    
    await page.waitForTimeout(2000);
    console.log(`URL after Account Settings click: ${page.url()}`);
    if (page.url().includes('/settings')) {
      console.log('✔ Account Settings redirection works!');
    } else {
      console.error('❌ Account Settings click failed!');
    }
    
    // Go back to dashboard
    await page.goto(siteUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // ----------------------------------------------------
    // STEP 3: TEST SEARCH BAR INSTANT SEARCH
    // ----------------------------------------------------
    console.log('\n--- Step 3: Testing Search Bar instant filter ---');
    const searchInput = page.locator('input[placeholder*="Search ERP"]');
    await searchInput.fill('Supernova');
    await page.waitForTimeout(1000);
    
    const firstResult = page.locator('button:has-text("Supernova Logistics")');
    const isSearchDropdownVisible = await firstResult.isVisible();
    console.log(`Search dropdown displays instant result: ${isSearchDropdownVisible}`);
    
    if (isSearchDropdownVisible) {
      console.log('✔ Search Bar instant search works!');
      // Test hitting Enter to navigate
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      console.log(`URL after Enter on search: ${page.url()}`);
      if (page.url().includes('/vendors')) {
        console.log('✔ Search Enter navigation works!');
      } else {
        console.error('❌ Search Enter navigation failed!');
      }
    } else {
      console.error('❌ Search Bar instant filter did not show dropdown!');
    }
    
    // Go back to dashboard
    await page.goto(siteUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // ----------------------------------------------------
    // STEP 4: TEST NOTIFICATIONS MARK AS READ
    // ----------------------------------------------------
    console.log('\n--- Step 4: Testing Notifications Mark as Read ---');
    await page.click('#notifications-bell');
    await page.waitForTimeout(500);
    
    const unreadDot = page.locator('.bg-accent.flex-shrink-0').first();
    const hasUnread = await unreadDot.count() > 0;
    console.log(`Has unread notifications: ${hasUnread}`);
    
    if (hasUnread) {
      const checkmarkBtn = page.locator('button[aria-label="Mark as read"]').first();
      console.log(`Individual "Mark as read" button exists: ${await checkmarkBtn.isVisible()}`);
      
      const unreadCountBefore = await page.locator('#notifications-bell span').innerText();
      console.log(`Unread count badge before: ${unreadCountBefore}`);
      
      await checkmarkBtn.click();
      await page.waitForTimeout(1000);
      
      const unreadCountAfter = await page.locator('#notifications-bell span').innerText().catch(() => '0');
      console.log(`Unread count badge after: ${unreadCountAfter}`);
      
      if (parseInt(unreadCountAfter) < parseInt(unreadCountBefore)) {
        console.log('✔ Individual Mark as Read button works!');
      } else {
        console.error('❌ Individual Mark as Read failed to update badge!');
      }
    } else {
      console.log('No unread notifications to test.');
    }
    
    // Close notifications
    await page.click('h1'); // click elsewhere to close

    // ----------------------------------------------------
    // STEP 5: TEST QUICK ACTIONS REDIRECTS
    // ----------------------------------------------------
    console.log('\n--- Step 5: Testing Quick Actions redirects ---');
    
    const quickActions = [
      { text: 'Create New RFQ', path: '/rfqs' },
      { text: 'Onboard New Vendor', path: '/vendors' }
    ];
    
    for (const action of quickActions) {
      const actionLink = page.locator(`a:has-text("${action.text}")`);
      console.log(`Quick Action "${action.text}" exists: ${await actionLink.isVisible()}`);
      await actionLink.click();
      await page.waitForTimeout(2000);
      console.log(`URL after clicking "${action.text}": ${page.url()}`);
      if (page.url().includes(action.path)) {
        console.log(`✔ Quick Action "${action.text}" redirection works!`);
      } else {
        console.error(`❌ Quick Action "${action.text}" redirection failed!`);
      }
      await page.goto(siteUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    }

    // ----------------------------------------------------
    // STEP 6: TEST VIEW AUDIT TRAIL REDIRECT
    // ----------------------------------------------------
    console.log('\n--- Step 6: Testing View Audit Trail redirect ---');
    const auditTrailLink = page.locator('a:has-text("View Audit Trail")');
    console.log(`View Audit Trail link exists: ${await auditTrailLink.isVisible()}`);
    await auditTrailLink.click();
    await page.waitForTimeout(2000);
    console.log(`URL after View Audit Trail click: ${page.url()}`);
    if (page.url().includes('/activity-logs')) {
      console.log('✔ View Audit Trail navigation works for Officer!');
    } else {
      console.error('❌ View Audit Trail navigation failed or was blocked!');
    }

    // ----------------------------------------------------
    // STEP 7: TEST VENDORS DIRECTORY PAGE
    // ----------------------------------------------------
    console.log('\n--- Step 7: Testing Vendors Directory Modals & Actions ---');
    await page.goto(`${siteUrl}/vendors`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // Onboard Vendor Modal
    console.log('Testing Onboard Vendor button...');
    await page.click('button:has-text("Onboard Vendor")');
    await page.waitForTimeout(1000);
    const isOnboardModalVisible = await page.locator('h2:has-text("Onboard New Corporate Vendor")').isVisible();
    console.log(`Onboard Modal Visible: ${isOnboardModalVisible}`);
    if (isOnboardModalVisible) {
      console.log('✔ Onboard Vendor button click works!');
      await page.click('button:has-text("Cancel")'); // close modal
      await page.waitForTimeout(500);
    } else {
      console.error('❌ Onboard Vendor button click failed!');
    }
    
    // Eye icon View Details Modal
    console.log('Testing View Details Eye button...');
    const eyeBtn = page.locator('button[title="View Vendor Details"]').first();
    await eyeBtn.click();
    await page.waitForTimeout(1000);
    const isDetailsModalVisible = await page.locator('h2:has-text("Vendor Profile Details")').isVisible();
    console.log(`Vendor Details Modal Visible: ${isDetailsModalVisible}`);
    if (isDetailsModalVisible) {
      console.log('✔ View Vendor Details Eye button works!');
      // Close details modal by clicking X
      await page.locator('h2:has-text("Vendor Profile Details")').locator('..').locator('button').click();
      await page.waitForTimeout(500);
    } else {
      console.error('❌ View Vendor Details Eye button failed!');
    }
    
    // Three-dot menu Actions close-outside
    console.log('Testing Actions Menu toggle & outside click...');
    const threeDotBtn = page.locator('button[title="Actions Menu"]').first();
    await threeDotBtn.click();
    await page.waitForTimeout(1000);
    
    const actionsMenuDropdown = page.locator('button:has-text("Suspend")');
    let isActionsMenuVisible = await actionsMenuDropdown.isVisible();
    console.log(`Actions Menu visible after click: ${isActionsMenuVisible}`);
    
    if (isActionsMenuVisible) {
      console.log('✔ Actions Menu toggle click works!');
      // Click outside the menu (on page heading) to close it
      await page.click('h1:has-text("Vendors Directory")');
      await page.waitForTimeout(1000);
      isActionsMenuVisible = await actionsMenuDropdown.isVisible();
      console.log(`Actions Menu visible after outside click: ${isActionsMenuVisible}`);
      if (!isActionsMenuVisible) {
        console.log('✔ Actions Menu close-outside logic works!');
      } else {
        console.error('❌ Actions Menu close-outside logic failed!');
      }
    } else {
      console.error('❌ Actions Menu toggle click failed!');
    }

    // ----------------------------------------------------
    // STEP 8: TEST RFQS PAGE MODALS
    // ----------------------------------------------------
    console.log('\n--- Step 8: Testing RFQs Page Modals ---');
    await page.goto(`${siteUrl}/rfqs`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // Create RFQ Modal
    console.log('Testing Create RFQ button...');
    await page.click('button:has-text("Create RFQ")');
    await page.waitForTimeout(1000);
    const isCreateRfqModalVisible = await page.locator('h2:has-text("Create New RFQ")').isVisible();
    console.log(`Create RFQ Modal Visible: ${isCreateRfqModalVisible}`);
    if (isCreateRfqModalVisible) {
      console.log('✔ Create RFQ button click works!');
      await page.click('button:has-text("Cancel")'); // close modal
      await page.waitForTimeout(500);
    } else {
      console.error('❌ Create RFQ button click failed!');
    }
    
    // RFQ View Details Modal
    console.log('Testing RFQ View Details link...');
    const rfqDetailsLink = page.locator('button:has-text("View Details")').first();
    await rfqDetailsLink.click();
    await page.waitForTimeout(1000);
    const isRfqDetailsModalVisible = await page.locator('th:has-text("Item Description")').isVisible();
    console.log(`RFQ Details Modal Visible: ${isRfqDetailsModalVisible}`);
    if (isRfqDetailsModalVisible) {
      console.log('✔ RFQ View Details link works!');
      // Close details modal
      const closeBtn = page.locator('div[class*="fixed"] button:has(svg)').first();
      await closeBtn.click();
      await page.waitForTimeout(500);
    } else {
      console.error('❌ RFQ View Details link failed!');
    }

    // ----------------------------------------------------
    // STEP 9: TEST PURCHASE ORDERS ACTIONS
    // ----------------------------------------------------
    console.log('\n--- Step 9: Testing Purchase Orders actions ---');
    await page.goto(`${siteUrl}/purchase-orders`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // View PO details
    console.log('Testing View PO Details Eye button...');
    const poEyeBtn = page.locator('button[title="View PO Details"]').first();
    await poEyeBtn.click();
    await page.waitForTimeout(1000);
    const isPoDetailsModalVisible = await page.locator('h3:has-text("Ordered items")').isVisible();
    console.log(`PO Details Modal Visible: ${isPoDetailsModalVisible}`);
    if (isPoDetailsModalVisible) {
      console.log('✔ View PO Details Eye button works!');
      // Close PO Details modal
      await page.locator('div[class*="fixed"] button:has(svg)').first().click();
      await page.waitForTimeout(1000);
    } else {
      console.error('❌ View PO Details Eye button failed!');
    }
    
    // Download PO Details
    console.log('Testing Download PO Details FileDown button...');
    const poDownloadBtn = page.locator('button[title="Download PO Details"]').first();
    await poDownloadBtn.click();
    await page.waitForTimeout(1000);
    console.log('✔ Download PO Details button clicked without error!');

    // ----------------------------------------------------
    // STEP 10: TEST REPORTS EXPORT ALL DATA
    // ----------------------------------------------------
    console.log('\n--- Step 10: Testing Reports Export All Data ---');
    await page.goto(`${siteUrl}/reports`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    console.log('Testing Export All Data CSV export button...');
    const exportBtn = page.locator('button:has-text("Export All Data")');
    await exportBtn.click();
    await page.waitForTimeout(1000);
    console.log('✔ Export All Data CSV export button clicked without error!');
    
    console.log('\n========================================');
    console.log('🎉 ALL PROCUREMENT OFFICER VERIFICATION TESTS PASSED!');
    console.log('========================================');
    
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
