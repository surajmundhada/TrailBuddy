-- Trail Buddy Database Schema
-- Production-ready MySQL database for India's Most Trusted Local Travel Guide Platform

-- Create database
CREATE DATABASE IF NOT EXISTS trailbuddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE trailbuddy;

-- Roles table
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('USER', 'GUIDE', 'ADMIN') NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_image_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);

-- User roles junction table
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Guides table (extends users with guide-specific information)
CREATE TABLE guides (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    aadhar_number VARCHAR(12) UNIQUE,
    aadhar_verified BOOLEAN DEFAULT FALSE,
    bio TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    languages JSON, -- Array of languages spoken
    expertise_areas JSON, -- Array of expertise areas
    hourly_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    experience_years INT DEFAULT 0,
    total_bookings INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    verification_documents JSON, -- Store document URLs
    admin_notes TEXT,
    rejection_reason TEXT,
    approved_at TIMESTAMP NULL,
    approved_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_city (city),
    INDEX idx_verified (is_verified),
    INDEX idx_approved (is_approved),
    INDEX idx_rating (average_rating)
);

-- Guide availability calendar
CREATE TABLE guide_availability (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    guide_id BIGINT NOT NULL,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_guide_date (guide_id, date),
    FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE,
    INDEX idx_guide_date (guide_id, date)
);

-- Bookings table
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    guide_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    total_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    guide_earnings DECIMAL(10,2) NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUNDED') DEFAULT 'PENDING',
    cancellation_reason TEXT,
    special_requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE,
    INDEX idx_user_bookings (user_id),
    INDEX idx_guide_bookings (guide_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
);

-- Payments table
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method ENUM('RAZORPAY', 'UPI', 'CARD', 'WALLET') NOT NULL,
    payment_status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    razorpay_payment_id VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    refund_id VARCHAR(255),
    refund_amount DECIMAL(10,2),
    refunded_at TIMESTAMP NULL,
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking_payment (booking_id),
    INDEX idx_user_payments (user_id),
    INDEX idx_status (payment_status),
    INDEX idx_razorpay_payment (razorpay_payment_id)
);

-- Reviews table
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    guide_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE,
    INDEX idx_guide_reviews (guide_id),
    INDEX idx_user_reviews (user_id),
    INDEX idx_rating (rating)
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    plan_type ENUM('BASIC', 'PRO', 'PREMIUM') NOT NULL DEFAULT 'BASIC',
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    auto_renew BOOLEAN DEFAULT FALSE,
    payment_id BIGINT NULL,
    cancelled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    INDEX idx_user_subscription (user_id),
    INDEX idx_active (is_active),
    INDEX idx_end_date (end_date)
);

-- Stories table
CREATE TABLE stories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    guide_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    images JSON, -- Array of image URLs
    tags JSON, -- Array of tags
    location VARCHAR(255),
    is_public BOOLEAN DEFAULT TRUE,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE,
    INDEX idx_guide_stories (guide_id),
    INDEX idx_public (is_public),
    INDEX idx_created_at (created_at)
);

-- Story likes table
CREATE TABLE story_likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    story_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_story_like (story_id, user_id),
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_story_likes (story_id),
    INDEX idx_user_likes (user_id)
);

-- Story comments table
CREATE TABLE story_comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    story_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    comment_text TEXT NOT NULL,
    parent_comment_id BIGINT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES story_comments(id) ON DELETE CASCADE,
    INDEX idx_story_comments (story_id),
    INDEX idx_user_comments (user_id),
    INDEX idx_parent_comment (parent_comment_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    booking_id BIGINT NULL,
    message_text TEXT NOT NULL,
    message_type ENUM('TEXT', 'IMAGE', 'DOCUMENT', 'LOCATION') DEFAULT 'TEXT',
    file_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_sender_receiver (sender_id, receiver_id),
    INDEX idx_booking_chat (booking_id),
    INDEX idx_created_at (created_at),
    INDEX idx_unread (is_read, receiver_id)
);

-- Notifications table
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('BOOKING', 'PAYMENT', 'REVIEW', 'CHAT', 'SYSTEM', 'SUBSCRIPTION') NOT NULL,
    related_id BIGINT NULL, -- ID of related entity (booking_id, payment_id, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    push_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_notifications (user_id),
    INDEX idx_unread (is_read),
    INDEX idx_type (notification_type),
    INDEX idx_created_at (created_at)
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_token (user_id),
    INDEX idx_expires (expires_at)
);

-- Email verification tokens table
CREATE TABLE email_verification_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_token (user_id),
    INDEX idx_expires (expires_at)
);

-- Admin audit log table
CREATE TABLE admin_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_actions (admin_user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('USER', 'Regular traveler user'),
('GUIDE', 'Verified local guide'),
('ADMIN', 'Platform administrator');

-- Insert admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, email_verified, is_active) VALUES 
('admin@trailbuddy.com', '$2a$10$9VY8z1OZ8I5K8Y8Z1OZ8I5K8Y8Z1OZ8I5K8Y8Z1OZ8I5K8Y8Z1OZ8I', 'Admin', 'User', TRUE, TRUE);

-- Assign admin role to admin user
INSERT INTO user_roles (user_id, role_id) VALUES 
(1, (SELECT id FROM roles WHERE name = 'ADMIN'));

-- Create indexes for better performance
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_guides_created_at ON guides(created_at);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_stories_created_at ON stories(created_at);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Add full-text search indexes
CREATE FULLTEXT INDEX idx_guides_bio_search ON guides(bio);
CREATE FULLTEXT INDEX idx_stories_content_search ON stories(title, content);
CREATE FULLTEXT INDEX idx_stories_title_search ON stories(title);
