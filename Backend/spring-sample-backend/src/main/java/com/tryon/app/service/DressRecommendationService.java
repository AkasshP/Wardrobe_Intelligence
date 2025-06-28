package com.tryon.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tryon.app.model.DressRecommendation;
import com.tryon.app.repository.DressRecommendationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class DressRecommendationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final DressRecommendationRepository dressRecommendationRepository;

    @Value("${ai.recommendation.service.url:http://localhost:5001}")
    private String aiRecommendationServiceUrl;

    @Value("${ai.recommendation.service.timeout:90000}")
    private int timeoutMs;

    @Value("${ai.recommendation.service.enabled:true}")
    private boolean serviceEnabled;


    public DressRecommendationService(RestTemplate restTemplate,
                                      ObjectMapper objectMapper,
                                      DressRecommendationRepository dressRecommendationRepository) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.dressRecommendationRepository = dressRecommendationRepository;
    }


    @Async("imageProcessingExecutor")
    public CompletableFuture<Map<String, Object>> generateDressRecommendationsAsync(
            String analysisId,
            String sexinessPreference,
            int limit) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                if (!serviceEnabled) {
                    throw new RuntimeException("AI Dress Recommendation service is disabled");
                }

                return generateDressRecommendations(analysisId, sexinessPreference, limit);
            } catch (Exception e) {
                throw new RuntimeException("Failed to generate dress recommendations: " + e.getMessage(), e);
            }
        });
    }

    /**
     * Call the AI recommendation service
     */
    public Map<String, Object> generateDressRecommendations(String analysisId, String sexinessPreference, int limit) throws Exception {
        System.out.println("Calling AI Dress Recommendation service for analysis: " + analysisId);
        System.out.println("Sexiness preference: " + sexinessPreference);
        System.out.println("Limit: " + limit);

        // Prepare request payload
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("analysis_id", analysisId);
        requestBody.put("sexiness_preference", sexinessPreference);
        requestBody.put("limit", limit);

        // Set headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("User-Agent", "Wardrobe-Intelligence-Backend/1.0");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            // Call the AI recommendation service
            String endpoint = aiRecommendationServiceUrl + "/recommend-dresses";
            System.out.println("📡 Making request to: " + endpoint);

            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                // Parse the response
                JsonNode responseNode = objectMapper.readTree(response.getBody());

                if (responseNode.has("success") && responseNode.get("success").asBoolean()) {
                    // Extract the recommendations data
                    Map<String, Object> result = objectMapper.convertValue(responseNode, Map.class);

                    // Log success details
                    int recommendationCount = responseNode.get("recommendations_count").asInt();
                    System.out.println("AI recommendation completed successfully");
                    System.out.println("Generated " + recommendationCount + " hot & sexy dress recommendations");

                    // Log top recommendations
                    JsonNode recommendations = responseNode.get("recommendations");
                    if (recommendations.isArray() && recommendations.size() > 0) {
                        for (int i = 0; i < Math.min(3, recommendations.size()); i++) {
                            JsonNode dress = recommendations.get(i);
                            String dressName = dress.get("dress_name").asText();
                            double compatibilityScore = dress.get("compatibility_score").asDouble();
                            int sexinessScore = dress.get("sexiness_score").asInt();

                            System.out.println(String.format("  #%d: %s (Compatibility: %.1f%%, Sexiness: %d/10)",
                                    i + 1, dressName, compatibilityScore, sexinessScore));
                        }
                    }

                    return result;
                } else {
                    String errorMsg = responseNode.has("error") ?
                            responseNode.get("error").asText() : "Unknown error from AI recommendation service";
                    throw new RuntimeException("AI service returned error: " + errorMsg);
                }

            } else {
                throw new RuntimeException("HTTP error from AI service: " + response.getStatusCode());
            }

        } catch (Exception e) {
            System.err.println("Error calling AI Dress Recommendation service: " + e.getMessage());
            throw new RuntimeException("Failed to get dress recommendations: " + e.getMessage(), e);
        }
    }

    /**
     * Get saved dress recommendations for a user
     */
    public Map<String, Object> getUserDressRecommendations(Long userId, int limit) {
        try {
            List<DressRecommendation> recommendations = dressRecommendationRepository
                    .findByUserIdOrderByCreatedAtDesc(userId);

            // Limit results
            if (recommendations.size() > limit) {
                recommendations = recommendations.subList(0, limit);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("userId", userId);
            result.put("recommendations", recommendations);
            result.put("totalCount", recommendations.size());

            // Calculate statistics
            double avgCompatibilityScore = recommendations.stream()
                    .mapToDouble(rec -> rec.getCompatibilityScore() != null ? rec.getCompatibilityScore().doubleValue() : 0.0)
                    .average()
                    .orElse(0.0);

            long favoriteCount = recommendations.stream()
                    .filter(rec -> Boolean.TRUE.equals(rec.getIsFavorite()))
                    .count();

            long purchasedCount = recommendations.stream()
                    .filter(rec -> Boolean.TRUE.equals(rec.getIsPurchased()))
                    .count();

            Map<String, Object> stats = new HashMap<>();
            stats.put("avgCompatibilityScore", Math.round(avgCompatibilityScore * 100.0) / 100.0);
            stats.put("favoriteCount", favoriteCount);
            stats.put("purchasedCount", purchasedCount);
            result.put("statistics", stats);

            return result;

        } catch (Exception e) {
            System.err.println("Error getting user dress recommendations: " + e.getMessage());
            throw new RuntimeException("Failed to get user recommendations: " + e.getMessage());
        }
    }

    /**
     * Get dress recommendations by analysis ID
     */
    public Map<String, Object> getRecommendationsByAnalysisId(String analysisId) {
        try {
            List<DressRecommendation> recommendations = dressRecommendationRepository
                    .findByAnalysisIdOrderByCompatibilityScoreDesc(analysisId);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("analysisId", analysisId);
            result.put("recommendations", recommendations);
            result.put("totalCount", recommendations.size());

            return result;

        } catch (Exception e) {
            System.err.println("Error getting recommendations by analysis ID: " + e.getMessage());
            throw new RuntimeException("Failed to get recommendations: " + e.getMessage());
        }
    }

    /**
     * Mark dress as favorite
     */
    public Map<String, Object> markDressAsFavorite(Long recommendationId, boolean isFavorite) {
        try {
            DressRecommendation recommendation = dressRecommendationRepository
                    .findById(recommendationId)
                    .orElseThrow(() -> new RuntimeException("Recommendation not found"));

            recommendation.setIsFavorite(isFavorite);
            dressRecommendationRepository.save(recommendation);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("recommendationId", recommendationId);
            result.put("isFavorite", isFavorite);
            result.put("message", isFavorite ? "Added to favorites" : "Removed from favorites");

            return result;

        } catch (Exception e) {
            System.err.println(" Error updating favorite status: " + e.getMessage());
            throw new RuntimeException("Failed to update favorite status: " + e.getMessage());
        }
    }

    /**
     * Mark dress as purchased
     */
    public Map<String, Object> markDressAsPurchased(Long recommendationId) {
        try {
            DressRecommendation recommendation = dressRecommendationRepository
                    .findById(recommendationId)
                    .orElseThrow(() -> new RuntimeException("Recommendation not found"));

            recommendation.setIsPurchased(true);
            dressRecommendationRepository.save(recommendation);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("recommendationId", recommendationId);
            result.put("message", "Marked as purchased");

            return result;

        } catch (Exception e) {
            System.err.println("Error updating purchase status: " + e.getMessage());
            throw new RuntimeException("Failed to update purchase status: " + e.getMessage());
        }
    }

    /**
     * Rate a dress recommendation
     */
    public Map<String, Object> rateDressRecommendation(Long recommendationId, int rating, String feedback) {
        try {
            if (rating < 1 || rating > 5) {
                throw new IllegalArgumentException("Rating must be between 1 and 5");
            }

            DressRecommendation recommendation = dressRecommendationRepository
                    .findById(recommendationId)
                    .orElseThrow(() -> new RuntimeException("Recommendation not found"));

            recommendation.setUserRating(rating);
            if (feedback != null && !feedback.trim().isEmpty()) {
                recommendation.setUserFeedback(feedback);
            }
            dressRecommendationRepository.save(recommendation);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("recommendationId", recommendationId);
            result.put("rating", rating);
            result.put("message", "Rating saved successfully");

            return result;

        } catch (Exception e) {
            System.err.println("Error saving rating: " + e.getMessage());
            throw new RuntimeException("Failed to save rating: " + e.getMessage());
        }
    }

    /**
     * Get service health status
     */
    public Map<String, Object> getServiceHealth() {
        Map<String, Object> healthStatus = new HashMap<>();

        try {
            String healthEndpoint = aiRecommendationServiceUrl + "/health";
            ResponseEntity<String> response = restTemplate.getForEntity(healthEndpoint, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode healthNode = objectMapper.readTree(response.getBody());
                healthStatus.put("status", "healthy");
                healthStatus.put("serviceResponse", objectMapper.convertValue(healthNode, Map.class));
            } else {
                healthStatus.put("status", "unhealthy");
                healthStatus.put("httpStatus", response.getStatusCode());
            }

        } catch (Exception e) {
            healthStatus.put("status", "error");
            healthStatus.put("error", e.getMessage());
        }

        healthStatus.put("serviceUrl", aiRecommendationServiceUrl);
        healthStatus.put("enabled", serviceEnabled);
        healthStatus.put("timeout", timeoutMs);

        return healthStatus;
    }

    /**
     * Get service information and statistics
     */
    public Map<String, Object> getServiceInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("serviceName", "AI Sexy Dress Recommendation Service");
        info.put("provider", "transformers-ai");
        info.put("url", aiRecommendationServiceUrl);
        info.put("timeout", timeoutMs + "ms");
        info.put("enabled", serviceEnabled);
        info.put("features", Map.of(
                "fit_analysis", "Active",
                "style_matching", "Active",
                "sexiness_scoring", "Active",
                "ai_reasoning", "Active",
                "size_recommendation", "Active"
        ));

        // Add health status
        Map<String, Object> health = getServiceHealth();
        info.put("health", health);

        // Add database statistics
        try {
            long totalRecommendations = dressRecommendationRepository.count();
            info.put("totalRecommendations", totalRecommendations);
        } catch (Exception e) {
            info.put("totalRecommendations", "N/A");
        }

        return info;
    }
}