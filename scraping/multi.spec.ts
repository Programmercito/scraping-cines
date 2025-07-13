import { test, expect, Page } from '@playwright/test';
import dotenv from 'dotenv';
import { parse } from 'path';
import TeleBot from "telebot";
import { JsonFile, Ciudad, Pelicula, Horario, SystemCommandExecutor, ProcessMovie } from './common';


test('multicine', async ({ page }) => {

  await page.goto('https://www.multicine.com.bo/', { waitUntil: 'load' });
  await page.waitForTimeout(20000); // espera a que la página cargue completamente
  //await login(page);
  const header = page.locator('.dropdownHeader').last();
  await header.click();
  const items = page.locator('.dropdownBody.open');

  // Obtiene y muestra el HTML del menú desplegable
  const itemsHtml = await items.innerHTML();

  const dropdownItems = items.locator('.dropdownItem');
  const count = await dropdownItems.count();
  console.log(`Total de elementos encontrados en ciudades: ${count - 1}`);
  const ciudadArray: Ciudad[] = [];
  dotenv.config();
  const token = process.env.TOKEN;
  const chatId = process.env.CHATID;
  const cine = process.env.CINE;
  const telegram = process.env.TELEGRAM;

  const bot = new TeleBot({
    token: token,
  });
  //await bot.start();


  // Recorre las ciudades (excepto la primera que es el mensaje de selección)
  for (let i = 1; i < count; i++) {
    const item = dropdownItems.nth(i);
    await item.click();
    await page.waitForTimeout(20000); // espera a que cargue la ciudad seleccionada

    // Guarda captura de la página con la ciudad seleccionada
    //await page.screenshot({ path: `screenshot-ciudad-${i}.png` });

    // Procesa las películas de esta ciudad y lo guargo en un array de strings
    const ciudad: Ciudad = await procesarPagina(page);
    // lo guargo en un array
    ciudadArray.push(ciudad);

    // Vuelve a la página principal para seleccionar la siguiente ciudad
    await page.goto('https://www.multicine.com.bo/', { waitUntil: 'load' });
    await page.waitForTimeout(20000);
    const header = page.locator('.dropdownHeader').last();
    await header.click();
  }

  // obtengo ruta de guardado
  const savePath = JsonFile.getSavePath() + JsonFile.getDosPath();
  // creao un objeto cine con las ciudades y la fecha
  const cineData = {
    ciudades: ciudadArray,
    cine: cine,
    fecha: await diahoycompleto()
  };
  SystemCommandExecutor.gitPull(savePath);
  //recorro las peliculas a enviar en cineData
  cineData.ciudades.forEach(ciudad => {
    ciudad.peliculas.forEach(pelicula => {
      const idpeli=await ProcessMovie.processsMovie(pelicula.titulo);
    });
  });
  JsonFile.saveToJson(cineData, `${savePath}/2.json`);
  SystemCommandExecutor.gitCommitAndPush("Agregando horarios de cine", JsonFile.getSavePath());


  if (process.env.DISABLE_TELEGRAM !== 'TRUE') {

    for (const ciudad of ciudadArray) {
      if (telegram === 'true') {
        await bot.sendMessage(chatId, "<b>" + cine + "</b>\n" + (await diahoycompleto()) + "\n" + (await ciudad) + "\n" + cine + "\n" + (await diahoycompleto()), {
          notification: false,
          parseMode: 'html'
        })
          .then(() => console.log('Mensaje enviado'))
          .catch((error) => console.error('Error al enviar el mensaje:', error));
        await page.waitForTimeout(1000);
      }
      console.log(ciudad);
    }
  }
});

async function procesarPagina(page: Page) {
  const list = page.locator('.grid-row.custom-row');
  const listabotones = list.locator('.button.is-small.w-button.buy_tickets.false');
  const count = await listabotones.count();
  console.log(`Total de películas encontradas: ${count}`);

  let ciudad: Ciudad = { peliculas: [], ciudad: '' };
  let ciu = page.locator('.dropdownHeader').last();
  ciudad.ciudad = await ciu.innerText();
  console.log(`Ciudad actual: ${ciudad.ciudad}`);

  // Recorre todas las películas disponibles
  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const item = listabotones.nth(i);
      await item.click();
      await page.waitForTimeout(20000); // espera a que cargue la información de la película

      // Guarda captura de la pantalla de detalles de la película
      //await page.screenshot({ path: `screenshot-pelicula-${i}.png` });

      // Procesa los horarios de la película actual
      let pelicula: Pelicula | null = await procesarHorarios(page);
      //await page.goBack(); // vuelve a la lista de películas
      //await page.waitForTimeout(15500); // espera a que cargue la lista de películas
      //await page.screenshot({ path: `screenshot-peliculaxx-${i}.png` });
      // Deshabilitado: Agregar la película al objeto ciudad
      if (pelicula) {
        ciudad.peliculas.push(pelicula);
      }
    }
  }
  return ciudad;
}



