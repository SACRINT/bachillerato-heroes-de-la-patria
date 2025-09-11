import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Bachillerato Héroes de la Patria.*Héroes.*Puebla/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    // Verify meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toContain('Centro de Bachillerato Tecnológico');
    
    // Verify Open Graph tags
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /.+/);
    
    // Verify viewport meta
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', 'width=device-width, initial-scale=1');
  });

  test('should have working navigation menu', async ({ page }) => {
    // Check that main navigation exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Test navigation links
    const navLinks = [
      { text: 'Inicio', href: '/' },
      { text: 'Conócenos', href: '/conocenos' },
      { text: 'Oferta Educativa', href: '/oferta-educativa' },
      { text: 'Servicios', href: '/servicios' },
      { text: 'Comunidad', href: '/comunidad' },
      { text: 'Contacto', href: '/contacto' }
    ];
    
    for (const link of navLinks) {
      const navLink = page.locator(`nav a:has-text(\"${link.text}\")`);
      await expect(navLink).toBeVisible();
      await expect(navLink).toHaveAttribute('href', link.href);
    }
  });

  test('should display hero section correctly', async ({ page }) => {
    // Hero section should be visible
    const heroSection = page.locator('.hero-section, [data-testid=\"hero\"]');
    await expect(heroSection).toBeVisible();
    
    // Should have main heading
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText(['Bachillerato Héroes de la Patria', 'Héroes', 'Puebla']);
    
    // Should have CTA button
    const ctaButton = page.locator('a[href*=\"conocenos\"], button:has-text(\"Conoce\")').first();
    await expect(ctaButton).toBeVisible();
  });

  test('should have working footer', async ({ page }) => {
    // Scroll to footer
    await page.locator('footer').scrollIntoViewIfNeeded();
    
    // Footer should be visible
    await expect(page.locator('footer')).toBeVisible();
    
    // Should have contact information
    await expect(page.locator('footer')).toContainText(['Bachillerato Héroes de la Patria', 'contacto', 'dirección']);
    
    // Should have social links
    const socialSection = page.locator('footer').locator('[data-testid=\"social\"], .social');
    if (await socialSection.count() > 0) {
      await expect(socialSection).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Navigation should be collapsed or hamburger
    const mobileNav = page.locator('.mobile-menu, [data-testid=\"mobile-nav\"], button[aria-label*=\"menu\"]');
    if (await mobileNav.count() > 0) {
      await expect(mobileNav).toBeVisible();
    }
    
    // Hero section should still be visible
    const heroSection = page.locator('.hero-section, [data-testid=\"hero\"]');
    await expect(heroSection).toBeVisible();
    
    // Content should not overflow
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox.width).toBeLessThanOrEqual(375);
  });

  test('should have working service worker', async ({ page }) => {
    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    // Service worker should be registered (may take time)
    await page.waitForTimeout(2000);
    const finalSwCheck = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(finalSwCheck).toBe(true);
  });

  test('should have PWA manifest', async ({ page }) => {
    // Check for manifest link
    const manifestLink = page.locator('link[rel=\"manifest\"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
    
    // Verify manifest is accessible
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.status()).toBe(200);
    
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
  });
});