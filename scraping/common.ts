interface Ciudad {
  peliculas: Pelicula[];
  ciudad: string;
}

interface Pelicula {
  titulo: string;
  horarios: Horario[];
}

interface Horario {
  horario: string;
  idioma: string;
  formato: string;
}