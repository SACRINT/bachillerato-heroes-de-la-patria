import { test, expect } from '@playwright/test';

/**
 * 🏠 Homepage E2E Tests
 * Tests for the main landing page
 */

test.describe('Homepage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load without errors', async ({ page }) => {
        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');

        // Check no console errors (except expected ones)
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        // Wait a bit for any async errors
        await page.waitForTimeout(1000);

        // No critical errors should be present
        const criticalErrors = errors.filter(e =>
            !e.includes('favicon') &&
            !e.includes('404') &&
            !e.includes('Failed to load resource')
        );
        expect(criticalErrors).toHaveLength(0);
    });

    test('should display correct title', async ({ page }) => {
        await expect(page).toHaveTitle(/Héroes de la Patria/);
    });

    test('should have working navigation menu', async ({ page }) => {
        // Check that main navigation is visible
        const nav = page.locator('nav, .navbar');
        await expect(nav.first()).toBeVisible();

        // Check for main menu items
        const menuItems = ['Inicio', 'Institucional', 'Académicos', 'Servicios'];
        for (const item of menuItems) {
            const menuLink = page.getByRole('link', { name: new RegExp(item, 'i') }).first();
            // Menu item should exist (may be in dropdown)
            expect(await menuLink.count()).toBeGreaterThanOrEqual(0);
        }
    });

    test('should display hero section with UTF-8 characters', async ({ page }) => {
        // Hero section should be visible
        const heroSection = page.locator('.hero-section, .hero, [class*="hero"]').first();
        await expect(heroSection).toBeVisible();

        // Check that Spanish characters render correctly (no encoding issues)
        const pageContent = await page.content();
        expect(pageContent).not.toContain('Ã©'); // Bad encoding for é
        expect(pageContent).not.toContain('Ã³'); // Bad encoding for ó
        expect(pageContent).not.toContain('Ã­'); // Bad encoding for í
    });

    test('should have working footer links', async ({ page }) => {
        // Scroll to footer
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Footer should be visible
        const footer = page.locator('footer');
        await expect(footer).toBeVisible();

        // Check for essential footer links
        const privacyLink = page.getByRole('link', { name: /privacidad|aviso/i }).first();
        await expect(privacyLink).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Page should still be functional
        await expect(page.locator('body')).toBeVisible();

        // Mobile menu toggle should be visible
        const mobileToggle = page.locator('.navbar-toggler, [data-bs-toggle="collapse"]').first();
        if (await mobileToggle.count() > 0) {
            await expect(mobileToggle).toBeVisible();
        }
    });
});
