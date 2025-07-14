export interface DuckDuckGoResponse {
    Abstract: string;
    AbstractText: string;
    AbstractSource: string;
    AbstractURL: string;
    Image: string;
    Heading: string;
    Answer: string;
    AnswerType: string;
    Definition: string;
    DefinitionSource: string;
    DefinitionURL: string;
    RelatedTopics: Array<{
        FirstURL: string;
        Icon: {
            URL: string;
            Height: string;
            Width: string;
        };
        Result: string;
        Text: string;
    }>;
    Results: Array<{
        FirstURL: string;
        Icon: {
            URL: string;
            Height: string;
            Width: string;
        };
        Result: string;
        Text: string;
    }>;
    Type: string;
    Redirect: string;
}

export class DuckDuckGoApiClient {
    private static readonly BASE_URL = 'https://api.duckduckgo.com/';

    /**
     * Busca información sobre una película en DuckDuckGo
     * @param movieTitle Título de la película a buscar
     * @returns El campo Abstract de la respuesta o null si no se encuentra información
     */
    public static async searchMovie(movieTitle: string): Promise<string | null> {
        try {
            // Construir la URL de la API
            const url = new URL(this.BASE_URL);
            url.searchParams.append('q', movieTitle);
            url.searchParams.append('format', 'json');
            url.searchParams.append('no_html', '1');
            url.searchParams.append('skip_disambig', '1');

            // Realizar la petición HTTP
            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error(`DuckDuckGo API error: ${response.status} ${response.statusText}`);
            }

            const data: DuckDuckGoResponse = await response.json();

            // Verificar si hay un Abstract disponible
            if (data.Abstract && data.Abstract.trim() !== '') {
                return data.Abstract;
            }

            // Si no hay Abstract, verificar si hay AbstractText
            if (data.AbstractText && data.AbstractText.trim() !== '') {
                return data.AbstractText;
            }

            // Si no hay información en Abstract o AbstractText
            return null;

        } catch (error) {
            throw new Error(`Error searching DuckDuckGo for "${movieTitle}": ${error}`);
        }
    }
}
