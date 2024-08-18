package org.osbo.scraping.multicine;

import java.util.ArrayList;
import java.util.List;

import org.osbo.scraping.model.CineRequestGetData;
import org.osbo.scraping.model.CineResponseData;

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

            int group = 1;
            System.out.println("movies groups:");
            String peliculas="";
            while (jsonItem.has("movies_group" + group)) {
                String movies = (String)jsonItem.get("movies_group" + group);
                
                if (!("null".equals(movies) || movies == null)) {
                    peliculas+=movies;
                }
                group++;
            }
            System.out.println(peliculas);
        });

    }
}
