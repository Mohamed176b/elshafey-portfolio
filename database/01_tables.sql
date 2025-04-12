-- Create tables for the portfolio project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profile table
CREATE TABLE IF NOT EXISTS profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    email VARCHAR(255),
    linkedin_url TEXT,
    github_url TEXT,
    resume_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profile(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnailUrl TEXT,
    demoLink TEXT,
    githubLink TEXT,
    techs UUID[] DEFAULT '{}',
    features TEXT[] DEFAULT '{}',
    display_order INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create available_techs table
CREATE TABLE IF NOT EXISTS available_techs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profile(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create visit_stats table
CREATE TABLE IF NOT EXISTS visit_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_visits BIGINT DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create page_visits table
CREATE TABLE IF NOT EXISTS page_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    visitor_id TEXT,
    browser TEXT,
    device TEXT,
    location TEXT,
    referrer TEXT,
    visit_date TIMESTAMPTZ DEFAULT NOW(),
    page_path TEXT
);

-- Create contact_requests table
CREATE TABLE IF NOT EXISTS contact_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profile(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_projects_profile_id ON projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_tech_profile_id ON available_techs(profile_id);
CREATE INDEX IF NOT EXISTS idx_visits_project_id ON page_visits(project_id);
CREATE INDEX IF NOT EXISTS idx_contact_profile_id ON contact_requests(profile_id);