package org.osbo.scraping.model;

import java.util.List;

import lombok.Data;
@Data
public class CineResponseData {
    String city;
    String cinema;
    List<Movies> movies;
    
}
