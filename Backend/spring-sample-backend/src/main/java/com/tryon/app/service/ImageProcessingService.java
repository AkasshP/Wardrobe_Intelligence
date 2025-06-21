package com.tryon.app.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class ImageProcessingService {

    private static final Logger logger = LoggerFactory.getLogger(ImageProcessingService.class);

    @Value("${gcp.project-id:}")
    private String projectId;

    @Value("${gcp.bucket.name:}")
    private String bucketName;

    @Value("${gcp.credentials.path:}")
    private String credentialsPath;

    private Storage storage;

    @PostConstruct
    public void init() {
        try {
            logger.info("=== GCP Storage Initialization ===");
            logger.info("Project ID: {}", projectId);
            logger.info("Bucket Name: {}", bucketName);
            logger.info("Credentials Path: {}", credentialsPath);

            // Skip GCP initialization if not configured
            if (projectId.isEmpty() || bucketName.isEmpty()) {
                logger.warn("GCP configuration not found. Using local storage mode.");
                return;
            }

            // Initialize GCP Storage with credentials
            StorageOptions.Builder optionsBuilder = StorageOptions.newBuilder()
                    .setProjectId(projectId);

            // Load credentials if path is specified
            if (!credentialsPath.isEmpty()) {
                try {
                    ClassPathResource resource = new ClassPathResource(credentialsPath.replace("classpath:", ""));
                    try (InputStream credentialsStream = resource.getInputStream()) {
                        GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream);
                        optionsBuilder.setCredentials(credentials);
                        logger.info("GCP credentials loaded successfully from: {}", credentialsPath);
                    }
                } catch (Exception e) {
                    logger.error("Failed to load GCP credentials from path: {}", credentialsPath, e);
                    throw e;
                }
            } else {
                logger.info("Using default GCP credentials");
            }

            storage = optionsBuilder.build().getService();

            // Verify bucket exists
            try {
                Bucket bucket = storage.get(bucketName);
                if (bucket == null) {
                    logger.error("GCP bucket {} does not exist!", bucketName);
                    storage = null;
                    return;
                } else {
                    logger.info("GCP bucket {} found successfully", bucketName);
                    logger.info("Bucket location: {}", bucket.getLocation());
                    logger.info("Bucket storage class: {}", bucket.getStorageClass());
                }
            } catch (Exception e) {
                logger.error("Could not verify bucket existence: {}", e.getMessage(), e);
                storage = null;
                return;
            }

            logger.info("=== GCP Storage initialized successfully ===");
        } catch (Exception e) {
            logger.error("Failed to initialize GCP Storage", e);
            storage = null;
        }
    }

    /**
     * Upload image to GCP Cloud Storage
     */
    public String uploadImage(MultipartFile file, String folder) throws IOException {
        logger.info("=== Starting Image Upload ===");
        logger.info("File name: {}", file.getOriginalFilename());
        logger.info("File size: {} bytes", file.getSize());
        logger.info("Content type: {}", file.getContentType());
        logger.info("Target folder: {}", folder);

        validateFile(file);

        String fileName = generateFileName(file.getOriginalFilename());
        String blobName = folder + "/" + fileName;

        try {
            // For development without GCP, save locally
            if (storage == null) {
                logger.warn("GCP Storage not initialized. Saving file locally for development.");
                return saveFileLocally(file, folder, fileName);
            }

            logger.info("Uploading to GCP bucket: {}", bucketName);
            logger.info("Blob name: {}", blobName);

            // Create blob metadata
            BlobId blobId = BlobId.of(bucketName, blobName);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType(file.getContentType())
                    .build();

            // Upload file
            logger.info("Creating blob in GCP...");
            Blob blob = storage.create(blobInfo, file.getBytes());
            logger.info("Blob created successfully. Generation: {}", blob.getGeneration());

            // Make blob publicly accessible
            try {
                logger.info("Setting public access for blob...");
                blob.createAcl(Acl.of(Acl.User.ofAllUsers(), Acl.Role.READER));
                logger.info("Public access set successfully");
            } catch (Exception e) {
                logger.warn("Could not set public ACL. Bucket might have uniform access control: {}", e.getMessage());
            }

            // Return public URL
            String publicUrl = String.format("https://storage.googleapis.com/%s/%s",
                    bucketName, blobName);

            logger.info("=== Image uploaded successfully ===");
            logger.info("Public URL: {}", publicUrl);
            return publicUrl;

        } catch (Exception e) {
            logger.error("Failed to upload image to GCP", e);
            logger.error("Error type: {}", e.getClass().getName());
            logger.error("Error message: {}", e.getMessage());
            throw new IOException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    /**
     * Save file locally for development
     */
    private String saveFileLocally(MultipartFile file, String folder, String fileName) throws IOException {
        try {
            logger.info("Saving file locally...");
            // Create local upload directory if it doesn't exist
            Path uploadPath = Paths.get("./uploads", folder);
            Files.createDirectories(uploadPath);

            // Save file
            Path filePath = uploadPath.resolve(fileName);
            file.transferTo(filePath.toFile());

            // Return local URL
            String localUrl = "http://localhost:8080/uploads/" + folder + "/" + fileName;
            logger.info("File saved locally: {}", localUrl);
            return localUrl;
        } catch (Exception e) {
            logger.error("Failed to save file locally", e);
            throw new IOException("Failed to save file locally: " + e.getMessage());
        }
    }

    /**
     * Validate uploaded file
     */
    private void validateFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("File is empty");
        }

        // Check file size (max 10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IOException("File size exceeds 10MB limit");
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IOException("Invalid file type. Only images are allowed");
        }

        // Check specific image formats
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String extension = getFileExtension(originalFilename).toLowerCase();
            if (!isValidImageExtension(extension)) {
                throw new IOException("Invalid image format. Supported formats: jpg, jpeg, png, webp");
            }
        }
    }

    /**
     * Generate unique file name
     */
    private String generateFileName(String originalFilename) {
        String extension = getFileExtension(originalFilename);
        String timestamp = String.valueOf(System.currentTimeMillis());
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return timestamp + "_" + uuid + "." + extension;
    }

    /**
     * Get file extension
     */
    private String getFileExtension(String filename) {
        if (filename == null) return "jpg";
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1) : "jpg";
    }

    /**
     * Check if file extension is valid
     */
    private boolean isValidImageExtension(String extension) {
        return extension.equals("jpg") ||
                extension.equals("jpeg") ||
                extension.equals("png") ||
                extension.equals("webp");
    }

    /**
     * Get current date in YYYY/MM/DD format
     */
    private String getCurrentDate() {
        java.time.LocalDate date = java.time.LocalDate.now();
        return date.getYear() + "/" +
                String.format("%02d", date.getMonthValue()) + "/" +
                String.format("%02d", date.getDayOfMonth());
    }

    /**
     * Check if storage is properly configured
     */
    public boolean isStorageConfigured() {
        return storage != null;
    }
}