async function procesarHorarios(page: Page): Promise<Pelicula | null> {
  // Obtiene el título de la película
  const titulo = await page.locator('.text-size-xlarge.text-weight-semibold.text-color-white').first();
  let pelicula: Pelicula = { titulo: '', horarios: [], id: '' };
  pelicula.titulo = await titulo.innerText();
  console.log(`Título de película: ${pelicula.titulo}`);
  // si pelicula.titulo tiene valor continuo
  if (pelicula.titulo === '') {
    console.log('No se encontró el título de la película');
    return null;
  }
  const dia = await diahoy();

  // Busca la fecha de mañana (pestaña siguiente día)
  const fechas = await page.locator('.swiper-slide');
  let escogido;
  let costo = 0;
  // fechas deberais haber encontrado mas de uno si es mas de uno recorrelos todos
  for (let i = 0; i < await fechas.count(); i++) {
    const fechat = fechas.nth(i);
    const fechatexto = fechat.locator('.text-size-xlarge.text-weight-bold');
    const texto = await fechatexto.innerText();
    // texto puede venir asi 04 o 05 o 06 como lo vuelvo a su entero osea 4, 5,6 
    const tex = parseInt(texto);
    costo++;
    if (tex === dia) {
      escogido = fechat;
      break;
    }
  }
  let url = page.url();
  // Verifica si existe la pestaña de fecha para mañana
  if (escogido) {

    escogido.click({ force: true });
    await page.waitForTimeout(20000);

    const tipospeli = page.locator('.showtimesrow');
    const count = await tipospeli.count();
    for (let i = 0; i < count; i++) {
      const item = tipospeli.nth(i);
      // obtengo titulo
      const formato = item.locator('.text-size-regular.text-color-gray').first();
      const formatotit = await formato.innerText();
      const horarios = item.locator('.showtimewrapper');
      const counthorarios = await horarios.count();
      for (let j = 0; j < counthorarios; j++) {
        // obtendo el idioma
        const idioma = horarios.nth(j).locator('.is-small');
        const idiomaTexto = await idioma.innerText();
        // obtengo el hoario
        const horario = horarios.nth(j).locator('.showtime');
        const horarioTexto = await horario.innerText();
        // creao un Horario vacio
        const horarioObj: Horario = {
          horario: horarioTexto,
          idioma: idiomaTexto,
          formato: formatotit
        };
        pelicula.horarios.push(horarioObj);
        console.log(`Horario: ${horarioTexto} ${idiomaTexto} ${formatotit}`);
      }
    }
    if (url !== page.url() && page.url() !== 'https://www.multicine.com.bo/') {
      await page.goBack();
      await page.waitForTimeout(5000);
      console.log('Volviendo a la lista de películas extra');
    }
    await page.goBack();
    await page.waitForTimeout(3000);

    return pelicula;

  } else {
    await page.goBack();
    await page.waitForTimeout(20000);
    // No se encontró la pestaña para el día siguiente
    return null;
  }
}

async function login(page: Page) {
  // Hace clic en el botón de inicio de sesión
  const login = page.locator('.top-nav_label.is-mobile').first();
  login.click();
  await page.waitForTimeout(20000);

  // Ingresa credenciales de usuario
  const email = page.locator('input[name="email"]').first();
  await email.fill("juan8923242@outlook.com");

  const password = page.locator('input[name="password"]').first();
  await password.fill("12345678");

  // Hace clic en el botón de iniciar sesión
  const button = page.locator('.button.is-full-width.w-button.false').last();
  await button.click({ force: true });

  // Espera a que se complete el inicio de sesión
  await page.waitForTimeout(20000);
}

async function diahoy() {
  // Calcula el número del día de mañana (ej: si hoy es 14, mañana es 15)
  const hoy = new Date();
  const dia = hoy.getDate();
  return dia;
}
// funcion con la fecha de ma;ana dia mes a;o
async function diahoycompleto() {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth() + 1; // Los meses son indexados desde 0
  const anio = hoy.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

async function ciudadString(ciudad: Ciudad): Promise<string> {
  let ciudadString = `Ciudad: ${ciudad.ciudad}\n`;
  for (const pelicula of ciudad.peliculas) {
    ciudadString += `<b>${pelicula.titulo}</b>\n`;
    for (const horario of pelicula.horarios) {
      ciudadString += `${horario.horario} - ${horario.idioma} - ${horario.formato}\n`;
    }
    ciudadString += '\n';
  }
  ciudadString += `Ciudad: ${ciudad.ciudad}\n`;
  return ciudadString;
}