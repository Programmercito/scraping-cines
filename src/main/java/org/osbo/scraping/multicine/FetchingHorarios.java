package org.osbo.scraping.multicine;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

import org.osbo.scraping.model.HorariosRequest;
import org.osbo.scraping.model.NamesMoviesRequest;
import org.osbo.scraping.model.HorariosRequest.HorariosParams;
import org.osbo.scraping.model.NamesMoviesRequest.CinestarParams;
import org.osbo.scraping.model.NamesMoviesRequest.Params;

import kong.unirest.core.HttpResponse;
import kong.unirest.core.JsonNode;
import kong.unirest.core.Unirest;
import kong.unirest.core.json.JSONArray;
import kong.unirest.core.json.JSONObject;

public class FetchingHorarios {

    public String getHorarios(String idcine, String idmovie) {

        System.out.println(idcine + " " + idmovie);
        String url = "https://www.multicine.com.bo/restapi/public/api/cinestar/getdata2";

        HorariosRequest request = new HorariosRequest();
        request.setMethod("ShowTimeByDateAndMovie");
        request.setWs("info");
        HorariosParams params = request.new HorariosParams();
        params.setTheatreGroupId(idcine);
        params.setFeatureId(idmovie);

        LocalDate currentDate = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        String formattedDate = currentDate.format(formatter);

        params.setSDate(formattedDate);
        request.setParams(params);

        HttpResponse<JsonNode> asJson = Unirest.post(url)
                .contentType("application/json")
                .body(request)
                .asJson();
        System.out.println(asJson.getRequestSummary().asString());
        // System.out.println(asJson.getBody().toString());
        StringBuilder horarios = new StringBuilder();

        try {
            JSONObject root = asJson.getBody().getObject()
                    .getJSONObject("result")
                    .getJSONObject("ShowTimeByDateAndMovieResult");

            root = root.getJSONObject("root");
            Object object = root.get("Show");
            JSONArray show = null;
            if (object instanceof JSONArray) {
                show = root.getJSONArray("Show");
            } else {
                JSONObject json = root.getJSONObject("Show");
                show = new JSONArray();
                show.put(json);
            }

            show.forEach(item -> {
                JSONObject jsonItem = (JSONObject) item;
                horarios.append(" ").append(jsonItem.getString("StartTime"));
            });
        } catch (Exception e) {
            return "";
        }
        return horarios.toString().trim();
    }

}
