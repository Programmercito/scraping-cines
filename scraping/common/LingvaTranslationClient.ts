export class LingvaTranslationClient {
    private static baseUrl = 'https://lingva.ml/api/v1';

    constructor() { }

    public static async translateText(text: string, fromLanguage: string = 'es', toLanguage: string = 'en'): Promise<string | null> {
        try {
            const encodedText = encodeURIComponent(text);
            const url = `${this.baseUrl}/${fromLanguage}/${toLanguage}/${encodedText}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.translation) {
                return data.translation;
            }

            return null;
        } catch (error) {
            console.error('Error translating text:', error);
            return null;
        }
    }

    public static async translateFromSpanishToEnglish(text: string): Promise<string | null> {
        return this.translateText(text, 'es', 'en');
    }

    public static async translateFromEnglishToSpanish(text: string): Promise<string | null> {
        return this.translateText(text, 'en', 'es');
    }
}
