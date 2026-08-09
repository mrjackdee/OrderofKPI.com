import { test, expect } from '@playwright/test';
import { QA_ROLE_CREDENTIALS } from './test-credentials';

test.describe('Order of KPI Dedicated QA Credentials & Security Suite', () => {

  // ---------------------------------------------------------------------------
  // 1. DEDICATED QA ADMIN ROLE E2E FLOW
  // ---------------------------------------------------------------------------
  test('ROLE: Dedicated QA Admin (qa.admin@orderofkpi.org) - Full System Access', async ({ page }) => {
    const cred = QA_ROLE_CREDENTIALS.admin;
    
    await page.goto('/login');
    await page.fill('input[type="email"]', cred.email);
    await page.fill('input[type="password"]', cred.password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/admin-dashboard');
    await expect(page.locator('body')).toContainText('Admin');

    await page.goto('/candidate-tracker');
    await expect(page.locator('h1')).toContainText('Candidate Tracker');
  });

  // ---------------------------------------------------------------------------
  // 2. DEDICATED QA CHAIR ROLE E2E FLOW
  // ---------------------------------------------------------------------------
  test('ROLE: Dedicated QA Chair (qa.chair@orderofkpi.org) - Chair Dashboard Access', async ({ page }) => {
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
  // 3. DEDICATED QA COMMITTEE MEMBER E2E FLOW
  // ---------------------------------------------------------------------------
  test('ROLE: Dedicated QA Committee (qa.committee@orderofkpi.org) - Review Access', async ({ page }) => {
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
  // 4. DEDICATED QA OFFICER E2E FLOW
  // ---------------------------------------------------------------------------
  test('ROLE: Dedicated QA Officer (qa.officer@orderofkpi.org) - Timeline Access', async ({ page }) => {
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
  // 5. DEDICATED QA STANDARD MEMBER E2E FLOW
  // ---------------------------------------------------------------------------
  test('ROLE: Dedicated QA Member (qa.member@orderofkpi.org) - Member Portal Access', async ({ page }) => {
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
  // 6. DEDICATED QA APPLICANT E2E FLOW
  // ---------------------------------------------------------------------------
  test('ROLE: Dedicated QA Applicant (qa.applicant@orderofkpi.org) - Applicant Portal Access', async ({ page }) => {
    const cred = QA_ROLE_CREDENTIALS.applicant;

    await page.goto('/applicant-login');
    await page.fill('input[type="email"]', cred.email);
    await page.fill('input[type="password"]', cred.password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/applicant-login'), { timeout: 10000 });

    await page.goto('/applicant-portal');
    await expect(page.locator('body')).toContainText('Applicant');
  });

  // ---------------------------------------------------------------------------
  // 7. INTAKE DEAN NOMINATION E2E FLOW (Multi-Channel Self-Healing Persistence)
  // ---------------------------------------------------------------------------
  test('PROCESS: Intake Dean Nomination Submission & Persistence', async ({ page }) => {
    const cred = QA_ROLE_CREDENTIALS.member;

    await page.goto('/login');
    await page.fill('input[type="email"]', cred.email);
    await page.fill('input[type="password"]', cred.password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // Set localStorage password changed flag to bypass first-login overlay
    await page.evaluate((email) => {
      localStorage.setItem(`kpi_password_changed_${email}`, 'true');
    }, cred.email);

    await page.goto('/dean-nomination');
    await expect(page.locator('h1')).toContainText('Intake Dean Nomination');

    // Dismiss first-login modal if overlay is still visible
    const remLater = page.locator('button:has-text("Remind Me Later")');
    if (await remLater.isVisible().catch(() => false)) {
      await remLater.click().catch(() => {});
    }

    // Fill out form using exact input placeholders
    await page.fill('input[placeholder="e.g. Marcus"]', 'James');
    await page.fill('input[placeholder="e.g. Garvey"]', 'Haywood');
    await page.fill('textarea', 'QA Automated Test Nomination for Intake Dean with full triple-channel self-healing sync.');

    await page.click('button:has-text("Submit Nomination")', { force: true });

    // Verify success banner or active nomination message
    await expect(page.locator('body')).toContainText('recorded');
  });

});
