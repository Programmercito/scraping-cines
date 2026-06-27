import { test, chromium, Page, Locator } from '@playwright/test';
import dotenv from 'dotenv';
import { JsonFile, Ciudad, Pelicula, Horario, CineDataProcessor, TelegramPublisher } from './common/common';

test('multicine', async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117.0.0.0 Safari/537.36',
    locale: 'es-BO',
    timezoneId: 'America/La_Paz',
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Cache-Control': 'max-age=0',
      'Upgrade-Insecure-Requests': '1',
      'sec-ch-ua':
        '"Chromium";v="117", "Not)A;Brand";v="24", "Google Chrome";v="117"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
      Referer: 'https://www.google.com/',
    },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', {
      get: () => [{ name: 'Chrome PDF Plugin' }],
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['es-BO', 'es', 'en'],
    });
  });

  await context.route('**/*', (route) => {
    const req = route.request();
    const headers = { ...req.headers(), referer: 'https://www.google.com/' };
    return route.continue({ headers });
  });

  const page = await context.newPage();

  dotenv.config();
  const token = process.env.TOKEN;
  const chatId = process.env.CHATID;
  const cine = process.env.CINE;
  const telegram = process.env.TELEGRAM;
  const telegramPublisher = new TelegramPublisher(token || '', chatId || '', telegram || '');

  console.log('Iniciando');
  await page.goto('https://www.multicine.com.bo/', {
    referer: 'https://www.google.com/',
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
  await page.reload({ waitUntil: 'networkidle' }).catch(() => { });
  await page.waitForTimeout(15000);
  console.log('home cargada');

  const buyLink = page.locator('a[href*="/buy-tickets"]').first();
  console.log('link buy-tickets:', await buyLink.count());
  await buyLink.click({ timeout: 10000, force: true });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => { });
  await page.waitForTimeout(15000);
  console.log('buy-tickets cargada, url:', page.url());

  const ciudadArray: Ciudad[] = [];
  const ciudades = await extraerCiudades(page);
  console.log(`Ciudades encontradas: ${ciudades.join(', ')}`);

  for (const ciudadNombre of ciudades) {
    console.log(`\n--- Cambiando a ciudad: ${ciudadNombre} ---`);
    await seleccionarCiudad(page, ciudadNombre);
    try { await page.waitForSelector('.react-spinner-material', { state: 'hidden', timeout: 20000 }); } catch { }
    await page.waitForTimeout(5000);
    await seleccionarDiaHoy(page);
    await page.waitForTimeout(3000);
    console.log(`Ciudad actual: ${ciudadNombre}`);

    const ciudad = await procesarPagina(page, ciudadNombre);
    ciudadArray.push(ciudad);
    console.log(`Ciudad ${ciudadNombre} lista: ${ciudad.peliculas.length} películas con horarios`);
  }

  const cineData = {
    ciudades: ciudadArray,
    cine: cine,
    fecha: await diahoycompleto(),
  };

  await CineDataProcessor.processCineData(cineData, '2.json');
  await telegramPublisher.publicar(cineData, cine || '', await diahoycompleto());

  await browser.close();
});

async function extraerCiudades(page: Page): Promise<string[]> {
  await abrirDropdownCiudad(page);
  const body = page.locator('.dropdownBody.open').last();
  const opciones = body.locator('.dropdownItem');
  const n = await opciones.count();
  const ciudades: string[] = [];
  for (let i = 0; i < n; i++) {
    const text = (await opciones.nth(i).innerText().catch(() => '')).trim();
    if (text && !text.toLowerCase().includes('seleccione')) {
      ciudades.push(text);
    }
  }
  return Array.from(new Set(ciudades));
}

async function abrirDropdownCiudad(page: Page) {
  const body = page.locator('.dropdownBody.open').last();
  const opciones = body.locator('.dropdownItem');
  const abierto = (await body.count()) > 0 && (await opciones.count()) > 0;
  if (abierto) return;

  await page.evaluate(() => {
    const all = document.querySelectorAll('.navselectwrap');
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        (el as HTMLElement).click();
        return;
      }
    }
  });
  await page.waitForTimeout(2000);
}

