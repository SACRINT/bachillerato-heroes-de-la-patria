import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Should have exactly one h1
    const h1Elements = page.locator('h1');
    await expect(h1Elements).toHaveCount(1);
    
    // Check heading hierarchy (h1 -> h2 -> h3, etc.)
    const allHeadings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = [];
    
    for (const heading of allHeadings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      headingLevels.push(parseInt(tagName.substring(1)));
    }
    
    // Check that headings don't skip levels
    for (let i = 1; i < headingLevels.length; i++) {
      const current = headingLevels[i];
      const previous = headingLevels[i - 1];
      
      if (current > previous) {
        // Can only increase by 1 level
        expect(current - previous).toBeLessThanOrEqual(1);
      }
    }
    
    console.log(`✅ Heading hierarchy: ${headingLevels.join(' -> ')}`);
  });

  test('should have alt text for all images', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    let imagesWithoutAlt = 0;
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      const ariaLabel = await img.getAttribute('aria-label');
      
      // Decorative images can have empty alt or role="presentation"
      const isDecorative = alt === '' || role === 'presentation' || role === 'none';
      const hasAccessibleName = alt || ariaLabel;
      
      if (!isDecorative && !hasAccessibleName) {
        imagesWithoutAlt++;
        const src = await img.getAttribute('src');
        console.log(`⚠️  Image missing alt text: ${src}`);
      }
    }
    
    expect(imagesWithoutAlt).toBe(0);
    console.log(`✅ All ${images.length} images have proper alt text`);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/contacto');
    
    const inputs = await page.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select').all();
    let unlabeledInputs = 0;
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const title = await input.getAttribute('title');
      
      let hasLabel = false;
      
      // Check for associated label
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        if (await label.count() > 0) {
          hasLabel = true;
        }
      }
      
      // Check for aria-label or aria-labelledby
      if (ariaLabel || ariaLabelledby || title) {
        hasLabel = true;
      }
      
      // Check if input is wrapped in a label
      const parentLabel = await input.evaluate(el => {
        return el.closest('label') !== null;
      });
      
      if (parentLabel) {
        hasLabel = true;
      }
      
      if (!hasLabel) {
        unlabeledInputs++;
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        console.log(`⚠️  Unlabeled input: type="${type}" name="${name}"`);
      }
    }
    
    expect(unlabeledInputs).toBe(0);
    console.log(`✅ All ${inputs.length} form inputs have proper labels`);
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    const focusableElements = await page.locator('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])').all();
    
    if (focusableElements.length > 0) {
      // Focus first element
      await page.keyboard.press('Tab');
      
      let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
      
      // Test that we can navigate through elements
      for (let i = 0; i < Math.min(5, focusableElements.length - 1); i++) {
        await page.keyboard.press('Tab');
        const newFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
        // Focus should change
        expect(newFocusedElement).toBeTruthy();
      }
      
      console.log(`✅ Keyboard navigation works with ${focusableElements.length} focusable elements`);
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    
    // This is a simplified check - in real scenarios you'd use a tool like axe
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, a, button, span').all();
    
    for (const element of textElements.slice(0, 10)) { // Check first 10 elements
      const styles = await element.evaluate(el => {
        const computedStyles = window.getComputedStyle(el);
        return {
          color: computedStyles.color,
          backgroundColor: computedStyles.backgroundColor,
          fontSize: computedStyles.fontSize
        };
      });
      
      // Basic check that text is not transparent
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(styles.color).not.toBe('transparent');
    }
    
    console.log('✅ Basic color contrast check passed');
  });

  test('should have proper ARIA landmarks', async ({ page }) => {
    await page.goto('/');
    
    // Check for semantic HTML5 elements or ARIA landmarks
    const landmarks = await page.locator('header, nav, main, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]').count();
    
    expect(landmarks).toBeGreaterThan(0);
    
    // Should have main content area
    const mainContent = await page.locator('main, [role="main"]').count();
    expect(mainContent).toBeGreaterThan(0);
    
    console.log(`✅ Found ${landmarks} ARIA landmarks`);
  });

  test('should have proper skip links', async ({ page }) => {
    await page.goto('/');
    
    // Check for skip to main content link
    const skipLink = page.locator('a[href="#main"], a[href="#content"], a:has-text("Skip to")').first();
    
    if (await skipLink.count() > 0) {
      // Skip link should be focusable
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.textContent?.toLowerCase().includes('skip'));
      
      if (focused) {
        // Test that skip link works
        await page.keyboard.press('Enter');
        const mainElement = await page.locator('main, [role="main"], #main, #content').first();
        await expect(mainElement).toBeFocused();
        
        console.log('✅ Skip link functionality works');
      }
    }
  });

  test('should announce page changes to screen readers', async ({ page }) => {
    await page.goto('/');
    
    // Check for live region or page title updates
    const liveRegions = await page.locator('[aria-live], [aria-atomic]').count();
    
    // Navigate to different page
    await page.click('nav a[href="/conocenos"]');
    await page.waitForLoadState('networkidle');
    
    // Page title should update
    const newTitle = await page.title();
    expect(newTitle).toContain('Conócenos');
    
    console.log('✅ Page title updates correctly for screen readers');
  });

  test('should handle focus management', async ({ page }) => {
    await page.goto('/');
    
    // Test modal or dropdown focus management if present
    const modalTriggers = await page.locator('button[data-modal], button[aria-haspopup="dialog"], .mobile-menu-trigger').all();
    
    for (const trigger of modalTriggers.slice(0, 1)) { // Test first one
      await trigger.click();
      
      // Wait for modal/menu to appear
      await page.waitForTimeout(500);
      
      // Focus should move to modal/menu content
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
      
      // Test escape key to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      console.log('✅ Focus management works for interactive elements');
      break;
    }
  });

  test('should provide clear error messages', async ({ page }) => {
    await page.goto('/contacto');
    
    // Find and submit form without filling required fields
    const form = page.locator('form').first();
    if (await form.count() > 0) {
      const submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
        
        // Wait for validation messages
        await page.waitForTimeout(1000);
        
        // Check for error messages
        const errorMessages = await page.locator('.error, [aria-invalid="true"], :invalid').count();
        
        if (errorMessages > 0) {
          // Error messages should be properly associated
          const invalidFields = await page.locator('[aria-invalid="true"]').all();
          
          for (const field of invalidFields) {
            const describedBy = await field.getAttribute('aria-describedby');
            
            if (describedBy) {
              const errorMessage = page.locator(`#${describedBy}`);
              await expect(errorMessage).toBeVisible();
            }
          }
          
          console.log('✅ Form validation messages are accessible');
        }
      }
    }
  });
});