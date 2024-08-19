package org.osbo.scraping.multicine;

import java.util.ArrayList;
import java.util.List;

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

public class FetchingMovies {
    public CineResponseData getMovies(CineResponseData cine) {
        System.out.println(cine.getCity());
        String ciudad = ConvertIds.getGroupId(cine.getId());
        System.out.println(ciudad);

        NamesMoviesRequest namesMovies = new NamesMoviesRequest();
        namesMovies.setApisource("cinestar");
        namesMovies.setPer_page(1000);
        namesMovies.setResponseFormat("Movie");
        namesMovies.setTk(null);
        Params params = namesMovies.new Params();
        params.setFilterId("MWEEKFORW,MWEEKFORW,MWEEKFORW");
        params.setTheatreGroupId(Integer.parseInt(ciudad));
        CinestarParams cinestarParams = namesMovies.new CinestarParams();
        cinestarParams.setMethod("Movies");
        cinestarParams.setWs("info");
        cinestarParams.setParams(params);
        namesMovies.setCinestarParams(cinestarParams);

        HttpResponse<JsonNode> asJson = Unirest
                .post("https://www.multicine.com.bo/restapi/public/api/movie/getdata")
                .body(namesMovies)
                .header("Content-Type", "application/json")
                .header("Accept", "*/*")
                .asJson();
        System.out.println(asJson.getRequestSummary().asString());
        JsonNode body = asJson.getBody();
        JSONArray jsonArray = body.getObject().getJSONArray("cinestar");
        cine.setMovies(new ArrayList<Movies>());
        jsonArray.forEach(item -> {
            JSONObject jsonItem = (JSONObject) item;
            Movies movie = new Movies();
            movie.setId(jsonItem.getString("id"));
            if (!jsonItem.getString("originalName").equals("")) {
                movie.setNombre(jsonItem.getString("originalName"));
            } else {
                movie.setNombre(jsonItem.getString("name"));
            }
            movie.setTipo(jsonItem.getString("name").replace(jsonItem.getString("originalName"), ""));
            movie.setHorarios(null);
            cine.getMovies().add(movie);

            System.out.println(movie);
        });
        return cine;
    }
}
