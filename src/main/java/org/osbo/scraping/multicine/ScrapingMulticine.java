package org.osbo.scraping.multicine;

import java.util.ArrayList;
import java.util.List;

import org.osbo.scraping.model.CineRequestGetData;
import org.osbo.scraping.model.CineResponseData;
import org.osbo.scraping.model.Movies;

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
        String url = "https://www.multicine.com.bo/restapi/public/api/location/getdata";
        CineRequestGetData request = new CineRequestGetData();
        request.setTk(null);

        List<CineResponseData> data = new ArrayList<CineResponseData>();

        HttpResponse<JsonNode> asJson = Unirest.post(url)
                .body(request)
                .asJson();
        System.out.println(asJson.getBody().toPrettyString());

        JSONObject jsonObject = asJson.getBody().getObject().getJSONObject("result");
        JSONArray jsonArray = jsonObject.getJSONArray("data");
        jsonArray.forEach(item -> {
            CineResponseData cineResponseData = new CineResponseData();
            JSONObject jsonItem = (JSONObject) item;
            cineResponseData.setCity(jsonItem.getString("name"));
            cineResponseData.setId(jsonItem.getString("id"));
            int group = 1;
            String peliculas = "";
            while (jsonItem.has("movies_group" + group)) {
                String movies = (String) jsonItem.get("movies_group" + group);

                if (!("null".equals(movies) || movies == null)) {
                    peliculas += movies;
                }
                group++;
            }
            String[] split = peliculas.split(",");
            cineResponseData.setMovies(new ArrayList<Movies>());
            for (int indice = 0; split.length > indice; indice++) {
                Movies movies = new Movies();
                movies.setId(split[indice]);
                cineResponseData.getMovies().add(movies);
            }
            data.add(cineResponseData);
        });
        System.out.println(data);


    }
}
