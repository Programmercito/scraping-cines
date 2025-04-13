import { test, expect } from '@playwright/test';

test('scraping-multicine', async ({ page }) => {
  const url = 'https://www.multicine.com.bo/';
  await page.goto(url, { waitUntil: 'load' });
  // espero 4 segundos
  await page.waitForTimeout(4000);
  // guardo captura de pantalla
  await page.screenshot({ path: 'multicine.png' });

  
});
