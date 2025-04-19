import { test, expect, Page } from '@playwright/test';
import dotenv from 'dotenv';
import { parse } from 'path';
import TeleBot from "telebot";

test('megacenter', async ({ page }) => {

  let o = 0;
  let count = 0;
  const ciudadArray: string[] = [];
  dotenv.config();

  const token = process.env.TOKEN;
  const chatId = process.env.CHATID;
  const cine = process.env.CINE;

  const bot = new TeleBot({
    token: token,
  });

  do {
    await page.goto('https://cinecenter.com.bo/');
    // espero a que cargue 20 segundos la pagina
    await page.waitForTimeout(5000);
    // guardo una captura 

    await cierraPopup(page);
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
    await page.waitForTimeout(2000);
    // capturo pantalla de cada uno de los componentes
    await page.screenshot({ path: `cinecenter abierto.png` });

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
    await page.waitForTimeout(8000);
    await cierraPopup(page);

    // Procesa las películas de esta ciudad y lo guargo en un array de strings
    const ciudad = await procesarPagina(page, texto2);
    // lo guargo en un array
    ciudadArray.push(ciudad);


    o++;

  } while (o < count);

  // envio 
  for (const ciudad of ciudadArray) {

    await bot.sendMessage(chatId, "<b>" + cine + "</b>\n" + (await ciudad) + "\n" + (await diahoycompleto()), {
      notification: false,
      parseMode: 'html'
    })
      .then(() => console.log('Mensaje enviado'))
      .catch((error) => console.error('Error al enviar el mensaje:', error));

    console.log(ciudad);
  }

});

async function cierraPopup(page) {
  // obetenemos el modal que tiene la clase modal-content
  const boton = await page.$('.btn-cerrar');
  // verifico si esta visible
  const visible = await boton?.isVisible();

  // si el modal existe lo cerramos
  if (boton && visible) {
    // intento hacer clic en el botón de cierre dentro del modal
    await boton.click();
    await page.waitForTimeout(3000);

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
async function procesarPagina(page: Page, ciu: string) {
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
    let pelicula: Pelicula = { titulo: '', horarios: [] };
    const pe = page.locator('.nombre-pelicula');
    //leo el contenido
    const texto = await pe.evaluate((element) => element.innerHTML);
    if (texto) {
      console.log(texto);
      pelicula.titulo = texto;
    }
    const dias = page.locator('.e-btn');
    const diaco = await dias.count();
    const este = await diahoy();
    let clickeardia: any;
    for (let j = 0; j < 2; j++) {
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
      await page.waitForTimeout(2000);
      await cierraPopup(page);
      continue; // Salimos del bucle si no encontramos el día
    }
    clickeardia.click();
    await page.waitForTimeout(2000);

    const formatos = page.locator('.btn-formato.btn-formato-selected');
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
        pelicula.horarios.push(hor + ' ' + fortext);

      }
    }
    ciudad.peliculas.push(pelicula);
    page.goBack();
    await page.waitForTimeout(2000);
    await cierraPopup(page);

  }
  const ciudadData = await ciudadString(ciudad);
  return ciudadData;
}

async function ciudadString(ciudad: Ciudad): Promise<string> {
  let ciudadString = `Ciudad: ${ciudad.ciudad}\n`;
  for (const pelicula of ciudad.peliculas) {
    ciudadString += `<b>${pelicula.titulo}</b>\n`;
    for (const horario of pelicula.horarios) {
      ciudadString += `${horario}\n`;
    }
    ciudadString += '\n';
  }
  return ciudadString;
}