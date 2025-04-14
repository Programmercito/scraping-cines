import { test, expect, Page } from '@playwright/test';

test('Obtener ciudades del dropdown', async ({ page }) => {

  await page.goto('https://www.multicine.com.bo/', { waitUntil: 'load' });
  await page.waitForTimeout(3000); // espera para que cargue
  await login(page);
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
  console.log(`Total de elementos encontrados en ciudades: ${count}`);

  // saltandome el primer elemento voy a ir uno por uno dandole click esperando por click 3 segundos y sacando captura de cada uno de lllos 
  for (let i = 1; i < count; i++) {
    const item = dropdownItems.nth(i);
    await item.click();
    await page.waitForTimeout(3000); // espera para que cargue
    // mando a procesar la pagina a otra funcion 
    await procesarPagina(page);
    // captura de pantalla
    await page.screenshot({ path: `screenshot${i}.png` });
    await page.goto('https://www.multicine.com.bo/', { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    const header = page.locator('.dropdownHeader').last();
    await header.click();
  }


});

async function procesarPagina(page: Page) {
  const list = page.locator('.grid-row.custom-row');
  const listabotones = list.locator('.button.is-small.w-button.buy_tickets.false');
  const count = await listabotones.count();
  console.log(`Total de elementos encontrados: ${count}`);
  // recorrotodos y les doy click
  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const item = listabotones.nth(i);
      await item.click();
      await page.waitForTimeout(3000); // espera para que cargue
      await procesarHorarios(page); // mando a procesar la pagina a otra funcion
      await page.goBack(); // vuelvo a la pagina anterior
    }
  }

}
interface Pelicula {
  titulo: string;
  horarios: string[];
}
async function procesarHorarios(page: Page) {
  // busco el compoenten con el class class="text-size-xlarge text-weight-semibold text-color-white"
  const titulo = await page.locator('.text-size-xlarge.text-weight-semibold.text-color-white').first();
  let pelicula: Pelicula = { titulo: '', horarios: [] };
  pelicula.titulo = await titulo.innerText();
  console.log(`Titulo: ${pelicula.titulo}`);
  // busco el componente con el class class="text-size-small text-weight-semibold text-color-white"    
}

async function login(page: Page) {
  // obtengo el componente top-nav_label is-mobile
  const login = page.locator('.top-nav_label.is-mobile').first();
  login.click();
  // espero 3 segundos
  await page.waitForTimeout(3000);
  // obtengo el componte input llamado email
  const email = page.locator('input[name="email"]').first();
  // escribo el mail ahi juan8923242@outlook.com
  await email.fill("juan8923242@outlook.com");
  // obtengo el componte input llamado email
  const password = page.locator('input[name="password"]').first();
  // escribo el mail ahi juan8923242@outlook.com
  await password.fill("12345678");
  // obtengo el boton con la clase "button  is-full-width w-button false"
  const button = page.locator('.button.is-full-width.w-button.false').first();
  button.click();
  // espero 3 segundos
  await page.waitForTimeout(3000);
  // capturo la pantalla
  await page.screenshot({ path: 'screenshot.png' });
}

