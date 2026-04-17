package com.trailbuddy.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload.path:./uploads}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadRoot = Paths.get(uploadPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadRoot.resolve("images"));
            Files.createDirectories(uploadRoot.resolve("videos"));
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to initialize upload directories", ex);
        }
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}
