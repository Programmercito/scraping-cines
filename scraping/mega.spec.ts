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
  const cine = process.env.CINE2;
  const telegram = process.env.TELEGRAM;

  // Crear instancia de TelegramPublisher
  const telegramPublisher = new TelegramPublisher(token || '', chatId || '', telegram || '');

  do {
    console.log("Iniciando!!!");
    await page.goto('https://cinecenter.com.bo/');
    // espero a que cargue 20 segundos la pagina
    await page.waitForTimeout(10000);
    console.log("termino espera!!!");
    // guardo una captura 

    await cierraPopup(page, true);
    console.log("se cerro poppup comenzamos!!!");
    // cargamos capturamos la pantalla


    const dropdown = page.locator('.e-ddl.e-lib.e-input-group.e-control-container.e-control-wrapper');
    // imprimo el texto de cada uno de los componentes
    const drop = await dropdown.nth(0);
    await drop.evaluate((element) => {
      const event = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(event);
    });
    // espero 2 segundos
    await page.waitForTimeout(20000);
    // capturo pantalla de cada uno de los componentes
    const lista = page.locator('.e-ddl.e-control.e-lib.e-popup.background.e-popup-open');
    // recorro todos los elementos de la lista
    const lis = lista.locator('.e-list-item');
    count = await lis.count();
    const item = lis.nth(o);
    // imprimo el texto dentro de item
    const texto2 = await item.evaluate((element) => element.innerHTML);
    if (texto2) {
      console.log(texto2);
    }
    item.click();

    await cierraPopup(page, true);
    // captura pantalla con el nombre de la ciudad
    await page.screenshot({ path: `/opt/osbo/screenshot-ciudad-${o}.png` });
    // Procesa las películas de esta ciudad y lo guargo en un array de Ciudad
    const ciudad: Ciudad = await procesarPagina(page, texto2);
    // lo guargo en un array
    ciudadArray.push(ciudad);


    o++;

  } while (o < count);
  // obtengo ruta de guardado
  const savePath = JsonFile.getSavePath() + JsonFile.getDocsPath();
  // creao un objeto cine con las ciudades y la fecha
  const cineData = {
    ciudades: ciudadArray,
    cine: cine,
    fecha: await diahoycompleto()
  };
  
  // Procesar y guardar datos del cine
  await CineDataProcessor.processCineData(cineData, "1.json");

  // Publicar en Telegram
  await telegramPublisher.publicar(cineData, cine || '', await diahoycompleto());
});


async function refrescarPagina(page: Page) {
  // espero 20 segundos
  await page.waitForTimeout(20000);
  // refresco la pagina
  await page.reload();
  console.log('Refrescando la pagina');
  // espero 20 segundos
  await page.waitForTimeout(20000);
}

async function cierraPopup(page, reload = false) {
  if (reload) {
    await page.waitForTimeout(20000);
    let listapelis = page.locator('.items-container.multifila').first();
    // recorro la lista
    let lista = listapelis.locator('.item-container');
    let coun = await lista.count();
    let intentos = 0;

    while (coun === 0 && intentos < 5) {
      await refrescarPagina(page);
      listapelis = page.locator('.items-container.multifila').first();
      lista = listapelis.locator('.item-container');
      coun = await lista.count();
      intentos++;
      console.log(`Intento ${intentos} - elementos encontrados: ${coun}`);
    }
  }
  // obetenemos el modal que tiene la clase modal-content
  const boton = await page.$('.btn-cerrar');
  // verifico si esta visible
  const visible = await boton?.isVisible();

  // si el modal existe lo cerramos
  if (boton && visible) {
    // intento hacer clic en el botón de cierre dentro del modal
    await boton.click();
    await page.waitForTimeout(5000);

  }
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
async function procesarPagina(page: Page, ciu: string): Promise<Ciudad> {
  const listapelis = page.locator('.items-container.multifila').first();
  // recorro la lista
  const lista = listapelis.locator('.item-container');
  const coun = await lista.count();
  console.log('Cantidad de peliculas: ' + coun);
  let ciudad: Ciudad = { peliculas: [], ciudad: '' };
  ciudad.ciudad = ciu;
  for (let i = 0; i < coun; i++) {
    const item = lista.nth(i);
    item.click();
    // espero 4 segundos
    await page.waitForTimeout(4000);
    let pelicula: Pelicula = { titulo: '', horarios: [], id: '' };

    const pe = page.locator('.nombre-pelicula');
    //leo el contenido
    const texto = await pe.evaluate((element) => element.innerHTML);
    if (texto) {
      console.log(texto);
      pelicula.titulo = texto;
    }
    let dias = page.locator('.opcion-fecha');
    let diaco = await dias.count();

    let intentos = 0;
    while (diaco === 0 && intentos < 5) {
      await refrescarPagina(page);
      dias = page.locator('.opcion-fecha');
      diaco = await dias.count();
      intentos++;
      console.log(`Intento ${intentos} - días encontrados: ${diaco}`);
    }

    const este = await diahoy();
    let clickeardia: any;
    for (let j = 0; j < diaco; j++) {
      const dia = dias.nth(j);
      const numero = await dia.locator('div[style*="font-size:60px"]').innerText();
      //console.log('Número:', numero);
      if (parseInt(numero) === este) {
        clickeardia = dia;
        break;
      }
    }
    if (!clickeardia) {
      console.log('No se encontró el día de hoy en la lista de días.');
      page.goBack();
      await page.waitForTimeout(6000);
      await cierraPopup(page, true);
      continue; // Salimos del bucle si no encontramos el día
    }
    clickeardia.click();
    await page.waitForTimeout(2000);
    const formatos = page.locator('.btn-formato');
    const formacount = await formatos.count();
    for (let j = 0; j < formacount; j++) {
      const formato = formatos.nth(j);
      formato.click();
      await page.waitForTimeout(2000);
      const fortext = await formato.evaluate((element) => element.textContent);
      const horarios = page.locator('.e-control.e-btn.e-lib.e-flat.e-primary');
      const horacount = await horarios.count();
      for (let k = 0; k < horacount; k++) {
        const horario = horarios.nth(k);
        // leo el contenido
        const texto = await horario.evaluate((element) => element.textContent);
        // split de - y agarro el primero
        const hor = texto?.split('-')[0].trim();
        console.log(hor + ' ' + fortext);
        let listadatos = fortext?.split(' ');
        // obtengo el idioma que es el el ultimo elemento de lista
        const idioma = listadatos ? listadatos[listadatos.length - 1] : '';
        // obtengo el formato que es todo el array menos el ultimo elemento
        const formato = listadatos ? listadatos.slice(0, -1).join(' ') : '';
        const horarioObj: Horario = {
          horario: hor || '',
          idioma: idioma || '',
          formato: formato || ''
        };

        pelicula.horarios.push(horarioObj);

      }
    }
    ciudad.peliculas.push(pelicula);
    page.goBack();
    await page.waitForTimeout(4000);
    await cierraPopup(page, true);

  }
  return ciudad;
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
