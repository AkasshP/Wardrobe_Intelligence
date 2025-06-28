package com.tryon.app.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA Converter for handling PostgreSQL JSONB columns
 * This version uses Jakarta persistence (for Spring Boot 3.x)
 */
@Converter
public class JsonbConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return attribute;
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return dbData;
    }
}