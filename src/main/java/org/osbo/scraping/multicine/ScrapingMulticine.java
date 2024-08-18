package org.osbo.scraping.multicine;

import org.osbo.scraping.model.CineRequstGetData;

import kong.unirest.core.HttpResponse;
import kong.unirest.core.JsonNode;
import kong.unirest.core.Unirest;

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
    }
}
