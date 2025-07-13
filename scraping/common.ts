// Core interfaces
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

// Re-export classes from separate files
export { JsonFile } from './JsonFile';
export { YouTubeApiClient } from './YouTubeApiClient';
export { ProcessMovie } from './ProcessMovie';
export { SystemCommandExecutor } from './SystemCommandExecutor';
export { CineDataProcessor } from './CineDataProcessor';
export { TelegramPublisher } from './TelegramPublisher';
