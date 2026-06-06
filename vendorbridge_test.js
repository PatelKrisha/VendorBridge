const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  // Collect console messages and errors
  const consoleMessages = [];
  const jsErrors = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    if (type === 'error' || type === 'warning') {
      console.log(`[CONSOLE ${type.toUpperCase()}]: ${text}`);
    }
  });
  
  page.on('pageerror', err => {
    jsErrors.push(err.message);
    console.log(`[PAGE ERROR]: ${err.message}`);
  });

  const results = {
    login: { success: false, error: null, redirectedTo: null },
    quickActions: {},
    notificationBell: { opens: false, error: null },
    kpiCards: {},
    consoleErrors: [],
    consoleWarnings: [],
    allConsoleMessages: []
  };

  try {
    console.log('\n=== STEP 1: Navigate to Login Page ===');
    await page.goto('https://vendorbridge-nu.vercel.app/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`Current URL: ${page.url()}`);
    console.log(`Page title: ${await page.title()}`);
    
    // Check what's on the login page
    const loginFormExists = await page.locator('form').count();
    console.log(`Login form found: ${loginFormExists > 0}`);
    
    const pageContent = await page.content();
    console.log(`Page has email input: ${pageContent.includes('email') || pageContent.includes('Email')}`);
    console.log(`Page has password input: ${pageContent.includes('password') || pageContent.includes('Password')}`);
    
    console.log('\n=== STEP 2: Perform Login ===');
    // Try to find email and password fields
    const emailSelectors = ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="email" i]', 'input[placeholder*="Email"]', '#email'];
    const passwordSelectors = ['input[type="password"]', 'input[name="password"]', 'input[placeholder*="password" i]', '#password'];
    
    let emailField = null;
    for (const sel of emailSelectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        emailField = sel;
        console.log(`Found email field: ${sel}`);
        break;
      }
    }
    
    let passwordField = null;
    for (const sel of passwordSelectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        passwordField = sel;
        console.log(`Found password field: ${sel}`);
        break;
      }
    }
    
    if (emailField && passwordField) {
      await page.fill(emailField, 'admin@acme.com');
      await page.fill(passwordField, 'Admin@123');
      
      // Find and click submit button
      const submitSelectors = ['button[type="submit"]', 'button:has-text("Login")', 'button:has-text("Sign In")', 'button:has-text("Log In")', 'input[type="submit"]'];
      let submitBtn = null;
      for (const sel of submitSelectors) {
        const count = await page.locator(sel).count();
        if (count > 0) {
          submitBtn = sel;
          console.log(`Found submit button: ${sel}`);
          break;
        }
      }
      
      if (submitBtn) {
        await page.click(submitBtn);
        await page.waitForTimeout(3000);
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        
        const currentUrl = page.url();
        results.login.redirectedTo = currentUrl;
        console.log(`After login URL: ${currentUrl}`);
        
        if (!currentUrl.includes('/login')) {
          results.login.success = true;
          console.log('Login SUCCESS!');
        } else {
          results.login.success = false;
          console.log('Login FAILED - still on login page');
          // Check for error messages
          const errorText = await page.locator('[role="alert"], .error, .error-message, [class*="error"], [class*="alert"]').allTextContents();
          if (errorText.length > 0) {
            results.login.error = errorText.join('; ');
            console.log(`Login error message: ${errorText.join('; ')}`);
          }
        }
      } else {
        console.log('No submit button found!');
        results.login.error = 'No submit button found';
      }
    } else {
      console.log(`Email field found: ${!!emailField}, Password field found: ${!!passwordField}`);
      results.login.error = `Email field found: ${!!emailField}, Password field found: ${!!passwordField}`;
    }
    
    if (results.login.success) {
      console.log('\n=== STEP 3: Check Dashboard ===');
      await page.waitForTimeout(2000);
      const dashboardUrl = page.url();
      console.log(`Dashboard URL: ${dashboardUrl}`);
      console.log(`Dashboard title: ${await page.title()}`);
      
      // Get all visible text on the page for context
      const headings = await page.locator('h1, h2, h3').allTextContents();
      console.log(`Page headings: ${headings.join(', ')}`);
      
      console.log('\n=== STEP 4: Test Quick Action Buttons ===');
      const quickActions = [
        'Create New RFQ',
        'Onboard New Vendor', 
        'View Approvals Queue',
        'View Payment Ledger'
      ];
      
      for (const action of quickActions) {
        try {
          // Look for button with this text
          const btnSelectors = [
            `button:has-text("${action}")`,
            `a:has-text("${action}")`,
            `[role="button"]:has-text("${action}")`,
            `button:has-text("${action.split(' ').slice(-2).join(' ')}")`,
          ];
          
          let found = false;
          for (const sel of btnSelectors) {
            const count = await page.locator(sel).count();
            if (count > 0) {
              console.log(`Found "${action}" button with selector: ${sel}`);
              
              const urlBefore = page.url();
              
              // Get href if it's a link
              const href = await page.locator(sel).first().getAttribute('href');
              console.log(`  href attribute: ${href}`);
              
              // Click the button
              await page.locator(sel).first().click();
              await page.waitForTimeout(2000);
              await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
              
              const urlAfter = page.url();
              const navigated = urlAfter !== urlBefore;
              
              results.quickActions[action] = {
                found: true,
                href,
                navigated,
                urlBefore,
                urlAfter,
                selector: sel
              };
              
              console.log(`  Navigated: ${navigated}`);
              console.log(`  URL after click: ${urlAfter}`);
              
              // Go back to dashboard if navigated
              if (navigated) {
                await page.goto(dashboardUrl, { waitUntil: 'networkidle', timeout: 15000 });
                await page.waitForTimeout(1000);
              }
              
              found = true;
              break;
            }
          }
          
          if (!found) {
            // Try partial text match
            const partialTexts = action.split(' ');
            const lastTwoWords = partialTexts.slice(-2).join(' ');
            const anyBtn = await page.locator(`button, a, [role="button"]`).filter({ hasText: new RegExp(lastTwoWords, 'i') }).count();
            console.log(`"${action}" - button NOT FOUND directly. Partial match for "${lastTwoWords}": ${anyBtn}`);
            results.quickActions[action] = { found: false, partialMatchCount: anyBtn };
          }
        } catch (e) {
          console.log(`Error testing "${action}": ${e.message}`);
          results.quickActions[action] = { found: false, error: e.message };
        }
      }
      
      console.log('\n=== STEP 5: Test Notification Bell ===');
      try {
        // Navigate back to dashboard first
        await page.goto(dashboardUrl, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000);
        
        const bellSelectors = [
          'button:has-text("🔔")',
          '[aria-label*="notification" i]',
          '[aria-label*="bell" i]',
          'button[title*="notification" i]',
          '.notification-bell',
          '#notification-bell',
          'button svg[class*="bell" i]',
          // Look for any button with bell-related attributes
          'button:has(svg)',
        ];
        
        let bellFound = false;
        for (const sel of bellSelectors) {
          const count = await page.locator(sel).count();
          if (count > 0) {
            console.log(`Found notification bell with selector: ${sel} (count: ${count})`);
            
            if (sel === 'button:has(svg)') {
              // Too broad, log all SVG buttons
              const svgBtns = await page.locator(sel).count();
              console.log(`  Total SVG buttons: ${svgBtns}`);
              continue;
            }
            
            await page.locator(sel).first().click();
            await page.waitForTimeout(1500);
            
            // Check if a dropdown appeared
            const dropdownSelectors = [
              '[role="menu"]',
              '[role="listbox"]', 
              '.dropdown',
              '.notification-panel',
              '.notification-dropdown',
              '[class*="dropdown"]',
              '[class*="panel"]',
              '[class*="popup"]',
            ];
            
            let dropdownFound = false;
            for (const dropSel of dropdownSelectors) {
              const dropCount = await page.locator(dropSel).count();
              if (dropCount > 0) {
                const isVisible = await page.locator(dropSel).first().isVisible();
                if (isVisible) {
                  console.log(`  Dropdown found and visible: ${dropSel}`);
                  const dropText = await page.locator(dropSel).first().textContent();
                  console.log(`  Dropdown content preview: ${dropText?.substring(0, 200)}`);
                  dropdownFound = true;
                  results.notificationBell.opens = true;
                  results.notificationBell.dropdownSelector = dropSel;
                  break;
                }
              }
            }
            
            if (!dropdownFound) {
              console.log(`  Clicked bell but no dropdown panel found`);
              // Check if anything changed on page
              const visibleChanges = await page.locator('[style*="display: block"], [style*="opacity: 1"], [aria-expanded="true"]').count();
              console.log(`  Elements with expanded state: ${visibleChanges}`);
            }
            
            bellFound = true;
            break;
          }
        }
        
        if (!bellFound) {
          console.log('Notification bell NOT FOUND with any selector');
          // List all buttons in header
          const headerBtns = await page.locator('header button, nav button, [role="banner"] button').allTextContents();
          console.log(`Header buttons found: ${JSON.stringify(headerBtns)}`);
          results.notificationBell.error = 'Bell not found';
        }
      } catch (e) {
        console.log(`Error testing notification bell: ${e.message}`);
        results.notificationBell.error = e.message;
      }
      
      console.log('\n=== STEP 6: Test KPI Stat Cards ===');
      try {
        await page.goto(dashboardUrl, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000);
        
        const kpiKeywords = ['Active RFQ', 'Pending Approval', 'KPI', 'stat', 'metric', 'card'];
        
        // Try to find stat cards
        const cardSelectors = [
          '[class*="stat"]',
          '[class*="kpi"]',
          '[class*="metric"]',
          '[class*="card"]',
          '[class*="widget"]',
        ];
        
        for (const sel of cardSelectors) {
          const count = await page.locator(sel).count();
          if (count > 0) {
            console.log(`Found ${count} elements with selector: ${sel}`);
            const texts = await page.locator(sel).allTextContents();
            const relevantTexts = texts.filter(t => 
              t.toLowerCase().includes('rfq') || 
              t.toLowerCase().includes('approval') || 
              t.toLowerCase().includes('vendor') ||
              t.toLowerCase().includes('payment') ||
              t.includes('Active') ||
              t.includes('Pending')
            );
            if (relevantTexts.length > 0) {
              console.log(`  KPI-related texts: ${relevantTexts.slice(0, 5).join(' | ')}`);
            }
          }
        }
        
        // Check for clickable KPI cards
        const kpiCardSelectors = [
          'a[class*="card"]',
          'a[class*="stat"]',
          'button[class*="card"]',
          '[class*="card"][onclick]',
          '[class*="stat"][role="button"]',
        ];
        
        for (const sel of kpiCardSelectors) {
          const count = await page.locator(sel).count();
          if (count > 0) {
            console.log(`Clickable KPI card found: ${sel} (count: ${count})`);
            results.kpiCards[sel] = { count, clickable: true };
          }
        }
        
        // Try clicking on cards that contain known KPI text
        const kpiTexts = ['Active RFQs', 'Pending Approvals', 'Active Vendors', 'Total Spend'];
        for (const kpiText of kpiTexts) {
          const elements = await page.locator(`*:has-text("${kpiText}")`).count();
          console.log(`Elements containing "${kpiText}": ${elements}`);
          
          if (elements > 0) {
            // Find the most specific clickable element
            const clickableWithText = await page.locator(`a:has-text("${kpiText}"), button:has-text("${kpiText}"), [role="button"]:has-text("${kpiText}")`).count();
            console.log(`  Clickable elements with "${kpiText}": ${clickableWithText}`);
            
            results.kpiCards[kpiText] = { found: elements > 0, clickable: clickableWithText > 0 };
            
            if (clickableWithText > 0) {
              const urlBefore = page.url();
              await page.locator(`a:has-text("${kpiText}"), button:has-text("${kpiText}"), [role="button"]:has-text("${kpiText}")`).first().click();
              await page.waitForTimeout(1500);
              const urlAfter = page.url();
              results.kpiCards[kpiText].navigated = urlAfter !== urlBefore;
              results.kpiCards[kpiText].urlAfter = urlAfter;
              console.log(`  After click URL: ${urlAfter}`);
              
              if (urlAfter !== urlBefore) {
                await page.goto(dashboardUrl, { waitUntil: 'networkidle', timeout: 15000 });
                await page.waitForTimeout(1000);
              }
            }
          }
        }
      } catch (e) {
        console.log(`Error testing KPI cards: ${e.message}`);
      }
    }
    
  } catch (e) {
    console.log(`CRITICAL ERROR: ${e.message}`);
    results.criticalError = e.message;
  }
  
  console.log('\n=== STEP 7: Console Errors & Warnings ===');
  const errors = consoleMessages.filter(m => m.type === 'error');
  const warnings = consoleMessages.filter(m => m.type === 'warning');
  
  console.log(`Total console errors: ${errors.length}`);
  errors.forEach(e => console.log(`  ERROR: ${e.text}`));
  
  console.log(`Total console warnings: ${warnings.length}`);
  warnings.forEach(w => console.log(`  WARNING: ${w.text}`));
  
  console.log(`Total page JS errors: ${jsErrors.length}`);
  jsErrors.forEach(e => console.log(`  JS ERROR: ${e}`));
  
  results.consoleErrors = errors.map(e => e.text);
  results.consoleWarnings = warnings.map(w => w.text);
  results.jsErrors = jsErrors;
  
  console.log('\n=== FINAL RESULTS SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
  
  await browser.close();
})();
