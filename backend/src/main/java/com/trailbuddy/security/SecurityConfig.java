package com.trailbuddy.security;

import com.trailbuddy.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        logger.info("Configuring SecurityFilterChain - context path is /api");
        
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                // Public auth endpoints
                .requestMatchers("/auth/signin").permitAll()
                .requestMatchers("/api/auth/signin").permitAll()
                .requestMatchers("/auth/signup").permitAll()
                .requestMatchers("/api/auth/signup").permitAll()
                .requestMatchers("/auth/refresh").permitAll()
                .requestMatchers("/api/auth/refresh").permitAll()
                .requestMatchers("/auth/refresh-token").permitAll()
                .requestMatchers("/api/auth/refresh-token").permitAll()
                .requestMatchers("/auth/forgot-password").permitAll()
                .requestMatchers("/api/auth/forgot-password").permitAll()
                .requestMatchers("/auth/reset-password").permitAll()
                .requestMatchers("/api/auth/reset-password").permitAll()
                .requestMatchers("/auth/verify-email").permitAll()
                .requestMatchers("/api/auth/verify-email").permitAll()
                .requestMatchers("/auth/check-email").permitAll()
                .requestMatchers("/api/auth/check-email").permitAll()
                .requestMatchers("/auth/check-phone").permitAll()
                .requestMatchers("/api/auth/check-phone").permitAll()
                .requestMatchers("/auth/resend-verification").permitAll()
                .requestMatchers("/api/auth/resend-verification").permitAll()
                .requestMatchers("/auth/google-signin").permitAll()
                .requestMatchers("/api/auth/google-signin").permitAll()
                .requestMatchers("/auth/phone-signin").permitAll()
                .requestMatchers("/api/auth/phone-signin").permitAll()
                .requestMatchers("/auth/send-otp").permitAll()
                .requestMatchers("/api/auth/send-otp").permitAll()
                .requestMatchers("/auth/check").permitAll()
                .requestMatchers("/api/auth/check").permitAll()
                // DigiLocker callback + fake provider must be publicly reachable; auth-url itself is protected by @PreAuthorize.
                .requestMatchers("/digilocker/callback").permitAll()
                .requestMatchers("/api/digilocker/callback").permitAll()
                .requestMatchers("/fake-digilocker/**").permitAll()
                .requestMatchers("/api/fake-digilocker/**").permitAll()
                // Public endpoints
                .requestMatchers("/public/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                // API docs
                .requestMatchers("/api-docs/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // Keep framework error endpoint public to avoid recursive AccessDenied handling.
                .requestMatchers("/error", "/api/error").permitAll()
                // Guide revenue model requires auth (not public listing)
                .requestMatchers(HttpMethod.GET, "/guides/revenue-model").authenticated()
                // Public GET endpoints
                .requestMatchers(HttpMethod.GET, "/guides").permitAll()
                .requestMatchers(HttpMethod.GET, "/guides/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/guides").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/guides/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/guide-packages/by-guide/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/guide-packages/by-guide/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/guide-packages/explore").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/guide-packages/explore").permitAll()
                .requestMatchers(HttpMethod.GET, "/guide-packages/listing/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/guide-packages/listing/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/stories").permitAll()
                .requestMatchers(HttpMethod.GET, "/stories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/stories").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/stories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/reviews/guide/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/reviews/guide/**").permitAll()
                // Webhook and WebSocket
                .requestMatchers("/webhook/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                // All other requests need authentication
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider(passwordEncoder))
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        logger.info("SecurityFilterChain configured successfully");
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
