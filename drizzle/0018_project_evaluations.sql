-- Create table for project evaluations (doctoral research project)
CREATE TABLE project_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    criterion_1 INTEGER NOT NULL CHECK (criterion_1 IN (4,6,8,10)),
    criterion_2 INTEGER NOT NULL CHECK (criterion_2 IN (4,6,8,10)),
    criterion_3 INTEGER NOT NULL CHECK (criterion_3 IN (4,6,8,10)),
    criterion_4 INTEGER NOT NULL CHECK (criterion_4 IN (4,6,8,10)),
    criterion_5 INTEGER NOT NULL CHECK (criterion_5 IN (4,6,8,10)),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_project_evaluations_candidate_id ON project_evaluations(candidate_id);
CREATE INDEX idx_project_evaluations_evaluator_id ON project_evaluations(evaluator_id);
