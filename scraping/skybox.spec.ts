import { test, expect, Page } from '@playwright/test';
import dotenv from 'dotenv';
import { JsonFile, Ciudad, Pelicula, Horario, CineDataProcessor, TelegramPublisher } from './common/common';

dotenv.config();

test('skybox-cochabamba', async ({ page }) => {
  const token = process.env.TOKEN;
  const chatId = process.env.CHATID;
  const cine = process.env.CINE5;
  const telegram = process.env.TELEGRAM;

  const telegramPublisher = new TelegramPublisher(token || '', chatId || '', telegram || '');

  console.log('Skybox start', {
    cine,
    tokenPresent: !!token,
    chatIdPresent: !!chatId,
    telegramPresent: !!telegram,
  });

  const todayIso = getTodayIso();
  const fechaReporte = getTodayFormatted();

  const funcionesUrl = 'https://skyboxcinemas.com.bo/Funciones/GetPeliculasPorComplejo?codComplejo=107';
  const functionsResponse = await page.request.get(funcionesUrl);
  console.log('Skybox funciones request', { url: funcionesUrl, status: functionsResponse.status() });
  expect(functionsResponse.ok()).toBeTruthy();

  const functionsText = await functionsResponse.text();
  console.log('Skybox funciones body', {
    length: functionsText.length,
    sample: functionsText.slice(0, 2000),
  });

  const functionsJson = await parseUtf16Json(functionsText);
  const functionsList = Array.isArray(functionsJson)
    ? functionsJson
    : Array.isArray(functionsJson?.value)
    ? functionsJson.value
    : [];
  console.log('Skybox funciones parsed', {
    sourceType: Array.isArray(functionsJson) ? 'array' : 'object',
    functionsCount: functionsList.length,
  });

  const todayFunctions = functionsList.filter((funcion: any) => {
    const fecha = funcion?.fecha;
    const keep = isToday(String(fecha));
    if (!keep) {
      console.log('Skybox skipped funcion', {
        codFuncion: funcion?.codFuncion,
        codPelicula: funcion?.codPelicula,
        fecha,
        parsed: normalizeSkyboxDate(String(fecha)),
      });
    }
    return keep;
  });
  console.log('Skybox today functions count', todayFunctions.length);

  const peliculasByCode = new Map<number, Pelicula>();

  for (const funcion of todayFunctions) {
    if (!funcion?.codPelicula || !funcion?.cachePeliculas) {
      continue;
    }
    const codPelicula = funcion.codPelicula as number;
    if (!peliculasByCode.has(codPelicula)) {
      peliculasByCode.set(codPelicula, {
        id: '',
        titulo: funcion.cachePeliculas?.titulo || '',
        horarios: [],
      });
    }
  }

  for (const [codPelicula, peliculaData] of peliculasByCode.entries()) {
    const detailUrl = `https://skyboxcinemas.com.bo/Peliculas/GetCacheFuncionesComplejoPeliculaFecha?complejoId=107&codPelicula=${codPelicula}&fecha=${todayIso}`;
    const detailResponse = await page.request.get(detailUrl);
    if (!detailResponse.ok()) {
      console.warn(`Skybox detail request failed for pelicula ${codPelicula}: ${detailResponse.status()}`);
      continue;
    }

    const detailJson = await parseUtf16Json(detailResponse);
    const detailArray = Array.isArray(detailJson) ? detailJson : [];

    for (const technologyGroup of detailArray) {
      const formato = technologyGroup?.tecnologiaNombre || '';
      const idioma = technologyGroup?.idiomaPel || technologyGroup?.idioma || '';

      if (Array.isArray(technologyGroup?.funciones)) {
        for (const funcion of technologyGroup.funciones) {
          const horarioRaw = funcion?.horaComienzoOriginal;
          if (!horarioRaw) continue;
          peliculaData.horarios.push({
            horario: String(horarioRaw).trim(),
            idioma: String(idioma || '').trim(),
            formato: String(formato || '').trim(),
          });
        }
      }
    }

    if (peliculaData.horarios.length === 0) {
      const fallbackFunctions = todayFunctions.filter((f: any) => f.codPelicula === codPelicula);
      for (const funcion of fallbackFunctions) {
        const horarioRaw = funcion?.horaComienzo;
        peliculaData.horarios.push({
          horario: String(horarioRaw || '').trim(),
          idioma: funcion?.cachePeliculas?.subtitulada ? 'Subtitulada' : 'Doblada',
          formato: '2D',
        });
      }
    }

    peliculaData.horarios = uniqueHorarios(peliculaData.horarios);
  }

  const ciudad: Ciudad = {
    ciudad: 'Cochabamba',
    peliculas: Array.from(peliculasByCode.values()).map((item) => ({
      id: '',
      titulo: item.titulo,
      horarios: item.horarios,
    })),
  };

  const cineData = {
    ciudades: [ciudad],
    cine,
    fecha: fechaReporte,
  };

  await CineDataProcessor.processCineData(cineData, '5.json');
  await telegramPublisher.publicar(cineData, cine || '', fechaReporte);
});

async function parseUtf16Json(responseOrText: any): Promise<any> {
  const isString = typeof responseOrText === 'string';
  const text = isString ? responseOrText : await responseOrText.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    if (isString) {
      throw error;
    }
    const body = await responseOrText.body();
    const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body);
    const textUtf16 = bytes.toString('utf16le').replace(/^\uFEFF/, '');
    return JSON.parse(textUtf16);
  }
}

function getTodayIso(): string {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayFormatted(): string {
  const hoy = new Date();
  const day = hoy.getDate();
  const month = hoy.getMonth() + 1;
  const year = hoy.getFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeSkyboxDate(dateString: string): string {
  if (!dateString) return '';
  return dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
}

function getDatePart(dateString: string): string {
  const normalized = normalizeSkyboxDate(dateString);
  return normalized.split('T')[0];
}

function isToday(dateString: string): boolean {
  if (!dateString) return false;
  const datePart = getDatePart(dateString);
  if (!datePart) return false;
  return datePart === getTodayIso();
}

function isTodayOrFuture(dateString: string): boolean {
  if (!dateString) return false;
  const datePart = getDatePart(dateString);
  if (!datePart) return false;
  return datePart >= getTodayIso();
}

function uniqueHorarios(horarios: Horario[]): Horario[] {
  const seen = new Set<string>();
  return horarios.filter((horario) => {
    const key = `${horario.horario}|${horario.idioma}|${horario.formato}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
