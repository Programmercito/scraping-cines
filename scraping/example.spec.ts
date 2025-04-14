import { test, expect, Page } from '@playwright/test';

test('Obtener ciudades del dropdown', async ({ page }) => {
  await page.goto('https://www.multicine.com.bo/', { waitUntil: 'load' });
  await page.waitForTimeout(3000); // espera para que cargue
  // captura de pantalla
  await page.screenshot({ path: 'screenshot.png' });
  const header = page.locator('.dropdownHeader').last();
  await header.click();
  // captura de pantalla
  await page.screenshot({ path: 'screenshot.png' });
  const items = page.locator('.dropdownBody.open');

  // imprimo el contenido html de items
  const itemsHtml = await items.innerHTML();
  console.log(itemsHtml);

  const dropdownItems = items.locator('.dropdownItem');
  const count = await dropdownItems.count();
  console.log(`Total de elementos encontrados: ${count}`);

  // saltandome el primer elemento voy a ir uno por uno dandole click esperando por click 3 segundos y sacando captura de cada uno de lllos 
  for (let i = 1; i < count; i++) {
    const item = dropdownItems.nth(i);
    await item.click();
    await page.waitForTimeout(3000); // espera para que cargue
    // mando a procesar la pagina a otra funcion 
    await procesarPagina(page);
    // captura de pantalla
    await page.screenshot({ path: `screenshot${i}.png` });
    await header.click(); // vuelvo a abrir el dropdown
  }


});

async function procesarPagina(page: Page) {
  const list = page.locator('.grid-row.custom-row');
  const listabotones = list.locator('.button.is-small.w-button.buy_tickets.false');
  const count = await listabotones.count();
  console.log(`Total de elementos encontrados: ${count}`);

}

