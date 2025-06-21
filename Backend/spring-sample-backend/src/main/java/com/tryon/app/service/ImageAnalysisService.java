package com.tryon.app.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tryon.app.model.BodyAnalysis;
import com.tryon.app.repository.BodyAnalysisRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class ImageAnalysisService {
    private static final Logger logger = LoggerFactory.getLogger(ImageAnalysisService.class);

    @Autowired
    private HuggingFaceMediaPipeService mlService;

    @Autowired
    private BodyAnalysisRepository bodyAnalysisRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${ml.service.provider}")
    private String mlProvider;

    @Transactional
    public String initiateAnalysis(Long userId, String imageUrl) {
        try {
            // Generate unique analysis ID
            String analysisId = "ANALYSIS-" + UUID.randomUUID().toString();

            // Create initial record
            BodyAnalysis analysis = new BodyAnalysis();
            analysis.setAnalysisId(analysisId);
            analysis.setUserId(userId);
            analysis.setImageUrl(imageUrl);
            analysis.setStatus("PROCESSING");
            analysis.setCreatedAt(LocalDateTime.now());
            analysis.setUpdatedAt(LocalDateTime.now());

            bodyAnalysisRepository.save(analysis);

            // Process asynchronously
            CompletableFuture.runAsync(() -> processAnalysis(analysisId, imageUrl));

            return analysisId;

        } catch (Exception e) {
            logger.error("Failed to initiate analysis", e);
            throw new RuntimeException("Failed to initiate analysis: " + e.getMessage());
        }
    }

    private void processAnalysis(String analysisId, String imageUrl) {
        try {
            logger.info("Starting analysis for ID: {}", analysisId);

            // Call ML service
            Map<String, Object> mlResponse = mlService.analyzeBodyImage(imageUrl);

            if (mlResponse.containsKey("error")) {
                updateAnalysisWithError(analysisId, mlResponse.get("error").toString());
                return;
            }

            // Standardize response
            Map<String, Object> standardized = mlService.standardizeAnalysisResult(mlResponse);

            // Update database with results
            updateAnalysisWithResults(analysisId, standardized);

        } catch (Exception e) {
            logger.error("Error processing analysis", e);
            updateAnalysisWithError(analysisId, e.getMessage());
        }
    }

    @Transactional
    private void updateAnalysisWithResults(String analysisId, Map<String, Object> results) {
        try {
            BodyAnalysis analysis = bodyAnalysisRepository.findByAnalysisId(analysisId)
                    .orElseThrow(() -> new RuntimeException("Analysis not found"));

            logger.info("Updating analysis {} with results", analysisId);

            // Convert measurements to JSON string
            if (results.containsKey("measurements") && results.get("measurements") != null) {
                Object measurementsObj = results.get("measurements");
                String measurementsJson = objectMapper.writeValueAsString(measurementsObj);
                analysis.setMeasurements(measurementsJson);
                logger.info("Saved measurements: {}", measurementsJson);
            } else {
                logger.warn("No measurements found in results!");
                // Log the entire results object to debug
                logger.debug("Full results object: {}", results);
            }

            // Set other fields
            if (results.containsKey("skinTone") && results.get("skinTone") != null) {
                analysis.setSkinTone((String) results.get("skinTone"));
                logger.info("Saved skinTone: {}", results.get("skinTone"));
            }

            if (results.containsKey("bodyType") && results.get("bodyType") != null) {
                analysis.setBodyType((String) results.get("bodyType"));
                logger.info("Saved bodyType: {}", results.get("bodyType"));
            }

            analysis.setStatus("COMPLETED");
            analysis.setUpdatedAt(LocalDateTime.now());

            bodyAnalysisRepository.save(analysis);
            logger.info("Analysis {} completed and saved successfully", analysisId);

        } catch (Exception e) {
            logger.error("Failed to update analysis results", e);
            updateAnalysisWithError(analysisId, "Failed to save results: " + e.getMessage());
        }
    }

    @Transactional
    private void updateAnalysisWithError(String analysisId, String errorMessage) {
        try {
            BodyAnalysis analysis = bodyAnalysisRepository.findByAnalysisId(analysisId)
                    .orElseThrow(() -> new RuntimeException("Analysis not found"));

            analysis.setStatus("FAILED");
            analysis.setErrorMessage(errorMessage);
            analysis.setUpdatedAt(LocalDateTime.now());

            bodyAnalysisRepository.save(analysis);
            logger.error("Analysis {} failed: {}", analysisId, errorMessage);

        } catch (Exception e) {
            logger.error("Failed to update analysis with error", e);
        }
    }

    public Map<String, Object> getAnalysisStatus(String analysisId) {
        try {
            BodyAnalysis analysis = bodyAnalysisRepository.findByAnalysisId(analysisId)
                    .orElseThrow(() -> new RuntimeException("Analysis not found"));

            Map<String, Object> status = new HashMap<>();
            status.put("analysisId", analysis.getAnalysisId());
            status.put("status", analysis.getStatus());
            status.put("createdAt", analysis.getCreatedAt());
            status.put("updatedAt", analysis.getUpdatedAt());

            if ("COMPLETED".equals(analysis.getStatus())) {
                // Parse measurements from JSON string
                if (analysis.getMeasurements() != null) {
                    try {
                        Map<String, Object> measurements = objectMapper.readValue(
                                analysis.getMeasurements(),
                                Map.class
                        );
                        status.put("measurements", measurements);
                    } catch (Exception e) {
                        logger.error("Failed to parse measurements JSON", e);
                        status.put("measurements", null);
                    }
                } else {
                    status.put("measurements", null);
                }

                status.put("skinTone", analysis.getSkinTone());
                status.put("bodyType", analysis.getBodyType());
            } else if ("FAILED".equals(analysis.getStatus())) {
                status.put("errorMessage", analysis.getErrorMessage());
            }

            return status;

        } catch (Exception e) {
            logger.error("Failed to get analysis status", e);
            throw new RuntimeException("Failed to get analysis status: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> getAnalysisHistory(Long userId) {
        try {
            List<BodyAnalysis> analyses = bodyAnalysisRepository.findByUserIdOrderByCreatedAtDesc(userId);
            List<Map<String, Object>> history = new ArrayList<>();

            for (BodyAnalysis analysis : analyses) {
                Map<String, Object> item = new HashMap<>();
                item.put("analysisId", analysis.getAnalysisId());
                item.put("status", analysis.getStatus());
                item.put("imageUrl", analysis.getImageUrl());
                item.put("createdAt", analysis.getCreatedAt());

                if ("COMPLETED".equals(analysis.getStatus())) {
                    item.put("bodyType", analysis.getBodyType());
                    item.put("skinTone", analysis.getSkinTone());
                    // Optionally include measurements in history
                    if (analysis.getMeasurements() != null) {
                        try {
                            Map<String, Object> measurements = objectMapper.readValue(
                                    analysis.getMeasurements(),
                                    Map.class
                            );
                            item.put("measurements", measurements);
                        } catch (Exception e) {
                            logger.error("Failed to parse measurements for history", e);
                        }
                    }
                }

                history.add(item);
            }

            return history;

        } catch (Exception e) {
            logger.error("Failed to get analysis history", e);
            throw new RuntimeException("Failed to get analysis history: " + e.getMessage());
        }
    }

    public boolean checkMLServiceHealth() {
        return mlService.checkHealth();
    }
}