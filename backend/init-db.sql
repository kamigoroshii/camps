# Database Initialization Script

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS campus_portal;

-- Connect to database
\c campus_portal;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE campus_portal TO campus_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO campus_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO campus_user;

-- Create indexes for better performance (will be created by SQLAlchemy, but listed here for reference)
-- CREATE INDEX idx_users_email ON users(email);
-- CREATE INDEX idx_users_username ON users(username);
-- CREATE INDEX idx_requests_user_id ON service_requests(user_id);
-- CREATE INDEX idx_requests_status ON service_requests(status);
-- CREATE INDEX idx_requests_created_at ON service_requests(created_at);
