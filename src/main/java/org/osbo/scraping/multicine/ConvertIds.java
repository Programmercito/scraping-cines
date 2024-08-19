package org.osbo.scraping.multicine;

public class ConvertIds {
    public static String getGroupId(String id){
        if (id.equals("5")){
            return "140";
        }else if (id.equals("3")){
            return "130";
        }else{
            return "120";
        }
    }
}
