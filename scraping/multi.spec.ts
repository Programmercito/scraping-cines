import { test, expect, Page } from '@playwright/test';
import dotenv from 'dotenv';
import TeleBot from "telebot";

test('Obtener ciudades del dropdown', async ({ page }) => {

  await page.goto('https://www.multicine.com.bo/', { waitUntil: 'load' });
  await page.waitForTimeout(7500); // espera a que la página cargue completamente
  //await login(page);
  const header = page.locator('.dropdownHeader').last();
  await header.click();
  const items = page.locator('.dropdownBody.open');

  // Obtiene y muestra el HTML del menú desplegable
  const itemsHtml = await items.innerHTML();

  const dropdownItems = items.locator('.dropdownItem');
  const count = await dropdownItems.count();
  console.log(`Total de elementos encontrados en ciudades: ${count - 1}`);
  const ciudadArray: string[] = [];
  dotenv.config();
  const token = process.env.TOKEN;
  const chatId = process.env.CHATID;
  const cine = process.env.CINE;

  const bot = new TeleBot({
    token: token,
  });
  await bot.start(); 
  await bot.sendMessage(chatId, ".", { disable_notification: true })
    .then(() => console.log('Mensaje enviado'))
    .catch((error) => console.error('Error al enviar el mensaje:', error));

  // Recorre las ciudades (excepto la primera que es el mensaje de selección)
  for (let i = 1; i < count; i++) {
    const item = dropdownItems.nth(i);
    await item.click();
    await page.waitForTimeout(7500); // espera a que cargue la ciudad seleccionada

    // Guarda captura de la página con la ciudad seleccionada
    //await page.screenshot({ path: `screenshot-ciudad-${i}.png` });

    // Procesa las películas de esta ciudad y lo guargo en un array de strings
    const ciudad = await procesarPagina(page);
    // lo guargo en un array
    ciudadArray.push(ciudad);

    // Vuelve a la página principal para seleccionar la siguiente ciudad
    await page.goto('https://www.multicine.com.bo/', { waitUntil: 'load' });
    await page.waitForTimeout(7500);
    const header = page.locator('.dropdownHeader').last();
    await header.click();
  }


  // envio el array
  await bot.sendMessage(chatId, cine, { disable_notification: true })
    .then(() => console.log('Mensaje enviado'))
    .catch((error) => console.error('Error al enviar el mensaje:', error));

  for (const ciudad of ciudadArray) {

    await bot.sendMessage(chatId, await ciudad, { disable_notification: true })
      .then(() => console.log('Mensaje enviado'))
      .catch((error) => console.error('Error al enviar el mensaje:', error));

    console.log(ciudad);
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
      await page.waitForTimeout(7500); // espera a que cargue la información de la película

      // Guarda captura de la pantalla de detalles de la película
      //await page.screenshot({ path: `screenshot-pelicula-${i}.png` });

      // Procesa los horarios de la película actual
      let pelicula = await procesarHorarios(page);
      //await page.goBack(); // vuelve a la lista de películas
      //await page.waitForTimeout(7500); // espera a que cargue la lista de películas
      //await page.screenshot({ path: `screenshot-peliculaxx-${i}.png` });
      // Deshabilitado: Agregar la película al objeto ciudad
      if (pelicula) {
        ciudad.peliculas.push(pelicula);
      }
    }
  }
  const total = await ciudadString(ciudad);
  console.log(total);
  return total;
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
  // Obtiene el título de la película
  const titulo = await page.locator('.text-size-xlarge.text-weight-semibold.text-color-white').first();
  let pelicula: Pelicula = { titulo: '', horarios: [] };
  pelicula.titulo = await titulo.innerText();
  console.log(`Título de película: ${pelicula.titulo}`);
  // si pelicula.titulo tiene valor continuo
  if (pelicula.titulo === '') {
    console.log('No se encontró el título de la película');
    return null;
  }
  const dia = await diaManana();

  // Busca la fecha de mañana (pestaña siguiente día)
  const fechas = await page.locator('.swiper-slide');
  let escogido;
  let costo = 0;
  // fechas deberais haber encontrado mas de uno si es mas de uno recorrelos todos
  for (let i = 0; i < await fechas.count(); i++) {
    const fechat = fechas.nth(i);
    const fechatexto = fechat.locator('.text-size-xlarge.text-weight-bold');
    const texto = await fechatexto.innerText();
    costo += 1;
    if (texto === dia.toString()) {
      escogido = fechat;
      break;
    }
  }

  // Verifica si existe la pestaña de fecha para mañana
  if (escogido) {
    escogido.click({ force: true });
    await page.waitForTimeout(7500);

    // Busca los contenedores de horarios disponibles
    const horarios = page.locator('.showtimewrapper');
    const count = await horarios.count();
    console.log(`Total de horarios encontrados: ${count}`);

    // Procesa cada horario individualmente
    for (let i = 0; i < count; i++) {
      const item = horarios.nth(i);
      const horario = item.locator('.showtime');
      const hora = await horario.innerText();

      // Habilita horarios deshabilitados para poder hacer clic
      const className = await horario.getAttribute('class');
      if (className && className.includes('btn-disable')) {
        await horario.evaluate((el: any) => el.classList.remove('btn-disable'));
      }

      // Hace clic en el horario para ver detalles
      horario.click({ force: true });
      await page.waitForTimeout(7500);

      // Extrae información adicional del horario (formato y lenguaje)
      const objeto = page.locator('.MuiTypography-root.MuiTypography-inherit.MuiLink-root.MuiLink-underlineAlways.tagLink.css-z4r21k').first();
      const lenguaje = page.locator('.language-tag').first();
      const tipopelicula = await objeto.innerText();
      const lenguajeTexto = (await lenguaje.innerText()).substring(0, 2);

      // Guarda la información completa del horario
      pelicula.horarios.push(hora + " " + tipopelicula + " " + lenguajeTexto);
      console.log(`Horario disponible: ${hora} ${tipopelicula} ${lenguajeTexto}`);

      await page.goBack();
      await page.waitForTimeout(7500);

      // Captura de pantalla después de volver a la lista de horarios
      //await page.screenshot({ path: `screenshot-horario-${i}.png` });
    }
    await page.goBack();
    await page.waitForTimeout(7500);
    if (costo > 1) {
      await page.goBack();
      await page.waitForTimeout(7500);
    }
    return pelicula;

  } else {
    await page.goBack();
    await page.waitForTimeout(7500);
    // No se encontró la pestaña para el día siguiente
    return null;
  }
}

