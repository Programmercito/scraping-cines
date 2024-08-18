package org.osbo.scraping.model;

import java.util.List;

import lombok.Data;
import lombok.ToString;
@Data
@ToString
public class CineResponseData {
    String id;
    String city;
    List<Movies> movies;
    
}
