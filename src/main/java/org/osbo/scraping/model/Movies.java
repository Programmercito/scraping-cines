package org.osbo.scraping.model;

import lombok.Data;
import lombok.ToString;

@Data
@ToString
public class Movies {
    String id;
    String nombre;
    String tipo;
    String horarios;
}
