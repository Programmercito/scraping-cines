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
  let ciudad: Ciudad = { peliculas: [], ciudad: '' };
  let ciu = page.locator('.dropdownHeader').last();
  ciudad.ciudad = await ciu.innerText();
  console.log(`Ciudad: ${ciudad.ciudad}`);
  // recorrotodos y les doy click
  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const item = listabotones.nth(i);
      await item.click();
      await page.waitForTimeout(3000); // espera para que cargue
      let pelicula = await procesarHorarios(page); // mando a procesar la pagina a otra funcion
      await page.goBack(); // vuelvo a la pagina anterior
      ciudad.peliculas.push(pelicula);
    }
  }

}
interface Ciudad {
  peliculas: Pelicula[];
  ciudad: string;
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
  // busco el componente con el class swiper-slide swiper-slide-next
  const fecha = await page.locator('.swiper-slide.swiper-slide-next');
  // verificamos si fecha ha sido encontrado
  if (fecha) {
    // busco el componente con el class showtimewrapper
    const diacito=fecha.locator('.text-size-xlarge.text-weight-bold');

    const fechaTexto = await diacito.innerText();
    console.log(`Fecha: ${fechaTexto}`);
    const dia = await diaManana();
    if (fechaTexto === dia.toString()) {
      // espero 3 segundos
      await page.waitForTimeout(3000);
      // busco los componentes con el class showtimewrapper
      const horarios = page.locator('.showtimewrapper');
      // recorro los compoenntes
      const count = await horarios.count();
      console.log(`Total de horarios encontrados: ${count}`);
      // recorro los horarios
      for (let i = 0; i < count; i++) {
        const item = horarios.nth(i);
        const horario = item.locator('.showtime');
        const hora = await horario.innerText();
        // si horario tiene la class btn-disable se lo quito
        const className = await horario.getAttribute('class');
        if (className && className.includes('btn-disable')) {
          // quito la class btn-disable a horario
          await horario.evaluate((el: any) => el.classList.remove('btn-disable'));
        }
        horario.click({ force: true });
        await page.waitForTimeout(3000); // espero 3 segundos
        // obtener el objeto con la class MuiTypography-root MuiTypography-inherit MuiLink-root MuiLink-underlineAlways tagLink css-z4r21k
        const objeto = page.locator('.MuiTypography-root.MuiTypography-inherit.MuiLink-root.MuiLink-underlineAlways.tagLink.css-z4r21k').first();
        // otener el objeto con el class language-tag
        const lenguaje = page.locator('.language-tag').first();
        // obtener el texto del objeto
        const tipopelicula = await objeto.innerText();
        const lenguajeTexto = (await lenguaje.innerText()).substring(0, 2);

        pelicula.horarios.push(hora + " " + tipopelicula + " " + lenguajeTexto);
        console.log(`Horario: ${hora} ${tipopelicula} ${lenguajeTexto}`);
        await page.goBack();
      }
      await page.goBack();
      return pelicula;
    } else {
      return null;
    }
  } else {
    return null;
  }
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
  const button = page.locator('.button.is-full-width.w-button.false').last();
  // le doy click al boton
  await button.click({ force: true });
  // espero 3 segundos
  await page.waitForTimeout(5000);
  // capturo la pantalla
  await page.screenshot({ path: 'screenshot.png' });
}

async function diaManana() {
  // es un metodo para decir en int el dia de ma;ana es por ejemplo hoy es 14 ma;an es 15
  const hoy = new Date();
  const manana = new Date(hoy.getTime() + (24 * 60 * 60 * 1000));
  const dia = manana.getDate();
  return dia;
}