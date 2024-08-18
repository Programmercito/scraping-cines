package org.osbo.scraping.multicine;

import org.osbo.scraping.model.CineRequstGetData;

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
        CineRequstGetData request = new CineRequstGetData();
        request.setTk(null);
        HttpResponse<JsonNode> asJson = Unirest.post(url)
                .body(request)
                .asJson();
        System.out.println(asJson.getBody().toPrettyString());

        JSONObject jsonObject = asJson.getBody().getObject().getJSONObject("result");
        JSONArray jsonArray = jsonObject.getJSONArray("data");
        jsonArray.forEach(item -> {
            JSONObject jsonItem = (JSONObject) item;
            System.out.println(jsonItem.toString());
        });

    }
}
