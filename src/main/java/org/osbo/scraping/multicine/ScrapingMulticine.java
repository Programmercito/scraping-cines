package org.osbo.scraping.multicine;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.osbo.scraping.model.CineRequestGetData;
import org.osbo.scraping.model.CineResponseData;
import org.osbo.scraping.model.Movies;
import org.osbo.scraping.model.NamesMoviesRequest;
import org.osbo.scraping.model.NamesMoviesRequest.CinestarParams;
import org.osbo.scraping.model.NamesMoviesRequest.Params;

import com.pengrad.telegrambot.TelegramBot;
import com.pengrad.telegrambot.model.request.InputMedia;
import com.pengrad.telegrambot.model.request.InputMediaPhoto;
import com.pengrad.telegrambot.model.request.InputMediaVideo;
import com.pengrad.telegrambot.request.SendMediaGroup;
import com.pengrad.telegrambot.request.SendPhoto;
import com.pengrad.telegrambot.response.MessagesResponse;
import com.pengrad.telegrambot.response.SendResponse;

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

        String logomulti = "https://www.multicine.com.bo/assets/images/logo_multicine.png";
        Map<String, String> ciudad = new HashMap<String, String>();
        ciudad.put("120", "https://comunidadescolar.com.bo/wp-content/uploads/2018/07/LaPazIllimani-768x480.jpg");
        ciudad.put("130", "https://www.eabolivia.com/images/stories/newsbolivia/ElAlto-34Aos.jpg");
        ciudad.put("140",
                "https://content.r9cdn.net/rimg/dimg/7c/37/f60cf154-city-21742-165fcf16a63.jpg?crop=true&width=1020&height=498");
        String token = "7436861495:AAG2MF3X-VN2ieewXcgtL96HLx2SiifvHJE";
        String chat_id = "-1002164582366";

        TelegramBot bot = new TelegramBot(token);

        for (CineResponseData cine : data) {
            String result = "";
            InputMedia uno = new InputMediaPhoto(logomulti);
            InputMedia dos = new InputMediaVideo(ciudad.get(ConvertIds.getGroupId(cine.getId())));
            uno.caption(cine.getCity());
            SendMediaGroup send = new SendMediaGroup(chat_id, uno, dos);
            MessagesResponse sendResponse = bot.execute(send);

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
