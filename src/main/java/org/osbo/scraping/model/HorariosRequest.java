package org.osbo.scraping.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class HorariosRequest {
    private String ws;
    private String method;
    private String tk;
    private HorariosParams params;

    @Data
    public class HorariosParams {
        @JsonProperty("TheatreGroupId")
        private String TheatreGroupId;
        @JsonProperty("SDate")
        private String SDate;
        @JsonProperty("FeatureId")
        private String FeatureId;
    }
}
