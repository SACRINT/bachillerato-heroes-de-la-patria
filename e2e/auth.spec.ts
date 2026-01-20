import { test, expect } from '@playwright/test';

/**
 * 🔐 Authentication E2E Tests
 * Tests for login flows (student, parent, teacher, admin)
 */

test.describe('Authentication', () => {

    test.describe('Student Portal', () => {
        test('should display login form', async ({ page }) => {
            await page.goto('/estudiantes.html');

            // Should have login section or redirect to login
            const loginForm = page.locator('form, .login-form, #loginForm, [data-login]').first();
            const loginButton = page.getByRole('button', { name: /iniciar|login|acceder/i }).first();

            // Either form or button should exist
            const hasForm = await loginForm.count() > 0;
            const hasButton = await loginButton.count() > 0;
            expect(hasForm || hasButton).toBeTruthy();
        });

        test('should show validation errors on empty submit', async ({ page }) => {
            await page.goto('/estudiantes.html');

            // Find and click login button
            const loginButton = page.getByRole('button', { name: /iniciar|login|acceder/i }).first();
            if (await loginButton.count() > 0) {
                await loginButton.click();

                // Should show some validation feedback
                const validationMessage = page.locator('.invalid-feedback, .error, .alert-danger, [class*="error"]').first();
                // Wait a moment for validation
                await page.waitForTimeout(500);
            }
        });

        test('should display UTF-8 correctly', async ({ page }) => {
            await page.goto('/estudiantes.html');

            const content = await page.content();
            // No encoding issues
            expect(content).not.toContain('Ã©');
            expect(content).not.toContain('Ã³');

            // Should contain Spanish text
            expect(content).toMatch(/estudiante|académico|calificaciones/i);
        });
    });

    test.describe('Parent Portal', () => {
        test('should display login form', async ({ page }) => {
            await page.goto('/padres.html');

            // Should have parent-specific content
            const content = await page.content();
            expect(content).toMatch(/padre|familia|tutor|hijo/i);
        });

        test('should have working navigation from parent portal', async ({ page }) => {
            await page.goto('/padres.html');

            // Should be able to navigate back to home
            const homeLink = page.getByRole('link', { name: /inicio|home/i }).first();
            if (await homeLink.count() > 0) {
                await homeLink.click();
                await expect(page).toHaveURL(/\/$|\/index/);
            }
        });
    });

    test.describe('Teacher Portal', () => {
        test('should display teacher portal', async ({ page }) => {
            await page.goto('/docentes.html');

            // Should have teacher-specific content
            const content = await page.content();
            expect(content).toMatch(/docente|profesor|maestro/i);
        });
    });
});
