import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

interface Cine{
  ciudades: Ciudad[];
  cine: string;
  fecha: string;
}

export interface Ciudad {
  peliculas: Pelicula[];
  ciudad: string;
}


interface Pelicula {
  titulo: string;
  horarios: Horario[];
}

interface Horario {
  horario: string;
  idioma: string;
  formato: string;
}

export class JsonFileWriter {
  public static saveToJson(obj: any, filePath: string): void {
    try {
      // Create directory if it doesn't exist
      const dir = dirname(filePath);
      mkdirSync(dir, { recursive: true });
      
      // Convert object to JSON and write to file (overwrites if exists)
      const jsonString = JSON.stringify(obj, null, 2);
      writeFileSync(filePath, jsonString, 'utf-8');
    } catch (error) {
      throw new Error(`Error saving JSON to ${filePath}: ${error}`);
    }
  }
  // creo un metodo apra devovler la ruta donde guardar que es /opt/codes/horarios-cine/docs
  public static getSavePath(): string {
    return '/opt/codes/horarios-cine/docs';
  }
}

