-- Create table for final classifications
CREATE TABLE final_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    research_theme_id UUID NOT NULL REFERENCES research_themes(id) ON DELETE SET NULL,
    interview_score NUMERIC(4,2) NOT NULL,
    cv_score NUMERIC(4,2) NOT NULL,
    project_score NUMERIC(4,2),
    final_score NUMERIC(4,2) NOT NULL,
    rank INTEGER NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('mestrado', 'doutorado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_final_classifications_candidate_id ON final_classifications(candidate_id);
CREATE INDEX idx_final_classifications_research_theme_id ON final_classifications(research_theme_id);
CREATE INDEX idx_final_classifications_stage ON final_classifications(stage);