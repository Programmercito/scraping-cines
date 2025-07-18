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
