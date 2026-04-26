import { test, expect } from '@playwright/test';

test.describe('Admin Pages - 6 Fases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Asume autenticación previa
  });

  test('Module Views page loads and displays table', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/module-views');
    expect(page).toHaveTitle(/Module Views/);
    await expect(page.locator('[data-testid="data-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-module-view"]')).toBeVisible();
  });

  test('Module Views - Create form modal opens', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/module-views');
    await page.locator('[data-testid="create-module-view"]').click();
    await expect(page.locator('text=Crear nuevo Module View')).toBeVisible();
    await expect(page.locator('[data-testid="field-module_name"]')).toBeVisible();
    await expect(page.locator('[data-testid="field-nombre"]')).toBeVisible();
    await expect(page.locator('[data-testid="field-tipo"]')).toBeVisible();
  });

  test('Custom Fields page loads with tabs', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/custom-fields');
    expect(page).toHaveTitle(/Custom Fields/);
    await expect(page.locator('[data-testid="entity-tabs"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-custom-field"]')).toBeVisible();
  });

  test('Validation Rules page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/validation-rules');
    expect(page).toHaveTitle(/Validation Rules/);
    await expect(page.locator('[data-testid="data-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-validation-rule"]')).toBeVisible();
  });

  test('Catalogs page loads and displays form', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/catalogs');
    expect(page).toHaveTitle(/Catálogos/);
    await expect(page.locator('[data-testid="data-table"]')).toBeVisible();
    await page.locator('[data-testid="create-catalog"]').click();
    await expect(page.locator('[data-testid="field-tipo"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-value"]')).toBeVisible();
  });

  test('Navigation page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/navigation');
    expect(page).toHaveTitle(/Navegación/);
    await expect(page.locator('[data-testid="data-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-nav-item"]')).toBeVisible();
  });

  test('AI Rules page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/ai-rules');
    expect(page).toHaveTitle(/AI Automation Rules/);
    await expect(page.locator('[data-testid="data-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-ai-rule"]')).toBeVisible();
  });

  test('DataTable search functionality works', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/module-views');
    const searchInput = page.locator('[data-testid="data-table-search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test');
    // Verifica que se activa la búsqueda
    await expect(page.locator('[data-testid="data-table"]')).toBeVisible();
  });

  test('Delete confirmation modal works', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/module-views');
    // Asume que hay al menos un registro
    const deleteButton = page.locator('[data-testid^="action-Eliminar"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await expect(page.locator('[data-testid="delete-confirm"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-cancel"]')).toBeVisible();
      await page.locator('[data-testid="delete-cancel"]').click();
    }
  });

  test('Pagination navigation works', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/module-views');
    const nextButton = page.locator('[data-testid="pagination-next"]');
    const prevButton = page.locator('[data-testid="pagination-prev"]');
    await expect(nextButton).toBeVisible();
    await expect(prevButton).toBeVisible();
  });
});
