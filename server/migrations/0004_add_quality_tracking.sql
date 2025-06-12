-- Add quality tracking fields to components table
ALTER TABLE components 
ADD COLUMN quality_score JSONB,
ADD COLUMN user_rating INTEGER,
ADD COLUMN validation_errors JSONB,
ADD COLUMN accessibility_score INTEGER;

-- Add check constraints for rating values
ALTER TABLE components 
ADD CONSTRAINT check_user_rating 
CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5));

-- Add check constraint for accessibility score
ALTER TABLE components 
ADD CONSTRAINT check_accessibility_score 
CHECK (accessibility_score IS NULL OR (accessibility_score >= 0 AND accessibility_score <= 100));

-- Add indexes for performance
CREATE INDEX idx_components_quality_score ON components USING GIN (quality_score);
CREATE INDEX idx_components_user_rating ON components (user_rating) WHERE user_rating IS NOT NULL;
CREATE INDEX idx_components_accessibility_score ON components (accessibility_score) WHERE accessibility_score IS NOT NULL;