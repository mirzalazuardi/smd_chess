-- Add table_no to matches (0 or > 0 for regular matches, NULL for bye)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS table_no INT;

-- Constraint: when not null (non-bye), table_no must be positive
ALTER TABLE matches ADD CONSTRAINT positive_table_no
  CHECK (table_no IS NULL OR table_no > 0);

-- Index for query performance when ordering by table_no
CREATE INDEX IF NOT EXISTS idx_matches_table_no ON matches(round_id, table_no);
