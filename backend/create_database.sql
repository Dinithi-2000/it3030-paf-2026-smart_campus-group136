-- Run this script in MySQL Workbench before starting the Spring Boot app
-- This creates the database that the application will connect to

CREATE DATABASE IF NOT EXISTS smart_campus_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Verify
SHOW DATABASES LIKE 'smart_campus_db';
