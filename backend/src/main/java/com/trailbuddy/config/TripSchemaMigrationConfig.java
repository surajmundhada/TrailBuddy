package com.trailbuddy.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class TripSchemaMigrationConfig {

    private static final Logger logger = LoggerFactory.getLogger(TripSchemaMigrationConfig.class);

    @Bean
    ApplicationRunner tripSchemaMigrationRunner(JdbcTemplate jdbcTemplate) {
        return args -> {
            safelyExecute(jdbcTemplate, "ALTER TABLE trip_sessions MODIFY COLUMN trip_status VARCHAR(64) NOT NULL");
            safelyExecute(jdbcTemplate, "ALTER TABLE trip_events MODIFY COLUMN event_type VARCHAR(64) NOT NULL");
        };
    }

    private void safelyExecute(JdbcTemplate jdbcTemplate, String sql) {
        try {
            jdbcTemplate.execute(sql);
            logger.info("Applied schema patch: {}", sql);
        } catch (Exception ex) {
            logger.debug("Skipped schema patch `{}`: {}", sql, ex.getMessage());
        }
    }
}
