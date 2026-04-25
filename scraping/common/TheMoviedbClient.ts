/// <reference types="node" />
import process from "process";
import { LingvaTranslationClient } from "./LingvaTranslationClient";
import { MovieExtras } from "./common";

export class TheMoviedbClient {
    private static baseUrl = 'https://api.themoviedb.org/3';

    constructor() { }

    public static async getMovieInformation(movieName: string): Promise<any | null> {
        try {
            const apiKey = process.env.THEMOVIEDB_KEY;
            if (!apiKey) {
                throw new Error('THEMOVIEDB_KEY environment variable is required');
            }
            const encodedQuery = encodeURIComponent(movieName);
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
    
    private static async getMovieDetails(movieId: number): Promise<MovieExtras> {
        try {
            const apiKey = process.env.THEMOVIEDB_KEY;
            const url = `${this.baseUrl}/movie/${movieId}?api_key=${apiKey}&language=es-ES`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                genres: Array.isArray(data.genres) ? data.genres.map((genre: any) => genre.name).join(', ') : '',
                homepage: data.homepage || '',
                popularity: typeof data.popularity === 'number' ? data.popularity : 0,
                production_companies: Array.isArray(data.production_companies)
                    ? data.production_companies.map((company: any) => company.name).join(', ')
                    : '',
                runtime: typeof data.runtime === 'number' ? data.runtime : 0,
                vote_count: typeof data.vote_count === 'number' ? data.vote_count : 0,
                vote_average: typeof data.vote_average === 'number' ? data.vote_average : 0,
            };
        } catch (error) {
            console.error('Error fetching movie details:', error);
            return this.emptyMovieExtras();
        }
    }

    private static emptyMovieExtras(): MovieExtras {
        return {
            genres: '',
            homepage: '',
            popularity: 0,
            production_companies: '',
            runtime: 0,
            vote_count: 0,
            vote_average: 0,
        };
    }
}

