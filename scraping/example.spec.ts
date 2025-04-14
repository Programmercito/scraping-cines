import { test, expect } from '@playwright/test';

test('Obtener ciudades del dropdown', async ({ page }) => {
  await page.goto('https://www.multicine.com.bo/', { waitUntil: 'load' });
  await page.waitForTimeout(3000); // espera para que cargue
  // captura de pantalla
  await page.screenshot({ path: 'screenshot.png' });
  const header = page.locator('.dropdownHeader').last();
  await header.click();
  // captura de pantalla
  await page.screenshot({ path: 'screenshot2.png' });
  const items = page.locator('.dropdownBody.open');

  // imprimo el contenido html de items
  const itemsHtml = await items.innerHTML();
  console.log(itemsHtml);
  
  await page.screenshot({ path: 'screenshot23.png' });

});
