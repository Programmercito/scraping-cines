import { LingvaTranslationClient } from "./LingvaTranslationClient";

export class TheMoviedbClient {
    private static baseUrl = 'https://api.themoviedb.org/3';

    constructor() { }

    public static async getMovieInformation(movieName: string): Promise<any | null> {
        try {
            const apiKey = process.env.THEMOVIEDB_KEY;
            if (!apiKey) {
                throw new Error('THEMOVIEDB_KEY environment variable is required');
            }
            let peliculaNameEN = await LingvaTranslationClient.translateFromSpanishToEnglish(movieName);
            if (!peliculaNameEN) {
                peliculaNameEN=movieName;
            }
            const encodedQuery = encodeURIComponent(peliculaNameEN);
            const url = `${this.baseUrl}/search/movie?api_key=${apiKey}&query=${encodedQuery}&language=es-ES`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.results && data.results.length > 0) {
                return data.results[0];
            }

            return null;
        } catch (error) {
            console.error('Error fetching movie description:', error);
            return null;
        }
    }
}

