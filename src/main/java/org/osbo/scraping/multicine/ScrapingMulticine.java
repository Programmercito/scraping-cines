package org.osbo.scraping.multicine;

import java.util.ArrayList;
import java.util.List;

import org.osbo.scraping.model.CineRequestGetData;
import org.osbo.scraping.model.CineResponseData;
import org.osbo.scraping.model.Movies;
import org.osbo.scraping.model.NamesMoviesRequest;
import org.osbo.scraping.model.NamesMoviesRequest.CinestarParams;
import org.osbo.scraping.model.NamesMoviesRequest.Params;

import kong.unirest.core.HttpResponse;
import kong.unirest.core.JsonNode;
import kong.unirest.core.Unirest;
import kong.unirest.core.json.JSONArray;
import kong.unirest.core.json.JSONObject;

/**
 *
 * @author programmercito
 *
 */
public class ScrapingMulticine {

    public static void main(String[] args) {

        List<CineResponseData> data = new FetchingCinemas().getCinemas();
        data.forEach(cine -> {
            CineResponseData cineWithMovies = new FetchingMovies().getMovies(cine);
            List<Movies> movies = new ArrayList<Movies>();
            cineWithMovies.getMovies().forEach(movie -> {
                String cinema = ConvertIds.getGroupId(cine.getId());

                String horarios = new FetchingHorarios().getHorarios(cinema, movie.getId());
                movie.setHorarios(horarios);
                if (movie.getHorarios() != "" && movie.getHorarios() != null) {
                    movies.add(movie);
                }
                System.out.println(movie.getHorarios());

            });
            cineWithMovies.setMovies(movies);

        });
        System.out.println(data);
        // mostrame el objeto en un string seperado con \n cada pelicula y su horario
        // por ciudad y todo eso contacatenado en un string
        for (CineResponseData cine : data) {
            String result = "";

            result += cine.getCity() + "\n";
            for (Movies movie : cine.getMovies()) {
                result += movie.getNombre() + "\n" + movie.getTipo() + "\n" + movie.getHorarios() + "\n";
            }
            System.out.println("*********************");
            System.out.println(result);
            System.out.println(result.length());
            System.out.println("*********************");

        }


    }
}
