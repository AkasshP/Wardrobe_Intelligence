package com.tryon.app.controller;
import com.tryon.app.service.ImageAnalysisService;
import com.tryon.app.service.ImageProcessingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wardrobe")
@CrossOrigin(origins = "*")
public class WardrobeController {
    private static final Logger logger = LoggerFactory.getLogger(WardrobeController.class);

    @Autowired
    private ImageProcessingService imageProcessingService;

    @Autowired
    private ImageAnalysisService imageAnalysisService;

    // Upload body image for analysis
    @PostMapping("/upload-body-image")
    public ResponseEntity<Map<String, Object>> uploadBodyImage(
            @RequestParam("image") MultipartFile file,
            @RequestParam("userId") Long userId) {

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

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error uploading body image", e);
            response.put("error", "Failed to upload image: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Test GCP Storage configuration
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
    // Get analysis status
    @GetMapping("/analysis-status/{analysisId}")
    public ResponseEntity<Map<String, Object>> getAnalysisStatus(@PathVariable String analysisId) {
        try {
            Map<String, Object> status = imageAnalysisService.getAnalysisStatus(analysisId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            logger.error("Error getting analysis status", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    // Get user's analysis history
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

    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Wardrobe API");
        health.put("mlServiceHealth", imageAnalysisService.checkMLServiceHealth());
        return ResponseEntity.ok(health);
    }

    // Test endpoint for ML service
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

}
