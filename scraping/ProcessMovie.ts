import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { JsonFile } from './JsonFile';
import { YouTubeApiClient, YouTubeVideo } from './YouTubeApiClient';
import { DuckDuckGoApiClient, DuckDuckGoResponse } from './DuckDuckGoApiClient';
import { PeliculaData } from './common';


export class ProcessMovie {
    public static async processsMovie(movie: string): Promise<string> {
        // empezamos cargo el archivo
        const filePath = JsonFile.getSavePath() + JsonFile.getDosPath() + '/peliculas.json';
        if (existsSync(filePath)) {
            const peliculas: PeliculaData[] = JsonFile.loadFromFile(filePath);
            // busco si la pelicula ya esta
            const peliculaExistente = peliculas.find(p => p.titulo.toLowerCase() === movie.toLowerCase());
            if (peliculaExistente) {
                return peliculaExistente.id;
            } else {
                // si no esta, busco en youtube
                const response: YouTubeVideo | null = await YouTubeApiClient.searchTrailer(movie);
                // con el id de youtube de la pelicula crea un objeto PeliculaData
                if (response) {
                    const newId = this.generarUUID();
                    const moviegood = movie.split(':')[0].trim();
                    let responsed: string | null = await DuckDuckGoApiClient.searchMovie(moviegood);  
                    if (!responsed) {
                        responsed = '';
                    }
                    peliculas.push({ id: newId, titulo: movie, video: response.id, descripcion: responsed, fecha: new Date().toISOString() });
                    JsonFile.saveToJson(peliculas, filePath);
                    return newId;
                } else {
                    console.warn(`No se encontró un trailer para la película: ${movie}`);
                    return '';
                }
            }
        } else {
            throw new Error(`El archivo ${filePath} no existe.`);
        }

    }

    static generarUUID(): string {
        return randomUUID();
    }
}
