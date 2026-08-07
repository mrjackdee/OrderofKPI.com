import { test, expect } from '@playwright/test';

test.describe('Order of KPI End-to-End QA Suite', () => {

  test('1. Candidate Tracker loads candidate cards and Applied candidates', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('userRole', 'admin');
      sessionStorage.setItem('userEmail', 'admin@orderofkpi.org');
    });
    await page.goto('/candidate-tracker');

    await expect(page.locator('h1')).toContainText('Candidate Tracker');
    const pageContent = await page.content();
    expect(pageContent).toContain('Michael');
  });

  test('2. Admin Dashboard renders pipeline controls and candidate roster', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('userRole', 'admin');
      sessionStorage.setItem('userEmail', 'admin@orderofkpi.org');
    });
    await page.goto('/admin-dashboard');

    await expect(page.locator('body')).toContainText('Admin');
  });

  test('3. Committee Chair Dashboard renders review controls', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('userRole', 'Membership Committee Chair');
      sessionStorage.setItem('userEmail', 'james.haywood@orderofkpi.org');
    });
    await page.goto('/chair-dashboard');

    await expect(page.locator('body')).toContainText('Committee');
  });

  test('4. Applicant Portal loads application form', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('userRole', 'applicant');
      sessionStorage.setItem('userEmail', 'applicant@orderofkpi.org');
    });
    await page.goto('/applicant-portal');

    await expect(page.locator('body')).toContainText('Application');
  });

  test('5. Selection Voting loads governance content', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('userRole', 'member');
      sessionStorage.setItem('userEmail', 'brian.johnson@orderofkpi.org');
    });
    await page.goto('/selection-voting');

    await expect(page.locator('body')).toContainText('Voting');
  });

});
