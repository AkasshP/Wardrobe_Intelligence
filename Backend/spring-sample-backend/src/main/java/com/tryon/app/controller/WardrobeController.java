package com.tryon.app.controller;

import com.tryon.app.service.ImageAnalysisService;
import com.tryon.app.service.ImageProcessingService;
import com.tryon.app.service.DressRecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;



import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/wardrobe")
@CrossOrigin(origins = "*")
public class WardrobeController {
    private static final Logger logger = LoggerFactory.getLogger(WardrobeController.class);

    @Autowired
    private ImageProcessingService imageProcessingService;

    @Autowired
    private ImageAnalysisService imageAnalysisService;

    @Autowired(required = false) // Make it optional in case service is not available yet
    private DressRecommendationService dressRecommendationService;

    //  ENHANCED: Upload body image for analysis with dress recommendations option
    @PostMapping("/upload-body-image")
    public ResponseEntity<Map<String, Object>> uploadBodyImage(
            @RequestParam("image") MultipartFile file,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "generateRecommendations", defaultValue = "false") boolean generateRecommendations,
            @RequestParam(value = "sexinessPreference", defaultValue = "high") String sexinessPreference,
            @RequestParam(value = "recommendationLimit", defaultValue = "10") @Min(1) @Max(50) Integer recommendationLimit) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Validate file
            if (file.isEmpty()) {
                response.put("error", "File is empty");
                return ResponseEntity.badRequest().body(response);
            }

            // Upload image to GCP
            String imageUrl = imageProcessingService.uploadImage(file, "body-images/" + userId);

            // Initiate analysis
            String analysisId = imageAnalysisService.initiateAnalysis(userId, imageUrl);

            response.put("success", true);
            response.put("analysisId", analysisId);
            response.put("imageUrl", imageUrl);
            response.put("message", "Image uploaded successfully. Analysis in progress.");

            //  If dress recommendations requested, add tracking info
            if (generateRecommendations) {
                response.put("dressRecommendations", "Will be generated after body analysis completes");
                response.put("sexinessPreference", sexinessPreference);
                response.put("recommendationLimit", recommendationLimit);

                // Start async recommendation generation after analysis
                if (dressRecommendationService != null) {
                    startAsyncRecommendationGeneration(analysisId, sexinessPreference, recommendationLimit);
                }
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error uploading body image", e);
            response.put("error", "Failed to upload image: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Generate dress recommendations for existing analysis
    @PostMapping("/generate-recommendations/{analysisId}")
    public ResponseEntity<Map<String, Object>> generateDressRecommendations(
            @PathVariable String analysisId,
            @RequestParam(value = "sexinessPreference", defaultValue = "high") String sexinessPreference,
            @RequestParam(value = "recommendationLimit", defaultValue = "10") @Min(1) @Max(50) Integer recommendationLimit) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (dressRecommendationService == null) {
                response.put("error", "Dress recommendation service not available");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
            }

            // Check if analysis is completed
            Map<String, Object> analysisStatus = imageAnalysisService.getAnalysisStatus(analysisId);
            String status = (String) analysisStatus.get("status");

            if (!"COMPLETED".equals(status)) {
                response.put("error", "Analysis not completed yet. Current status: " + status);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Generate recommendations
            logger.info("Generating dress recommendations for analysis: {}", analysisId);
            Map<String, Object> recommendations = dressRecommendationService.generateDressRecommendations(
                    analysisId, sexinessPreference, recommendationLimit
            );

            return ResponseEntity.ok(recommendations);

        } catch (Exception e) {
            logger.error("Error generating dress recommendations", e);
            response.put("error", "Failed to generate recommendations: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Get dress recommendations for analysis
    @GetMapping("/recommendations/{analysisId}")
    public ResponseEntity<Map<String, Object>> getDressRecommendations(
            @PathVariable String analysisId,
            @RequestParam(value = "limit", defaultValue = "10") Integer limit) {

        try {
            if (dressRecommendationService == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Dress recommendation service not available");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
            }

            Map<String, Object> recommendations = dressRecommendationService.getRecommendationsByAnalysisId(analysisId);
            return ResponseEntity.ok(recommendations);

        } catch (Exception e) {
            logger.error("Error fetching dress recommendations", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    //  Mark dress as favorite
    @PostMapping("/recommendations/{recommendationId}/favorite")
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @PathVariable Long recommendationId,
            @RequestParam boolean isFavorite) {

        try {
            if (dressRecommendationService == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Dress recommendation service not available");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
            }

            Map<String, Object> result = dressRecommendationService.markDressAsFavorite(recommendationId, isFavorite);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            logger.error("Error updating favorite status", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Rate a dress recommendation
    @PostMapping("/recommendations/{recommendationId}/rate")
    public ResponseEntity<Map<String, Object>> rateDress(
            @PathVariable Long recommendationId,
            @RequestParam @Min(1) @Max(5) Integer rating,
            @RequestParam(required = false) String feedback) {

        try {
            if (dressRecommendationService == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Dress recommendation service not available");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
            }

            Map<String, Object> result = dressRecommendationService.rateDressRecommendation(
                    recommendationId, rating, feedback
            );
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            logger.error("Error saving rating", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    //  Get user's dress recommendation history
    @GetMapping("/user/{userId}/recommendations")
    public ResponseEntity<Map<String, Object>> getUserDressRecommendations(
            @PathVariable Long userId,
            @RequestParam(value = "limit", defaultValue = "20") Integer limit) {

        try {
            if (dressRecommendationService == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Dress recommendation service not available");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
            }

            Map<String, Object> recommendations = dressRecommendationService.getUserDressRecommendations(userId, limit);
            return ResponseEntity.ok(recommendations);

        } catch (Exception e) {
            logger.error("Error fetching user recommendations", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Test GCP Storage configuration (EXISTING - NO CHANGES)
    @GetMapping("/test-gcp")
    public ResponseEntity<Map<String, Object>> testGCPStorage() {
        Map<String, Object> response = new HashMap<>();

        try {
            response.put("storageConfigured", imageProcessingService.isStorageConfigured());

            // Try to create a test file
            if (imageProcessingService.isStorageConfigured()) {
                response.put("bucketAccessible", true);
                response.put("message", "GCP Storage is configured and accessible");
            } else {
                response.put("bucketAccessible", false);
                response.put("message", "GCP Storage is not configured. Check logs for details.");
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("GCP test failed", e);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ENHANCED: Get analysis status with optional dress recommendations
    @GetMapping("/analysis-status/{analysisId}")
    public ResponseEntity<Map<String, Object>> getAnalysisStatus(
            @PathVariable String analysisId,
            @RequestParam(value = "includeRecommendations", defaultValue = "false") boolean includeRecommendations) {

        try {
            Map<String, Object> status = imageAnalysisService.getAnalysisStatus(analysisId);

            // If completed and recommendations requested, include them
            if (includeRecommendations && "COMPLETED".equals(status.get("status")) && dressRecommendationService != null) {
                try {
                    Map<String, Object> recommendations = dressRecommendationService.getRecommendationsByAnalysisId(analysisId);
                    status.put("dressRecommendations", recommendations);
                } catch (Exception e) {
                    logger.warn("Could not fetch dress recommendations: {}", e.getMessage());
                    status.put("dressRecommendations", "Not available");
                }
            }

            return ResponseEntity.ok(status);
        } catch (Exception e) {
            logger.error("Error getting analysis status", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    // Get user's analysis history (EXISTING - NO CHANGES)
    @GetMapping("/analysis-history/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getAnalysisHistory(@PathVariable Long userId) {
        try {
            List<Map<String, Object>> history = imageAnalysisService.getAnalysisHistory(userId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error getting analysis history", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    //  ENHANCED: Health check endpoint with dress recommendation service status
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Wardrobe API");
        health.put("mlServiceHealth", imageAnalysisService.checkMLServiceHealth());

        //  Add dress recommendation service health
        if (dressRecommendationService != null) {
            health.put("dressRecommendationServiceHealth", dressRecommendationService.getServiceHealth());
        } else {
            health.put("dressRecommendationServiceHealth", "Not configured");
        }

        return ResponseEntity.ok(health);
    }

    // Test endpoint for ML service (EXISTING - NO CHANGES)
    @PostMapping("/test-ml-service")
    public ResponseEntity<Map<String, Object>> testMLService(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();

        try {
            String testImageUrl = request.get("imageUrl");
            if (testImageUrl == null || testImageUrl.isEmpty()) {
                testImageUrl = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800";
            }

            // Test ML service directly
            String analysisId = imageAnalysisService.initiateAnalysis(1L, testImageUrl);

            response.put("success", true);
            response.put("analysisId", analysisId);
            response.put("message", "ML service test initiated");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("ML service test failed", e);
            response.put("error", "ML service test failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    //  Private helper method to start async recommendation generation
    private void startAsyncRecommendationGeneration(String analysisId, String sexinessPreference, Integer limit) {
        CompletableFuture.runAsync(() -> {
            try {
                // Wait for analysis to complete (poll every 5 seconds, max 2 minutes)
                int maxAttempts = 24;
                int attempts = 0;

                while (attempts < maxAttempts) {
                    Thread.sleep(5000); // Wait 5 seconds

                    Map<String, Object> status = imageAnalysisService.getAnalysisStatus(analysisId);
                    String currentStatus = (String) status.get("status");

                    if ("COMPLETED".equals(currentStatus)) {
                        logger.info("Analysis completed, generating dress recommendations for: {}", analysisId);
                        dressRecommendationService.generateDressRecommendationsAsync(analysisId, sexinessPreference, limit);
                        break;
                    } else if ("FAILED".equals(currentStatus)) {
                        logger.error(" Analysis failed, cannot generate recommendations");
                        break;
                    }

                    attempts++;
                }

                if (attempts >= maxAttempts) {
                    logger.warn("Analysis took too long, recommendation generation skipped");
                }

            } catch (Exception e) {
                logger.error("Error in async recommendation generation: ", e);
            }
        });
    }
}