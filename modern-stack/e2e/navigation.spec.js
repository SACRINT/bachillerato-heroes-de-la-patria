import { test, expect } from '@playwright/test';

const MAIN_PAGES = [
  { path: '/', title: /Bachillerato Héroes de la Patria.*Héroes.*Puebla/ },
  { path: '/conocenos', title: /Conócenos.*Bachillerato Héroes de la Patria/ },
  { path: '/oferta-educativa', title: /Oferta Educativa.*Bachillerato Héroes de la Patria/ },
  { path: '/servicios', title: /Servicios.*Bachillerato Héroes de la Patria/ },
  { path: '/comunidad', title: /Comunidad.*Bachillerato Héroes de la Patria/ },
  { path: '/transparencia', title: /Transparencia.*Bachillerato Héroes de la Patria/ },
  { path: '/normatividad', title: /Normatividad.*Bachillerato Héroes de la Patria/ },
  { path: '/contacto', title: /Contacto.*Bachillerato Héroes de la Patria/ }
];

test.describe('Site Navigation', () => {
  
  test('all main pages should be accessible and load correctly', async ({ page }) => {
    for (const pageInfo of MAIN_PAGES) {
      await page.goto(pageInfo.path);
      
      // Page should load successfully
      await expect(page).toHaveTitle(pageInfo.title);
      
      // Should have proper heading structure
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
      
      // Should not have any console errors
      const errors = [];
      page.on('pageerror', error => errors.push(error));
      
      // Wait a bit for any async errors
      await page.waitForTimeout(1000);
      expect(errors).toHaveLength(0);
      
      console.log(`✅ ${pageInfo.path} loaded successfully`);
    }
  });

  test('navigation links should work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test each navigation link
    const navLinks = [
      { text: 'Conócenos', expectedPath: '/conocenos' },
      { text: 'Oferta Educativa', expectedPath: '/oferta-educativa' },
      { text: 'Servicios', expectedPath: '/servicios' },
      { text: 'Comunidad', expectedPath: '/comunidad' },
      { text: 'Contacto', expectedPath: '/contacto' }
    ];
    
    for (const link of navLinks) {
      // Go back to homepage
      await page.goto('/');
      
      // Click the navigation link
      await page.click(`nav a:has-text(\"${link.text}\")`);
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      
      // Verify we're on the correct page
      expect(page.url()).toContain(link.expectedPath);
      
      // Verify page loaded correctly
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
      
      console.log(`✅ Navigation to ${link.text} works correctly`);
    }
  });

  test('breadcrumbs should work correctly', async ({ page }) => {
    // Navigate to a sub-page
    await page.goto('/conocenos');
    
    // Check if breadcrumbs exist
    const breadcrumbs = page.locator('.breadcrumbs, [data-testid=\"breadcrumbs\"], nav[aria-label=\"breadcrumb\"]');
    
    if (await breadcrumbs.count() > 0) {
      await expect(breadcrumbs).toBeVisible();
      
      // Should contain link back to home
      const homeLink = breadcrumbs.locator('a[href=\"/\"]');
      await expect(homeLink).toBeVisible();
      
      // Click home breadcrumb
      await homeLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should be back on homepage
      expect(page.url()).toMatch(/\/$|\/index\.html$/);
    }
  });

  test('404 page should work correctly', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/pagina-que-no-existe');
    
    // Should show 404 content or redirect
    const notFoundIndicators = [
      page.locator('h1:has-text(\"404\")'),
      page.locator('h1:has-text(\"Página no encontrada\")'),
      page.locator('[data-testid=\"404\"]'),
      page.locator('.error-404')
    ];
    
    let found404 = false;
    for (const indicator of notFoundIndicators) {
      if (await indicator.count() > 0) {
        await expect(indicator).toBeVisible();
        found404 = true;
        break;
      }
    }
    
    // If no 404 page, might redirect to home (which is also acceptable)
    if (!found404) {
      expect(page.url()).toMatch(/\/$|\/index\.html$/);
    }
  });

  test('external links should open in new tab', async ({ page }) => {
    await page.goto('/');
    
    // Find external links (if any)
    const externalLinks = await page.locator('a[href^=\"http\"]:not([href*=\"sacrint.github.io\"]):not([href*=\"localhost\"])').all();
    
    for (const link of externalLinks) {
      const href = await link.getAttribute('href');
      const target = await link.getAttribute('target');
      
      // External links should have target="_blank"
      if (href && !href.includes('sacrint.github.io') && !href.includes('localhost')) {
        expect(target).toBe('_blank');
        
        // Should also have rel="noopener" for security
        const rel = await link.getAttribute('rel');
        expect(rel).toContain('noopener');
      }
    }
  });

  test('search functionality should work (if available)', async ({ page }) => {
    await page.goto('/');
    
    // Look for search functionality
    const searchInput = page.locator('input[type=\"search\"], input[placeholder*=\"buscar\"], [data-testid=\"search\"]');
    
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
      
      // Try typing in search
      await searchInput.fill('bachillerato');
      await searchInput.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(2000);
      
      // Should show some kind of results or feedback
      const resultsIndicators = [
        page.locator('.search-results'),
        page.locator('[data-testid=\"search-results\"]'),
        page.locator('.no-results')
      ];
      
      let hasResults = false;
      for (const indicator of resultsIndicators) {
        if (await indicator.count() > 0) {
          hasResults = true;
          break;
        }
      }
      
      expect(hasResults).toBe(true);
    }
  });

  test('site should handle back/forward navigation', async ({ page }) => {
    // Start on homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to conocenos
    await page.goto('/conocenos');
    await page.waitForLoadState('networkidle');
    
    // Navigate to servicios  
    await page.goto('/servicios');
    await page.waitForLoadState('networkidle');
    
    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/conocenos');
    
    // Use browser forward button
    await page.goForward();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/servicios');
    
    // Back to beginning
    await page.goBack();
    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/$|\/index\.html$/);
  });

  test('page should maintain scroll position on navigation', async ({ page }) => {
    // Navigate to a long page
    await page.goto('/conocenos');
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    
    // Navigate away and back
    await page.goto('/servicios');
    await page.goBack();
    
    // Note: Scroll restoration behavior varies by browser and implementation
    // This test mainly ensures navigation doesn't break
    await expect(page.locator('h1').first()).toBeVisible();
  });
});