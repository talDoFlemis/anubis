-- Create table for interview evaluations
CREATE TABLE interview_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    decision_making INTEGER NOT NULL CHECK (decision_making IN (4,6,8,10)),
    problem_analysis INTEGER NOT NULL CHECK (problem_analysis IN (4,6,8,10)),
    oral_communication INTEGER NOT NULL CHECK (oral_communication IN (4,6,8,10)),
    research_work INTEGER NOT NULL CHECK (research_work IN (4,6,8,10)),
    technical_knowledge INTEGER NOT NULL CHECK (technical_knowledge IN (4,6,8,10)),
    observations TEXT,
    conducted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_interview_evaluations_candidate_id ON interview_evaluations(candidate_id);
CREATE INDEX idx_interview_evaluations_interviewer_id ON interview_evaluations(interviewer_id);
