import { test } from '@playwright/test';

test('scraping-multicine', async ({ page }) => {
  const url = 'https://www.multicine.com.bo/';
  await page.goto(url, { waitUntil: 'load' });
  // espero 4 segundos
  // guardo captura de pantalla
  await page.screenshot({ path: 'multicine.png' });

  // consigo el compoennte visible que tenga un class
  const element = await page.$('.locationDropdown.undefined');
  // imprimo el contenido en html
  const elementHtml = await element?.evaluate((el) => el.innerHTML);
  console.log('elementHtml', elementHtml);



});
