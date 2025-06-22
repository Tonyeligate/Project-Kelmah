const { test, expect } = require('@playwright/test');
 
test('homepage loads', async ({ page }) => {
  const baseURL = process.env.NGROK_URL || 'http://localhost:5173';
  await page.goto(baseURL);
  await expect(page.locator('text=Login')).toBeVisible();
}); 