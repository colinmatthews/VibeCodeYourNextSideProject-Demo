-- Migration: Add quality tracking fields to components table
-- Phase 1: Quality validation pipeline

ALTER TABLE components 
ADD COLUMN quality_score JSONB,
ADD COLUMN user_rating INTEGER,
ADD COLUMN validation_errors JSONB,
ADD COLUMN accessibility_score INTEGER;

-- Add constraints for data integrity
ALTER TABLE components 
ADD CONSTRAINT user_rating_range CHECK (user_rating >= 1 AND user_rating <= 5),
ADD CONSTRAINT accessibility_score_range CHECK (accessibility_score >= 0 AND accessibility_score <= 100);

-- Add indexes for performance
CREATE INDEX idx_components_user_rating ON components(user_rating);
CREATE INDEX idx_components_accessibility_score ON components(accessibility_score);
CREATE INDEX idx_components_quality_score ON components USING GIN(quality_score);