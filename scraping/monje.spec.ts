import { test, expect, Page } from '@playwright/test';
import dotenv from 'dotenv';
import { parse } from 'path';
import { JsonFile, Ciudad, Pelicula, Horario, SystemCommandExecutor, ProcessMovie, CineDataProcessor, TelegramPublisher } from './common';


test('multicine', async ({ page }) => {

    const token = process.env.TOKEN;
    const chatId = process.env.CHATID;
    const cine = process.env.CINE3;
    const telegram = process.env.TELEGRAM;

    await page.goto('https://www.monjecampero.com.bo/', { waitUntil: 'load' });
    await page.waitForTimeout(20000); // espera a que la página cargue completamente
    //await login(page);
    const contenedor = page.locator('.row.row-cols-1.row-cols-md-2.row-cols-xl-3.g-0.g-xxl-5.justify-content-center').last();
    // dentro busco los con class col
    const items = contenedor.locator('.col');
    // recorro todos los encontrados
    const count = await items.count();
    console.log(`Total de elementos encontrados en ciudades: ${count}`);
    let ciudads = "La Paz";
    let peliculas: Pelicula[] = [];
    let ciudad: Ciudad= { peliculas: [], ciudad: ciudads };
    for (let i = 0; i < count; i++) {
        let item = items.nth(i);
        let Pelicula: Pelicula = { id: '', titulo: '', horarios: [] };
        let titulo = await item.locator('.card-title').innerText();
        // busco el componente con class card-details
        let detalles = item.locator('.card-details');
        // este detalles tiene un texto al empezar yluego mas tags html quiero obtener solo el texto
        let formatoyidioma = (await detalles.innerText()).split('|');
        let formato = formatoyidioma[0].trim();
        let idioma = formatoyidioma[1].trim();
        // dentro hay dos spans como los obtengo no tienen ningun class
        let spans = detalles.locator('span');
        // los recorro y obtengo su texto de cada uno  y lols imprimo  
        let horarios: Horario[] = [];
        for (let j = 0; j < await spans.count(); j++) {
            // obtengo el trim del texto dentro y los seperado por el espacio en un array
            let spanTexto = await spans.nth(j).innerText();
            let spanTextoTrim = spanTexto.trim();
            let horario = spanTextoTrim.split(' ');
            // recorro el array horario y por cada uno agrego a horarios
            for (let k = 0; k < horario.length; k++) {
                horarios.push({ horario: horario[k], idioma: idioma, formato: formato });
            }
        }
        Pelicula.horarios = horarios;
        Pelicula.titulo = titulo;
    }
    ciudad.peliculas = peliculas;
    let ciudadArray: Ciudad[] = [];
    ciudadArray.push(ciudad);

    // obtengo ruta de guardado
    const savePath = JsonFile.getSavePath() + JsonFile.getDosPath();
    // creao un objeto cine con las ciudades y la fecha
    const cineData = {
        ciudades: ciudadArray,
        cine: cine,
        fecha: await diahoycompleto()
    };

    // Procesar y guardar datos del cine
    await CineDataProcessor.processCineData(cineData, "3.json");

    const telegramPublisher = new TelegramPublisher(token || '', chatId || '', telegram || '');
    // Publicar en Telegram
    await telegramPublisher.publicar(cineData, cine || '', await diahoycompleto());
});

// funcion con la fecha de ma;ana dia mes a;o
async function diahoycompleto() {
    const hoy = new Date();
    const dia = hoy.getDate();
    const mes = hoy.getMonth() + 1; // Los meses son indexados desde 0
    const anio = hoy.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

