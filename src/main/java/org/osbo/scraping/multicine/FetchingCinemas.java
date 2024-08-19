package org.osbo.scraping.multicine;

import org.osbo.scraping.model.CineRequestGetData;
import org.osbo.scraping.model.CineResponseData;
import org.osbo.scraping.model.Movies;
import java.util.ArrayList;
import java.util.List;
import kong.unirest.core.HttpResponse;
import kong.unirest.core.JsonNode;
import kong.unirest.core.Unirest;
import kong.unirest.core.json.JSONArray;
import kong.unirest.core.json.JSONObject;

public class FetchingCinemas {
    public List<CineResponseData> getCinemas() {
        String url = "https://www.multicine.com.bo/restapi/public/api/location/getdata";
        CineRequestGetData request = new CineRequestGetData();
        request.setTk(null);

        List<CineResponseData> data = new ArrayList<CineResponseData>();

        HttpResponse<JsonNode> asJson = Unirest.post(url)
                .body(request)
                .asJson();

        JSONObject jsonObject = asJson.getBody().getObject().getJSONObject("result");
        JSONArray jsonArray = jsonObject.getJSONArray("data");
        jsonArray.forEach(item -> {
            CineResponseData cineResponseData = new CineResponseData();
            JSONObject jsonItem = (JSONObject) item;
            cineResponseData.setCity(jsonItem.getString("name"));
            cineResponseData.setId(String.valueOf(Integer.parseInt(jsonItem.getString("id"))+1));
            data.add(cineResponseData);
        });
        System.out.println(data);
        return data;
    }
}
