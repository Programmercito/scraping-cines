package org.osbo.scraping.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data

public class NamesMoviesRequest {
    private String apisource;
    private String responseFormat;
    private CinestarParams cinestarParams;
    private int per_page;
    private String tk;

    @Data
    public class CinestarParams {
        private String ws;
        private String method;
        private Params params;

        public CinestarParams() {
        }
    }

    @Data
    public class Params {
        @JsonProperty("TheatreGroupId")
        private int TheatreGroupId;
        @JsonProperty("FilterId")
        private String FilterId;
        public Params() {
        }

    }
}
