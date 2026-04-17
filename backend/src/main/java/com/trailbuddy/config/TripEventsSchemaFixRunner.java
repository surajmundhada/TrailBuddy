package com.trailbuddy.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Older DBs may have {@code trip_events.event_type} as a MySQL ENUM with a stale value list.
 * Hibernate then fails with "Data truncated for column 'event_type'" when inserting new enum names.
 * Normalize to VARCHAR so all {@link com.trailbuddy.model.TripEventType} values persist.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TripEventsSchemaFixRunner implements CommandLineRunner {

    private final DataSource dataSource;

    public TripEventsSchemaFixRunner(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        try (Connection conn = dataSource.getConnection()) {
            String product = conn.getMetaData().getDatabaseProductName();
            if (product == null || !product.toLowerCase().contains("mysql")) {
                return;
            }
            try (Statement st = conn.createStatement()) {
                st.executeUpdate("ALTER TABLE trip_events MODIFY COLUMN event_type VARCHAR(64) NOT NULL");
            }
        } catch (SQLException ignored) {
            // Table missing, not MySQL, or insufficient privilege — ignore so dev still starts.
        }
    }
}
