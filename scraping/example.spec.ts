import { test, expect } from '@playwright/test';

test('scraping-multicine', async ({ page }) => {
  await page.goto('https://www.multicine.com.bo/');
  //guardo una captura de la pantalla
  await page.screenshot({ path: 'multicine.png' });

});