async function login(page: Page) {
  // Hace clic en el botón de inicio de sesión
  const login = page.locator('.top-nav_label.is-mobile').first();
  login.click();
  await page.waitForTimeout(7500);

  // Ingresa credenciales de usuario
  const email = page.locator('input[name="email"]').first();
  await email.fill("juan8923242@outlook.com");

  const password = page.locator('input[name="password"]').first();
  await password.fill("12345678");

  // Hace clic en el botón de iniciar sesión
  const button = page.locator('.button.is-full-width.w-button.false').last();
  await button.click({ force: true });

  // Espera a que se complete el inicio de sesión
  await page.waitForTimeout(7500);
}

async function diaManana() {
  // Calcula el número del día de mañana (ej: si hoy es 14, mañana es 15)
  const hoy = new Date();
  const manana = new Date(hoy.getTime() + (24 * 60 * 60 * 1000));
  const dia = manana.getDate();
  return dia;
}

async function ciudadString(ciudad: Ciudad): Promise<string> {
  let ciudadString = `Ciudad: ${ciudad.ciudad}\n`;
  for (const pelicula of ciudad.peliculas) {
    ciudadString += `${pelicula.titulo}\n`;
    for (const horario of pelicula.horarios) {
      ciudadString += `${horario}\n`;
    }
    ciudadString += '\n';
  }
  return ciudadString;
}