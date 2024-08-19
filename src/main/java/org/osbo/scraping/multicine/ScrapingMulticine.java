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
            String ciudad = "1" + cine.getId() + "0";

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
                    .asJson();
            System.out.println(asJson.getRequestSummary().asString());
            JsonNode body = asJson.getBody();
            System.out.println("******");

            System.out.println(body.getObject().has("cinestar"));
        });

    }
}
