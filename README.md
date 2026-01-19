# scraping-multicine
 
Una aplicación de scraping para extraer información de películas de múltiples cines y enriquecerla con datos de The Movie Database (TMDb).

## Descripción

Esta aplicación permite hacer scraping de información de películas desde diferentes sitios web de cines y luego enriquecer esa información con datos adicionales como descripciones, géneros, y calificaciones desde TMDb.

## Características

- Scraping de múltiples sitios de cines
- Integración con The Movie Database (TMDb) API
- Cliente de traducción usando Lingva
- Procesamiento asíncrono de datos

## Instalación

1. Clona el repositorio:
    ```bash
    git clone <url-del-repositorio>
    cd scraping-multicine
    ```

2. Instala las dependencias:
    ```bash
    npm install
    ```

3. Configura las variables de entorno:
    ```bash
    cp .env.example .env
    ```
    Edita el archivo `.env` y añade tu clave de API de TMDb:
    ```
    THEMOVIEDB_KEY=tu_clave_api_aqui
    ```

## Uso

### Ejecutar la aplicación
```bash
npm start
```

### Desarrollo
```bash
npm run dev
```

### Compilar TypeScript
```bash
npm run build
```

## Testing

Para ejecutar los tests:
```bash
npm test
```

Para ejecutar tests en modo watch:
```bash
npm run test:watch
```

Para generar reporte de cobertura:
```bash
npm run test:coverage
```

## Estructura del proyecto

```
scraping-multicine/
├── scraping/
│   └── common/
│       ├── TheMoviedbClient.ts
│       └── LingvaTranslationClient.ts
├── tests/
├── package.json
└── README.md
```

## Variables de entorno

- `THEMOVIEDB_KEY`: Clave de API de The Movie Database (requerida)

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
