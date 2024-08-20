package org.osbo.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class DateString {
    public static String getFecha(String formato){
        LocalDate currentDate = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(formato);
        String formattedDate = currentDate.format(formatter);
        return formattedDate;
    }

}
