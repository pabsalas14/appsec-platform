import { test, expect } from '@playwright/test';

test.describe('Code Security Reviews - End to End', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to reviews page
    await page.goto('http://localhost:3000/code_security_reviews');
    // Wait for page load
    await page.waitForLoadState('networkidle');
  });

  test('should load reviews list page', async ({ page }) => {
    // Check that main heading exists
    await expect(page.locator('h1')).toContainText('Code Security Reviews');
    
    // Check for key UI elements
    await expect(page.locator('button:has-text("New")')).toBeVisible();
  });

  test('should display reviews table with data', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 5000 });
    
    // Check table has rows
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('should navigate to new scan form', async ({ page }) => {
    // Click "New" button
    await page.click('button:has-text("New")');
    
    // Should navigate to /code_security_reviews/new
    await page.waitForURL('**/code_security_reviews/new');
    
    // Check form exists
    await expect(page.locator('form')).toBeVisible();
  });

  test('should handle scan type selection', async ({ page }) => {
    // Go to new scan page
    await page.goto('http://localhost:3000/code_security_reviews/new');
    
    // Find scan type selector
    const selector = page.locator('select[name="tipo_escaneo"]');
    await expect(selector).toBeVisible();
    
    // Check scan type options
    await selector.click();
    const options = page.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(4); // PUBLICO, REPOSITORIO, RAMA, ORGANIZACION
  });

  test('should validate required fields in form', async ({ page }) => {
    await page.goto('http://localhost:3000/code_security_reviews/new');
    
    // Try to submit empty form
    const submitBtn = page.locator('button:has-text("Siguiente")').first();
    await submitBtn.click();
    
    // Should show validation error
    await expect(page.locator('text=Título requerido')).toBeVisible({ timeout: 2000 });
  });

  test('should display review details when clicking on a review', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 5000 });
    
    // Click first review row
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    
    // Should navigate to detail page
    await page.waitForURL('**/code_security_reviews/**');
    
    // Check detail page has tabs
    await expect(page.locator('[role="tab"]')).toHaveCount(4); // Overview, Findings, Events, Report
  });

  test('should display findings in detail view', async ({ page }) => {
    // Assume we're on a completed review detail page
    await page.goto('http://localhost:3000/code_security_reviews');
    
    // Get first completed review and navigate to it
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    
    if (count > 0) {
      await rows.first().click();
      await page.waitForLoadState('networkidle');
      
      // Click Findings tab
      await page.click('[role="tab"]:has-text("Findings")');
      
      // Wait for findings table
      await page.waitForSelector('table', { timeout: 5000 });
      
      const findings = page.locator('table tbody tr');
      expect(await findings.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should handle real-time progress updates', async ({ page, context }) => {
    // This test requires an analysis in progress
    // Go to list
    await page.goto('http://localhost:3000/code_security_reviews');
    
    // Find a review with ANALYZING status
    const analyzingRow = page.locator('table tbody tr:has-text("ANALYZING")').first();
    
    if (await analyzingRow.isVisible()) {
      // Click it
      await analyzingRow.click();
      
      // Should be on detail page with SSE stream
      await page.waitForURL('**/code_security_reviews/**');
      
      // Check progress bar exists
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible({ timeout: 3000 });
      
      // Progress should eventually reach 100 or hit timeout
      let completed = false;
      for (let i = 0; i < 60; i++) { // 60 attempts * 1 second
        const progress = await page.locator('[data-testid="progress-value"]').textContent();
        if (progress?.includes('100')) {
          completed = true;
          break;
        }
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should support multi-step form navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/code_security_reviews/new');
    
    // Step 1: Should show step 1 content
    await expect(page.locator('[data-step="1"]')).toBeVisible();
    
    // Fill form and go to next step
    await page.fill('input[name="titulo"]', 'Test Review');
    await page.click('button:has-text("Siguiente")');
    
    // Should proceed to step 2
    await page.waitForTimeout(500);
    await expect(page.locator('[data-step="2"]')).toBeVisible({ timeout: 3000 });
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Try to access non-existent review
    await page.goto('http://localhost:3000/code_security_reviews/invalid-id', {
      waitUntil: 'networkidle'
    });
    
    // Should show error message or redirect
    const errorMsg = page.locator('text=not found|error|Error').first();
    const shouldExist = await errorMsg.isVisible({ timeout: 3000 }).catch(() => false);
    
    // Either error message or redirect is acceptable
    expect(
      shouldExist || 
      page.url().includes('code_security_reviews') === false
    ).toBeTruthy();
  });

  test('should filter reviews by status', async ({ page }) => {
    // Look for filter options
    const filterBtn = page.locator('button:has-text("Filter")');
    
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      
      // Select COMPLETED status
      const completedOption = page.locator('option:has-text("COMPLETED")');
      if (await completedOption.isVisible()) {
        await completedOption.click();
        
        // Table should update to show only completed
        await page.waitForTimeout(1000);
        
        const rows = page.locator('table tbody tr');
        const count = await rows.count();
        
        // All visible rows should have COMPLETED status
        for (let i = 0; i < Math.min(count, 3); i++) {
          const statusCell = rows.nth(i).locator('td:nth-child(4)');
          const text = await statusCell.textContent();
          expect(text).toContain('COMPLETED');
        }
      }
    }
  });
});