async function seleccionarCiudad(page: Page, nombre: string) {
  for (let intento = 0; intento < 2; intento++) {
    await abrirDropdownCiudad(page);
    const body = page.locator('.dropdownBody.open').last();
    const opciones = body.locator('.dropdownItem');
    const n = await opciones.count();
    for (let i = 0; i < n; i++) {
      const text = (await opciones.nth(i).innerText().catch(() => '')).trim();
      if (text === nombre) {
        await opciones.nth(i).click({ timeout: 10000, force: true });
        return;
      }
    }
    // no se encontró: forzar cierre para reabrir en siguiente intento
    await page.evaluate(() => {
      const all = document.querySelectorAll('.navselectwrap');
      for (const el of all) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          (el as HTMLElement).click();
          return;
        }
      }
    });
    await page.waitForTimeout(1500);
  }
  throw new Error(`No se encontró la ciudad "${nombre}" en el dropdown`);
}

async function seleccionarDiaHoy(page: Page) {
  const hoy = new Date().getDate();
  const botones = page.locator('.week_day button');
  const n = await botones.count();
  for (let i = 0; i < n; i++) {
    const btn = botones.nth(i);
    const diaTexto = await btn.locator('.text-size-xlarge.text-weight-bold').innerText().catch(() => '');
    const numero = parseInt(diaTexto.trim(), 10);
    if (numero === hoy) {
      const activo = await btn.evaluate((el) => el.classList.contains('is-active')).catch(() => false);
      if (!activo) {
        await btn.click({ timeout: 5000, force: true });
        await page.waitForTimeout(2000);
      }
      console.log(`Fecha seleccionada: hoy ${hoy}`);
      return;
    }
  }
  console.log(`No se encontró el día de hoy (${hoy}) en el slider`);
}

async function procesarPagina(page: Page, nombreCiudad: string): Promise<Ciudad> {
  const ciudad: Ciudad = { ciudad: nombreCiudad, peliculas: [] };
  const filas = page.locator('.pc-movie-item-row');
  const total = await filas.count();
  console.log(`Total de películas encontradas: ${total}`);

  for (let i = 0; i < total; i++) {
    const fila = filas.nth(i);
    const pelicula = await procesarPelicula(fila);
    if (pelicula && pelicula.horarios.length > 0) {
      ciudad.peliculas.push(pelicula);
    }
  }

  console.log(`Total de películas con horarios en ${nombreCiudad}: ${ciudad.peliculas.length}`);
  return ciudad;
}

async function procesarPelicula(fila: Locator): Promise<Pelicula | null> {
  const pelicula: Pelicula = { id: '', titulo: '', horarios: [] };
  const titulo = await fila.locator('.pc-sectiontitlewrap').first().innerText().catch(() => '');
  pelicula.titulo = titulo.trim();
  if (!pelicula.titulo) return null;
  console.log(`Procesando pelicula: ${pelicula.titulo}`);

  const grids = fila.locator('.pc-showtime-grid');
  const n = await grids.count();
  console.log(`  Grupos de horarios encontrados: ${n}`);
  for (let i = 0; i < n; i++) {
    const grid = grids.nth(i);
    const idioma = (await grid.locator('.pc-showtime-grid-left .pc-language-tag').first().innerText().catch(() => '')).trim();
    const formato = (await grid.locator('.pc-showtime-grid-left .tag.pc-tag').first().innerText().catch(() => '')).trim();
    const botones = grid.locator('.pc-showtime-grid-right .pc-show-time');
    const m = await botones.count();
    for (let j = 0; j < m; j++) {
      const texto = (await botones.nth(j).innerText().catch(() => '')).trim();
      if (!texto || texto.toLowerCase() === 'cerrado') continue;
      const match = texto.match(/(\d{1,2}):(\d{2})\s*hrs?/i);
      if (match) {
        const horario: Horario = {
          horario: `${match[1]}:${match[2]}`,
          idioma: idioma || 'Español',
          formato: formato || '',
        };
        pelicula.horarios.push(horario);
        console.log(`  Horario encontrado: ${horario.horario} - ${horario.idioma} - ${horario.formato}`);
      }
    }
  }

  console.log(`  Total horarios para ${pelicula.titulo}: ${pelicula.horarios.length}`);
  return pelicula;
}

async function diahoycompleto() {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();
  return `${dia}/${mes}/${anio}`;
}
