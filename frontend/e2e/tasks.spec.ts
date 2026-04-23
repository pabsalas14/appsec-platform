import { test, expect } from './fixtures';

/**
 * Critical user flow: Login → Create → Edit → Delete.
 * Uses the seeded admin user (see backend/app/seed.py and .env).
 */
test.describe('Tasks CRUD', () => {
  test('create, edit, toggle and delete a task', async ({ authedPage: page }) => {
    const unique = Date.now();
    const title = `E2E task ${unique}`;
    const edited = `${title} (edited)`;

    await expect(page).toHaveURL(/\/tasks/);

    // ── Create ────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /new task/i }).click();
    const createDialog = page.getByRole('dialog');
    await createDialog.getByLabel(/title/i).fill(title);
    await createDialog.getByLabel(/description/i).fill('Created by Playwright');
    await createDialog.getByRole('button', { name: /^create$/i }).click();

    const row = page.getByRole('row', { name: new RegExp(title) });
    await expect(row).toBeVisible();
    await expect(row.getByText(/pending/i)).toBeVisible();

    // ── Edit ──────────────────────────────────────────────────────────
    await row.getByRole('button').filter({ hasText: '' }).first().click(); // pencil icon button
    const editDialog = page.getByRole('dialog');
    const titleInput = editDialog.getByLabel(/title/i);
    await titleInput.fill(edited);
    await editDialog.getByRole('button', { name: /^update$/i }).click();

    await expect(page.getByRole('row', { name: new RegExp(edited) })).toBeVisible();

    // ── Toggle completed ──────────────────────────────────────────────
    const editedRow = page.getByRole('row', { name: new RegExp(edited) });
    await editedRow.locator('button[title*="complete"]').first().click();
    await expect(editedRow.getByText(/completed/i)).toBeVisible();

    // ── Delete ────────────────────────────────────────────────────────
    await editedRow.locator('button[id^="delete-task-"]').click();
    await page.getByRole('alertdialog').getByRole('button', { name: /^delete$/i }).click();

    await expect(page.getByRole('row', { name: new RegExp(edited) })).toHaveCount(0);
  });
});
