package org.osbo.scraping.multicine;

import java.nio.channels.ScatteringByteChannel;

import org.osbo.scraping.model.CineRequstGetData;

import kong.unirest.core.HttpResponse;
import kong.unirest.core.JsonNode;
import kong.unirest.core.Unirest;

/**
 *
 * @author hered
 */
public class ScrapingMulticine {

    public static void main(String[] args) {
        String url = "https://www.multicine.com.bo/restapi/public/api/location/getdata";
        CineRequstGetData cineRequstGetData = new CineRequstGetData();
        cineRequstGetData.setTk(null);
        HttpResponse<JsonNode> asJson = Unirest.post(url)
                .body(cineRequstGetData)
                .asJson();
        System.out.println(asJson.getBody().toString());

    }
}
