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
  console.log("esperando carga");
  // espero a que cargue 20 segundos la pagina
  await page.waitForTimeout(10000);
  console.log("pagina cargada");
  // guardo una captura 
  await cierraPopup(page);
  console.log("popup cerrado");
  await page.screenshot({ path: `/opt/osbo/cinemarkiiiii${o}.png`, fullPage: true });
  // las lista de pelis tiene este class MuiGrid-root MuiGrid-container MuiGrid-spacing-lg-6 mui-s6q88m
  const contenedor = await page.locator('.MuiGrid-root.MuiGrid-container.MuiGrid-spacing-lg-6.mui-s6q88m');
  // cada peli tiene este class MuiGrid-root MuiGrid-item MuiGrid-grid-sm-6 MuiGrid-grid-md-3 mui-mfo1dw
  const pelis = contenedor.locator('.MuiGrid-root.MuiGrid-item.MuiGrid-grid-sm-6.MuiGrid-grid-md-3.mui-mfo1dw');
  console.log("Peliculas encontradas:", await pelis.count());
  await page.screenshot({ path: `/opt/osbo/cinemark${o}.png`, fullPage: true });
  const ciudad: Ciudad = {} as Ciudad;
  ciudad.ciudad = "Santa Cruz";
  ciudad.peliculas = [];
  // recorro la lista si hay lista
  for (let i = 0; i < await pelis.count(); i++) {
    const peli = pelis.nth(i);
    peli.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `/opt/osbo/cinemark-peli${o}-${i}-before.png`, fullPage: true });
    ciudad.peliculas[i] = await procesapelicula(page);
    // capturo pantalla de la pelicula
    await page.screenshot({ path: `/opt/osbo/cinemark-peli${o}-${i}.png`, fullPage: true });
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
  try {
    const otherbu = page.locator('.modal-cookies__accept-button');
    if (await otherbu.count() > 0) {
      try {
        await otherbu.nth(0).click({ timeout: 3000 });
      } catch (e) {
        console.log('No se pudo cerrar cookie modal');
      }
    }
    // ahy otro boton posible con esta clase que tambien hhay que hacer lo mismo MuiButtonBase-root MuiButton-root MuiButton-icon MuiButton-iconFilled MuiButton-sizeMedium MuiButton-iconSizeMedium MuiButton-colorFilled MuiButton-root MuiButton-icon MuiButton-iconFilled MuiButton-sizeMedium MuiButton-iconSizeMedium MuiButton-colorFilled mui-ln6w1i
    const otherbu2 = page.locator('.MuiButtonBase-root.MuiButton-root.MuiButton-icon.MuiButton-iconFilled.MuiButton-sizeMedium.MuiButton-iconSizeMedium.MuiButton-colorFilled.mui-ln6w1i');
    if (await otherbu2.count() > 0) {
      try {
        await otherbu2.nth(0).click({ timeout: 3000 });
      } catch (e) {
        console.log('No se pudo cerrar cookie modal 2');
      }
    }
  } catch (e) {
    console.log('Cookie modal check falló');
  }

  try {
    const button = page.locator('.close.closeMovie');
    if (await button.count() > 0) {
      try {
        await button.nth(0).click({ timeout: 3000 });
      } catch (e) {
        console.log('No se pudo cerrar movie modal');
      }
    }
  } catch (e) {
    console.log('Movie modal check falló');
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
  // titulo tiene el class MuiTypography-root MuiTypography-h1 mui-129h4q2
  const titulo = await page.locator('.MuiTypography-root.MuiTypography-h1.mui-129h4q2').first();
  peli.titulo = (await titulo.innerText()) || '';
  console.log("Procesando pelicula:", peli.titulo);
  peli.horarios = [];
  const listaHorarios = page.locator('.MuiBox-root.mui-1onlnyv').first();
  const tithorarios = listaHorarios.locator('.MuiBox-root.mui-ct48ax');
  const dethorarios = listaHorarios.locator('.MuiBox-root.mui-13wu688');
  console.log("Grupos de horarios encontrados:", await tithorarios.count());
  console.log("Grupos de horarios encontrados(det):", await dethorarios.count());
  for (let j = 0; j < await tithorarios.count(); j++) {
    const itemtitulo = tithorarios.nth(j);
    const itemdethorarios = dethorarios.nth(j);
    const horario = {} as Horario;
    const lenguajediv = itemtitulo.locator('.MuiTypography-root.MuiTypography-body2.mui-1xj2a7k');

    if (await lenguajediv.count() > 0) {
      const idioma = await lenguajediv.textContent();
      // el idioma viene con un "·"
      const idiomaclean = idioma ? idioma.replace('·', '').trim() : '';
      horario.idioma = idiomaclean;
      console.log("Idioma encontrado:", horario.idioma);

    }
    const formato = itemtitulo.locator('.MuiTypography-root.MuiTypography-body2.mui-5gkdq5');
    if (await formato.count() > 0) {
      horario.formato = (await formato.textContent() || '').trim();
      console.log("Formato encontrado:", horario.formato);
    }

    const lista = itemdethorarios.locator('.MuiBox-root.mui-19midw5');
    if (await lista.count() > 0) {
      for (let k = 0; k < await lista.count(); k++) {
        const horaItem = lista.nth(k);
        // creo copia de horario
        const horariocp = { ...horario };
        horariocp.horario = await horaItem.innerText();
        //LOS HORARIOS terminan en hs , los quiero quitar aqui
        horariocp.horario = horariocp.horario.replace('hs', '').trim();
        peli.horarios.push(horariocp);
        console.log("Horario encontrado:", horariocp.horario);
      }


    }


  }
  return peli;
}

