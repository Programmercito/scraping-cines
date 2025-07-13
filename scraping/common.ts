import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

export interface Cine {
  ciudades: Ciudad[];
  cine: string;
  fecha: string;
}

export interface Ciudad {
  peliculas: Pelicula[];
  ciudad: string;
}

export interface PeliculaData {
  id: string;
  titulo: string;
  video: string;
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

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
}

export interface YouTubeSearchResponse {
  items: Array<{
    id: {
      kind: string;
      videoId: string;
    };
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
      };
      channelTitle: string;
      publishedAt: string;
    };
  }>;
}

export class JsonFile {
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
  public static getSavePath(): string {
    return '/opt/codes/horarios-cine';
  }
  public static getDosPath(): string {
    return '/docs';
  }
  public static loadFromFile(filePath: string): any {
    try {
      // Check if file exists
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file content
      const fileContent = readFileSync(filePath, 'utf-8');

      // Parse JSON content
      const jsonObject = JSON.parse(fileContent);

      return jsonObject;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON format in file ${filePath}: ${error.message}`);
      }
      throw new Error(`Error loading JSON from ${filePath}: ${error}`);
    }
  }
}

export class YouTubeApiClient {
  private static readonly BASE_URL = 'https://www.googleapis.com/youtube/v3/search';
  private static readonly CURRENT_YEAR = new Date().getFullYear();

  public static async searchTrailer(movieName: string): Promise<YouTubeVideo | null> {
    try {
      const apiKey = process.env.YOUTUBE_KEY;
      if (!apiKey) {
        throw new Error('YouTube API key not found in environment variables ()');
      }

      // Construir la query de búsqueda
      const searchQuery = `${movieName} ${this.CURRENT_YEAR} trailer latino`;

      // Construir la URL de la API
      const url = new URL(this.BASE_URL);
      url.searchParams.append('key', apiKey);
      url.searchParams.append('part', 'snippet');
      url.searchParams.append('q', searchQuery);

      // Realizar la petición HTTP
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data: YouTubeSearchResponse = await response.json();

      // Verificar si hay resultados
      if (!data.items || data.items.length === 0) {
        return null;
      }

      // Obtener el primer video
      const firstVideo = data.items[0];

      return {
        id: firstVideo.id.videoId,
        title: firstVideo.snippet.title,
        description: firstVideo.snippet.description,
        thumbnailUrl: firstVideo.snippet.thumbnails.high?.url || firstVideo.snippet.thumbnails.medium?.url || firstVideo.snippet.thumbnails.default?.url,
        channelTitle: firstVideo.snippet.channelTitle,
        publishedAt: firstVideo.snippet.publishedAt
      };

    } catch (error) {
      throw new Error(`Error searching YouTube trailer for "${movieName}": ${error}`);
    }
  }

  public static getVideoUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  public static getEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
  }
}

export class ProcessMovie {
  public static async processsMovie(movie: string): Promise<string> {
    // aqui vamos a leer el archivo peliculas.json y ver si ahi esta una pelicula con el nombre del de la pelicula, si esta devolveremos el id de la pelicula y nada mas pero si no esta buscaremos con el nombre de la pelicula en youtube y el primer video que salga , crearemos un objeto PeliculaData con el id ( UUID aleatoreo), titulo, y video que salga en youtube y grabamos el archivo peliculas.json
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
          peliculas.push({ id: newId, titulo: movie, video: response.id });
          JsonFile.saveToJson(peliculas, filePath);
          return newId;
        } else {
          console.warn(`No se encontró un trailer para la película: ${movie}`);
          return '';
        }
      }
    }
    throw new Error(`El archivo ${filePath} no existe.`);
  }
  static generarUUID(): string {
    return randomUUID();
  }
}

export class SystemCommandExecutor {
  public static executeCommand(command: string, workingDirectory?: string): string {
    try {
      const options = workingDirectory ? { cwd: workingDirectory } : {};
      const result = execSync(command, { ...options, encoding: 'utf-8' });
      return result;
    } catch (error) {
      throw new Error(`Error executing command "${command}": ${error}`);
    }
  }

  public static gitCommit(message: string, workingDirectory?: string): string {
    try {
      // Commit with message (files are already tracked)
      const commitCommand = `git commit -am "${message}"`;
      return this.executeCommand(commitCommand, workingDirectory);
    } catch (error) {
      throw new Error(`Error during git commit: ${error}`);
    }
  }

  public static gitPull(remote: string = 'origin', branch: string = 'main', workingDirectory?: string): string {
    try {
      const pullCommand = `git pull ${remote} ${branch}`;
      return this.executeCommand(pullCommand, workingDirectory);
    } catch (error) {
      throw new Error(`Error during git pull: ${error}`);
    }
  }

  public static gitPush(remote: string = 'origin', branch: string = 'main', workingDirectory?: string): string {
    try {
      const pushCommand = `git push ${remote} ${branch} --force`;
      return this.executeCommand(pushCommand, workingDirectory);
    } catch (error) {
      throw new Error(`Error during git push: ${error}`);
    }
  }

  public static gitCommitAndPush(message: string, workingDirectory?: string, remote: string = 'origin', branch: string = 'main'): void {
    try {
      this.gitCommit(message, workingDirectory);
      this.gitPush(remote, branch, workingDirectory);
    } catch (error) {
      throw new Error(`Error during git commit and push: ${error}`);
    }
  }
}

export class CineDataProcessor {
  /**
   * Procesa todas las películas en un objeto cineData para asignar IDs únicos
   * @param cineData Objeto con estructura {ciudades: Ciudad[], cine: string, fecha: string}
   * @returns Promise que se resuelve cuando todas las películas han sido procesadas
   */
  public static async processMovieIds(cineData: { ciudades: Ciudad[], cine: string | undefined, fecha: string }): Promise<void> {
    // Crear un array de promesas para procesar todas las películas
    const moviePromises: Promise<void>[] = [];
    
    cineData.ciudades.forEach(ciudad => {
      ciudad.peliculas.forEach(pelicula => {
        // Agregar cada promesa de procesamiento al array
        moviePromises.push(
          ProcessMovie.processsMovie(pelicula.titulo).then(idpeli => {
            pelicula.id = idpeli;
          })
        );
      });
    });
    
    // Esperar a que todas las promesas se resuelvan
    await Promise.all(moviePromises);
  }

  /**
   * Procesa y guarda los datos del cine realizando todas las operaciones necesarias
   * @param cineData Objeto con estructura {ciudades: Ciudad[], cine: string, fecha: string}
   * @param fileName Nombre del archivo JSON a guardar (ej: "1.json", "2.json")
   * @returns Promise que se resuelve cuando todo el proceso se completa
   */
  public static async processCineData(cineData: { ciudades: Ciudad[], cine: string | undefined, fecha: string }, fileName: string): Promise<void> {
    const savePath = JsonFile.getSavePath() + JsonFile.getDosPath();
    
    SystemCommandExecutor.gitPull(savePath);
    
    // Procesar IDs de películas
    await this.processMovieIds(cineData);
    
    // Guardar archivo JSON
    JsonFile.saveToJson(cineData, `${savePath}/${fileName}`);
    
    // Commit y push
    SystemCommandExecutor.gitCommitAndPush("Agregando horarios de cine", JsonFile.getSavePath());
  }
}
