import { JsonFile } from './JsonFile';
import { ProcessMovie } from './ProcessMovie';
import { SystemCommandExecutor } from './SystemCommandExecutor';

export interface Ciudad {
    peliculas: Pelicula[];
    ciudad: string;
}

export interface Pelicula {
    id: string;
    titulo: string;
    horarios: Horario[];
}

export interface Horario {
    horario: string;
    idioma: string;
    formato: string;
}

export class CineDataProcessor {
    /**
     * Procesa todas las películas en un objeto cineData para asignar IDs únicos
     * @param cineData Objeto con estructura {ciudades: Ciudad[], cine: string, fecha: string}
     * @returns Promise que se resuelve cuando todas las películas han sido procesadas
     */
    public static async processMovieIdsAndDesc(cineData: { ciudades: Ciudad[], cine: string | undefined, fecha: string }): Promise<void> {
        // Procesar todas las películas secuencialmente
        for (const ciudad of cineData.ciudades) {
            for (const pelicula of ciudad.peliculas) {
                pelicula.id = await ProcessMovie.processsMovie(pelicula.titulo);
            }
        }
    }

    /**
     * Procesa y guarda los datos del cine realizando todas las operaciones necesarias
     * @param cineData Objeto con estructura {ciudades: Ciudad[], cine: string, fecha: string}
     * @param fileName Nombre del archivo JSON a guardar (ej: "1.json", "2.json")
     * @returns Promise que se resuelve cuando todo el proceso se completa
     */
    public static async processCineData(cineData: { ciudades: Ciudad[], cine: string | undefined, fecha: string }, fileName: string): Promise<void> {
        const savePath = JsonFile.getSavePath() + JsonFile.getDocsPath();
        
        try {
            // Configurar Git para evitar problemas con line endings
            SystemCommandExecutor.executeCommand('git config core.autocrlf false', JsonFile.getSavePath());
            
            SystemCommandExecutor.gitFetchAndReset('origin', 'main', JsonFile.getSavePath());
            SystemCommandExecutor.gitPull('origin', 'main', JsonFile.getSavePath());

            // Procesar IDs de películas
            await this.processMovieIdsAndDesc(cineData);

            // Guardar archivo JSON
            JsonFile.saveToJson(cineData, `${savePath}/${fileName}`);

            // Commit y push por separado con manejo de errores
            try {
                SystemCommandExecutor.gitCommitAndPush("Agregando horarios de cine", JsonFile.getSavePath());
            } catch (gitError) {
                console.log('Git operations completed with warnings, continuing...');
            }
        } catch (error) {
            console.error('Error in processCineData:', error);
            throw error; // Re-throw si es un error crítico
        }   
    }
}
