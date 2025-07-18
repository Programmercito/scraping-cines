export class TheMoviedbClient {
    private static apiKey: string;
    private static baseUrl = 'https://api.themoviedb.org/3';

    constructor() {
        TheMoviedbClient.apiKey = process.env.THEMOVIEDB_KEY || '';
        if (!TheMoviedbClient.apiKey) {
            throw new Error('THEMOVIEDB_KEY environment variable is required');
        }
    }

    public static async getMovieInformation(movieName: string): Promise<any | null> {
        try {
            const encodedQuery = encodeURIComponent(movieName);
            const url = `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodedQuery}&language=es-ES`;
            
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
