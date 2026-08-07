import { test, expect } from '@playwright/test';
import { QA_ROLE_CREDENTIALS } from './test-credentials';

test.describe('Order of KPI Comprehensive Role-Based QA & Security Suite', () => {

  // ---------------------------------------------------------------------------
  // 1. ADMIN ROLE E2E FLOW
  // ---------------------------------------------------------------------------
  test('ROLE: Admin (admin@orderofkpi.org) - Full System Access & Dashboard Control', async ({ page }) => {
    const cred = QA_ROLE_CREDENTIALS.admin;
    
    // Login via UI form
    await page.goto('/login');
    await page.fill('input[type="email"]', cred.email);
    await page.fill('input[type="password"]', cred.password);
    await page.click('button[type="submit"]');

    // Wait for redirect after successful login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // Navigate to Admin Dashboard & verify content
    await page.goto('/admin-dashboard');
    await expect(page.locator('body')).toContainText('Admin');

    // Navigate to Candidate Tracker & verify candidates load
    await page.goto('/candidate-tracker');
    await expect(page.locator('h1')).toContainText('Candidate Tracker');
    const content = await page.content();
    expect(content).toContain('Michael');
  });

  // ---------------------------------------------------------------------------
  // 2. CHAIR ROLE E2E FLOW
  // ---------------------------------------------------------------------------
  test('ROLE: Committee Chair (james.haywood@orderofkpi.org) - Chair Dashboard & Tracker Access', async ({ page }) => {
    const cred = QA_ROLE_CREDENTIALS.chair;

    await page.goto('/login');
    await page.fill('input[type="email"]', cred.email);
    await page.fill('input[type="password"]', cred.password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/chair-dashboard');
    await expect(page.locator('body')).toContainText('Committee');
  });

  // ---------------------------------------------------------------------------
  // 3. COMMITTEE MEMBER ROLE E2E FLOW
  // ---------------------------------------------------------------------------
  test('ROLE: Committee Member (brian.johnson@orderofkpi.org) - Review Applications & Candidate Tracker', async ({ page }) => {
    const cred = QA_ROLE_CREDENTIALS.committee;

    await page.goto('/login');
    await page.fill('input[type="email"]', cred.email);
    await page.fill('input[type="password"]', cred.password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/candidate-tracker');
    await expect(page.locator('h1')).toContainText('Candidate Tracker');
  });

  // ---------------------------------------------------------------------------
  // 4. OFFICER ROLE E2E FLOW
  // ---------------------------------------------------------------------------
  test('ROLE: Officer (ishmeal.allensworth@orderofkpi.org) - Process Timeline & Candidate Access', async ({ page }) => {
    const cred = QA_ROLE_CREDENTIALS.officer;

    await page.goto('/login');
    await page.fill('input[type="email"]', cred.email);
    await page.fill('input[type="password"]', cred.password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/gantt-chart');
    await expect(page.locator('body')).toContainText('Process Timeline');
  });

  // ---------------------------------------------------------------------------
  // 5. STANDARD MEMBER ROLE E2E FLOW
  // ---------------------------------------------------------------------------
  test('ROLE: Standard Member (dameone.ferguson@orderofkpi.org) - Member Portal & Voting Access', async ({ page }) => {
    const cred = QA_ROLE_CREDENTIALS.member;

    await page.goto('/login');
    await page.fill('input[type="email"]', cred.email);
    await page.fill('input[type="password"]', cred.password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/member-portal');
    await expect(page.locator('body')).toContainText('Member');
  });

  // ---------------------------------------------------------------------------
  // 6. APPLICANT ROLE E2E FLOW
  // ---------------------------------------------------------------------------
  test('ROLE: Applicant (mabmykie1914@gmail.com) - Applicant Portal Access', async ({ page }) => {
    const cred = QA_ROLE_CREDENTIALS.applicant;

    await page.goto('/applicant-login');
    await page.fill('input[type="email"]', cred.email);
    await page.fill('input[type="password"]', cred.password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/applicant-login'), { timeout: 10000 });

    await page.goto('/applicant-portal');
    await expect(page.locator('body')).toContainText('Applicant');
  });

});
