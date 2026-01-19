import { test, expect, Page } from '@playwright/test';
import dotenv from 'dotenv';
import { parse } from 'path';
import { JsonFile, Ciudad, Pelicula, Horario, SystemCommandExecutor, ProcessMovie, CineDataProcessor, TelegramPublisher } from './common/common';

test('megacenter', async ({ page }) => {

  let o = 0;
  let count = 0;
  const ciudadArray: Ciudad[] = [];
  dotenv.config();

  const token = process.env.TOKEN;
  const chatId = process.env.CHATID;
  const cine = process.env.CINE4;
  const telegram = process.env.TELEGRAM;

  // Crear instancia de TelegramPublisher
  const telegramPublisher = new TelegramPublisher(token || '', chatId || '', telegram || '');


  console.log("Iniciando");
  await page.goto('https://www.cinemark.com.bo/');
  // espero a que cargue 20 segundos la pagina
  await page.waitForTimeout(10000);
  // guardo una captura 
  await cierraPopup(page);
  // obtengo el componente que tiene las pelis con clase "transform: translateX(0px); transition: transform 0.5s; flex-basis: 269px; visibility: visible;"
  const peliculasContainer = page.locator('.VueCarousel-inner');
  const pelis = await peliculasContainer.locator('.VueCarousel-slide.weekly-billboard');
  console.log("Peliculas encontradas:", await pelis.count());
  await page.screenshot({ path: `cinemark${o}.png`, fullPage: true });
  const ciudad: Ciudad = {} as Ciudad;
  ciudad.ciudad = "Santa Cruz";
  ciudad.peliculas = [];
  // recorro la lista si hay lista
  for (let i = 0; i < await pelis.count(); i++) {
    const peli = pelis.nth(i);
    peli.click();
    await page.waitForTimeout(5000);
    ciudad.peliculas[i] = await procesapelicula(page);
    // capturo pantalla de la pelicula
    await page.screenshot({ path: `cinemark-peli${o}-${i}.png`, fullPage: true });
    await page.goBack();
    await page.waitForTimeout(5000);
    await cierraPopup(page);

  }


  ciudadArray.push(ciudad);

  // obtengo ruta de guardado
  const savePath = JsonFile.getSavePath() + JsonFile.getDocsPath();
  // creao un objeto cine con las ciudades y la fecha
  const cineData = {
    ciudades: ciudadArray,
    cine: cine,
    fecha: await diahoycompleto()
  };

  // Procesar y guardar datos del cine
  await CineDataProcessor.processCineData(cineData, "4.json");

  // Publicar en Telegram
  await telegramPublisher.publicar(cineData, cine || '', await diahoycompleto());
});
async function cierraPopup(page: Page) {
  const otherbu = page.locator('.modal-cookies__accept-button');
  if (await otherbu.count() > 0) {
    await otherbu.nth(0).click();
  }
  const button = page.locator('.close.closeMovie');
  if (await button.count() > 0) {
    await button.nth(0).click();
  }
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
async function procesapelicula(page: Page): Promise<Pelicula> {
  const peli = {} as Pelicula;
  const titulo = await page.locator('.col-xs-8.col-sm-9.col-md-9.col-lg-9');
  const textot = await titulo.locator('h1').innerText();
  peli.titulo = textot.trim();
  peli.horarios = [];
  const listaHorarios = page.locator('.movie-schedule');
  const items = await listaHorarios.locator('.box-movie-format');
  if (await items.count() > 0) {
    for (let j = 0; j < await items.count(); j++) {
      const item = items.nth(j);
      const horario = {} as Horario;
      const lenguajediv = item.locator('.movie-lenguaje');

      if (await lenguajediv.count() > 0) {
        const idioma = lenguajediv.locator('.tag-DOB');
        if (await idioma.count() > 0) {
          horario.idioma = await idioma.first().textContent() || '';
        }

      }
      const formato = await page.locator('.movie-version');
      if (await formato.count() > 0) {
        horario.formato = await formato.textContent() || '';
      }
      const hora = await item.locator('.movie-times');
      if (await hora.count() > 0) {
        const lista = await hora.locator('.btn.btn-buy');
        if (await lista.count() > 0) {
          for (let k = 0; k < await lista.count(); k++) {
            const horaItem = lista.nth(k);
            // creo copia de horario
            const horariocp = { ...horario };
            horariocp.horario = await horaItem.innerText();
            peli.horarios.push(horariocp);
          }
        }
      }

    }
  }
  return peli;
}

