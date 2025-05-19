package com.verve.vervedemo.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    @Value("${openweather.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public WeatherController(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getWeather(
            @RequestParam(value = "city", defaultValue = "Cairo") String city,
            @RequestParam(value = "country", defaultValue = "eg") String country) {

        try {
            String url = String.format(
                    "https://api.openweathermap.org/data/2.5/weather?q=%s,%s&units=metric&appid=%s",
                    city, country, apiKey
            );

            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);

            Map<String, Object> weatherData = new HashMap<>();
            weatherData.put("city", city);
            weatherData.put("country", country);

            if (root.has("main") && root.has("weather") && root.has("wind")) {
                weatherData.put("temperature", root.path("main").path("temp").asDouble());
                weatherData.put("feelsLike", root.path("main").path("feels_like").asDouble());
                weatherData.put("humidity", root.path("main").path("humidity").asInt());
                weatherData.put("pressure", root.path("main").path("pressure").asInt());

                JsonNode weather = root.path("weather").get(0);
                weatherData.put("description", weather.path("description").asText());
                weatherData.put("icon", weather.path("icon").asText());

                weatherData.put("windSpeed", root.path("wind").path("speed").asDouble());

                if (root.has("sys")) {
                    long sunrise = root.path("sys").path("sunrise").asLong() * 1000;
                    long sunset = root.path("sys").path("sunset").asLong() * 1000;
                    weatherData.put("sunrise", sunrise);
                    weatherData.put("sunset", sunset);
                }
            }

            return ResponseEntity.ok(weatherData);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", true);
            error.put("message", "Failed to fetch weather data");
            return ResponseEntity.status(500).body(error);
        }
    }
} 