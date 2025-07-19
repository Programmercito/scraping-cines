export class StringNormalizer {
    constructor() { }

    public static normalizeMovieTitle(input: string): string {
        try {
            // Eliminar acentos
            const withoutAccents = this.removeAccents(input);
            
            // Convertir a minúsculas
            const lowercase = withoutAccents.toLowerCase();
            
            // Hacer split con 'trailer'
            const parts = lowercase.split('trailer');
            
            // Si el primer elemento tiene contenido (ancho > 0), lo retornamos limpio
            if (parts.length > 0 && parts[0].trim().length > 0) {
                return parts[0].trim();
            }
            
            // Si no, devolvemos el string original
            return input;
        } catch (error) {
            console.error('Error normalizing movie title:', error);
            return input;
        }
    }

    private static removeAccents(text: string): string {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
}
