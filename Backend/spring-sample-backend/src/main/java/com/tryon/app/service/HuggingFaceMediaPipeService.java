package com.tryon.app.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@Service
public class HuggingFaceMediaPipeService {
    private static final Logger logger = LoggerFactory.getLogger(HuggingFaceMediaPipeService.class);

    @Value("${ml.service.huggingface.url}")
    private String mlServiceUrl;

    @Value("${ml.service.huggingface.enabled}")
    private boolean mlServiceEnabled;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public HuggingFaceMediaPipeService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public Map<String, Object> analyzeBodyImage(String imageUrl) {
        if (!mlServiceEnabled) {
            logger.warn("ML service is disabled");
            return createErrorResponse("ML service is disabled");
        }

        try {
            // Prepare request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("image_url", imageUrl);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            // Call ML service
            logger.info("Calling ML service at: {}", mlServiceUrl + "/analyze-body");
            ResponseEntity<Map> response = restTemplate.exchange(
                    mlServiceUrl + "/analyze-body",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                logger.info("ML service response received successfully");
                logger.debug("Raw ML response: {}", response.getBody());
                return response.getBody();
            } else {
                logger.error("ML service returned non-OK status: {}", response.getStatusCode());
                return createErrorResponse("ML service returned error status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            logger.error("Error calling ML service", e);
            return createErrorResponse("Failed to analyze image: " + e.getMessage());
        }
    }

    public boolean checkHealth() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    mlServiceUrl + "/health",
                    Map.class
            );
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            logger.error("ML service health check failed", e);
            return false;
        }
    }

    private Map<String, Object> createErrorResponse(String errorMessage) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", errorMessage);
        errorResponse.put("status", "FAILED");
        return errorResponse;
    }

    // Convert ML service response to standardized format
    public Map<String, Object> standardizeAnalysisResult(Map<String, Object> mlResponse) {
        Map<String, Object> standardized = new HashMap<>();

        try {
            logger.info("Standardizing ML response...");

            // The ML service returns: { "success": true, "data": {...}, "cost": 0.0, "provider": "..." }
            // We need to extract the actual data from the "data" field

            Map<String, Object> dataToProcess = mlResponse;

            // Check if response has a "data" field (which it should based on the Python service)
            if (mlResponse.containsKey("data") && mlResponse.get("data") instanceof Map) {
                dataToProcess = (Map<String, Object>) mlResponse.get("data");
                logger.info("Extracted nested data object");
            }

            // Extract measurements
            if (dataToProcess.containsKey("measurements")) {
                standardized.put("measurements", dataToProcess.get("measurements"));
                logger.info("Found measurements: {}", dataToProcess.get("measurements"));
            } else {
                logger.warn("No measurements found in ML response data!");
            }

            // Extract skin tone
            if (dataToProcess.containsKey("skinTone")) {
                standardized.put("skinTone", dataToProcess.get("skinTone"));
                logger.info("Found skinTone: {}", dataToProcess.get("skinTone"));
            }

            // Extract body type
            if (dataToProcess.containsKey("bodyType")) {
                standardized.put("bodyType", dataToProcess.get("bodyType"));
                logger.info("Found bodyType: {}", dataToProcess.get("bodyType"));
            }

            // Extract confidence
            if (dataToProcess.containsKey("confidence")) {
                standardized.put("confidence", dataToProcess.get("confidence"));
            }

            // Add metadata
            standardized.put("provider", mlResponse.getOrDefault("provider", "huggingface-mediapipe"));
            standardized.put("cost", mlResponse.getOrDefault("cost", 0.0));
            standardized.put("processingTime", dataToProcess.getOrDefault("processingTime", "unknown"));

            logger.info("Standardized result: {}", standardized);

        } catch (Exception e) {
            logger.error("Error standardizing ML response", e);
            standardized.put("error", "Failed to parse ML response: " + e.getMessage());
        }

        return standardized;
    }
}