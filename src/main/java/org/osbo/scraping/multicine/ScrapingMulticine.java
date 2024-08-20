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
import com.pengrad.telegrambot.model.request.ParseMode;
import com.pengrad.telegrambot.request.SendMediaGroup;
import com.pengrad.telegrambot.request.SendMessage;
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
        ciudad.put("140", "https://www.eabolivia.com/images/stories/newsbolivia/ElAlto-34Aos.jpg");
        ciudad.put("130",
                "https://content.r9cdn.net/rimg/dimg/7c/37/f60cf154-city-21742-165fcf16a63.jpg?crop=true&width=1020&height=498");
        String token = "7436861495:AAG2MF3X-VN2ieewXcgtL96HLx2SiifvHJE";
        String chat_id = "-1002164582366";

        TelegramBot bot = new TelegramBot(token);

        for (CineResponseData cine : data) {
            String result = "";
            InputMediaPhoto[] imediaphoto = new InputMediaPhoto[2];

            InputMediaPhoto uno = new InputMediaPhoto(logomulti);
            InputMediaPhoto dos = new InputMediaPhoto(ciudad.get(ConvertIds.getGroupId(cine.getId())));
            imediaphoto[0] = uno;
            imediaphoto[1] = dos;
            uno.parseMode(ParseMode.HTML);
            uno.caption("<b>"+cine.getCity()+"</b>");
            SendMediaGroup send = new SendMediaGroup(chat_id, imediaphoto);
            send.disableNotification(true);
            MessagesResponse sendResponse = bot.execute(send);

            result += cine.getCity() + "\n";
            for (Movies movie : cine.getMovies()) {
                result += "<b>"+movie.getNombre() + "</b>\n" + movie.getTipo() + "\n" + movie.getHorarios() + "\n";
            }
            System.out.println("*********************");
            SendMessage sendMessage = new SendMessage(chat_id, result);
            sendMessage.parseMode(ParseMode.HTML);
            sendMessage.disableNotification(true);

            SendResponse response = bot.execute(sendMessage);

            System.out.println(result);
            System.out.println(result.length());
            System.out.println("*********************");

        }
        String mensaje="Este canal de Telegram no es el canal oficial del cine [Nombre del Cine]. No tenemos ninguna afiliación con el cine ni con sus operadores. Nuestro objetivo es proporcionar información sobre los horarios de las películas para que puedas planificar tu visita. Para obtener la información más actualizada y oficial, te recomendamos visitar el sitio web o las redes sociales del cine.";
        SendMessage sendMessage = new SendMessage(chat_id, mensaje);
        sendMessage.disableNotification(true);
        sendMessage.parseMode(ParseMode.HTML);
        SendResponse response = bot.execute(sendMessage);

    }
}
