package com.trailbuddy.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trailbuddy.model.PreferenceProfile;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Converter
public class PreferenceProfileConverter implements AttributeConverter<PreferenceProfile, String> {

    private static final Logger logger = LoggerFactory.getLogger(PreferenceProfileConverter.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(PreferenceProfile attribute) {
        if (attribute == null) {
            return "{}";
        }

        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException exception) {
            logger.error("Could not serialize preference profile", exception);
            return "{}";
        }
    }

    @Override
    public PreferenceProfile convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return new PreferenceProfile();
        }

        try {
            return objectMapper.readValue(dbData, PreferenceProfile.class);
        } catch (JsonProcessingException exception) {
            logger.error("Could not deserialize preference profile", exception);
            return new PreferenceProfile();
        }
    }
}
