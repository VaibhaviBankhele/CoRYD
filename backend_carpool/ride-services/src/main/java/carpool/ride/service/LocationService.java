package carpool.ride.service;

import carpool.ride.dto.DistanceCalculationDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class LocationService {
    
    @Value("${openrouteservice.api-key}")
    private String apiKey;
    
    @Value("${openrouteservice.directions-url}")
    private String directionsUrl;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    // Use Nominatim for geocoding (more reliable than OpenRouteService geocoding)
    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
    private static final String USER_AGENT = "CarpoolApp/1.0";
    
    public LocationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Calculate distance and duration between two locations
     */
    public DistanceCalculationDTO calculateDistanceAndTime(String origin, String destination) {
        try {
            // Step 1: Geocode both locations using Nominatim
            double[] originCoords = geocodeLocationNominatim(origin);
            double[] destCoords = geocodeLocationNominatim(destination);
            
            if (originCoords == null || destCoords == null) {
                return createFailedResponse(origin, destination, "Unable to find locations. Try being more specific (e.g., 'Hinjewadi Phase 1, Pune, Maharashtra')");
            }
            
            // Step 2: Calculate route using OpenRouteService
            String directionsResponse = getDirections(originCoords, destCoords);
            JsonNode root = objectMapper.readTree(directionsResponse);
            
            if (root.has("routes") && root.get("routes").size() > 0) {
                JsonNode route = root.get("routes").get(0);
                JsonNode summary = route.get("summary");
                
                // Distance in meters, convert to km
                double distanceInMeters = summary.get("distance").asDouble();
                double distanceInKm = Math.round(distanceInMeters / 10.0) / 100.0;
                
                // Duration in seconds, convert to minutes
                double durationInSeconds = summary.get("duration").asDouble();
                long durationInMinutes = Math.round(durationInSeconds / 60.0);
                
                // Create successful response
                DistanceCalculationDTO dto = new DistanceCalculationDTO();
                dto.setOrigin(origin);
                dto.setDestination(destination);
                dto.setDistanceInKm(distanceInKm);
                dto.setDurationInMinutes(durationInMinutes);
                dto.setSuccess(true);
                
                System.out.println("✅ Distance: " + distanceInKm + " km, Duration: " + durationInMinutes + " min");
                
                return dto;
            }
            
            return createFailedResponse(origin, destination, "No route found");
            
        } catch (Exception e) {
            System.err.println("❌ Error calculating distance: " + e.getMessage());
            return createFailedResponse(origin, destination, e.getMessage());
        }
    }
    
    /**
     * Geocode location using Nominatim (OpenStreetMap)
     * More reliable than OpenRouteService geocoding for Indian cities
     */
    private double[] geocodeLocationNominatim(String location) {
        try {
            // Build URL with proper parameters
            String url = NOMINATIM_URL + 
                "?q=" + URLEncoder.encode(location, StandardCharsets.UTF_8) +
                "&format=json" +
                "&limit=1" +
                "&countrycodes=in"; // Restrict to India for better results
            
            // Nominatim requires User-Agent header
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            JsonNode results = objectMapper.readTree(response.getBody());
            
            if (results.isArray() && results.size() > 0) {
                JsonNode firstResult = results.get(0);
                double lat = firstResult.get("lat").asDouble();
                double lon = firstResult.get("lon").asDouble();
                
                // Validate coordinates are in India (approximately)
                if (lat < 8 || lat > 37 || lon < 68 || lon > 97) {
                    System.err.println("⚠️ Coordinates outside India bounds for: " + location);
                    return null;
                }
                
                System.out.println("📍 Geocoded '" + location + "' to: [" + lon + ", " + lat + "]");
                return new double[]{lon, lat}; // [longitude, latitude]
            }
            
            System.err.println("⚠️ Could not geocode location: " + location);
            System.err.println("💡 Try being more specific: add 'Pune, Maharashtra' or 'Maharashtra, India'");
            return null;
            
        } catch (Exception e) {
            System.err.println("❌ Geocoding error for '" + location + "': " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Get driving directions from OpenRouteService
     */
    private String getDirections(double[] origin, double[] destination) throws Exception {
        // Build coordinates string: [[lon1,lat1],[lon2,lat2]]
        String coordinates = String.format("[[%f,%f],[%f,%f]]", 
            origin[0], origin[1], destination[0], destination[1]);
        
        String requestBody = "{\"coordinates\":" + coordinates + "}";
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", apiKey);
        headers.set("Content-Type", "application/json");
        
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
        
        ResponseEntity<String> response = restTemplate.exchange(
            directionsUrl,
            HttpMethod.POST,
            entity,
            String.class
        );
        
        return response.getBody();
    }
    
    /**
     * Calculate estimated fare based on distance
     */
    public double calculateFare(double distanceInKm) {
        double baseFare = 50.0;
        double perKmRate = 10.0;
        double minimumFare = 30.0;
        
        double calculatedFare = baseFare + (distanceInKm * perKmRate);
        return Math.max(calculatedFare, minimumFare);
    }
    
    /**
     * Get route information
     */
    public String getRouteInformation(String origin, String destination) {
        try {
            DistanceCalculationDTO result = calculateDistanceAndTime(origin, destination);
            
            if (result.isSuccess()) {
                return String.format("Route: %s to %s | Distance: %.2f km | Duration: %d minutes",
                    origin, destination, result.getDistanceInKm(), result.getDurationInMinutes());
            }
            
            return "Route information unavailable";
            
        } catch (Exception e) {
            return "Route information unavailable";
        }
    }
    
    /**
     * Check if within radius
     */
    public boolean isWithinRadius(String location1, String location2, double radiusInKm) {
        try {
            DistanceCalculationDTO result = calculateDistanceAndTime(location1, location2);
            return result.isSuccess() && result.getDistanceInKm() <= radiusInKm;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Create a failed response
     */
    private DistanceCalculationDTO createFailedResponse(String origin, String destination, String errorMessage) {
        DistanceCalculationDTO dto = new DistanceCalculationDTO();
        dto.setOrigin(origin);
        dto.setDestination(destination);
        dto.setDistanceInKm(0.0);
        dto.setDurationInMinutes(0L);
        dto.setSuccess(false);
        dto.setErrorMessage(errorMessage);
        return dto;
    }
}
