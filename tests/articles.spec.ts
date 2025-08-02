import { test, expect } from '@playwright/test';

test('test articles section', async ({ page }) => {
  await page.goto('http://localhost:5174');

  // Click the articles button
  await page.click('text=Articles');

  // Expect to see the WordPress settings page
  await expect(page.locator('text=WordPress Configuration')).toBeVisible();

  // Fill in the credentials
  await page.fill('#wp-url', 'https://streamstack.info/');
  await page.fill('#wp-username', 'Stackmin');
  await page.fill('#wp-password', 'GVcX o1zP 1XCm 5mke ufM7 WYvY');

  // Click the connect button
  await page.click('text=Connect to WordPress');

  // Expect to see the WordPress generator page
  await expect(page.locator('text=Generate WordPress Articles')).toBeVisible();
});