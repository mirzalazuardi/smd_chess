-- Initial schema: tournaments, registrations, rounds, matches

-- Create tournament status enum
DO $$ BEGIN
  CREATE TYPE tournament_status AS ENUM ('draft', 'open', 'ongoing', 'finished');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create student status enum
DO $$ BEGIN
  CREATE TYPE student_status AS ENUM ('pelajar', 'umum');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create round status enum
DO $$ BEGIN
  CREATE TYPE round_status AS ENUM ('pending', 'pairing', 'ongoing', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create match status enum
DO $$ BEGIN
  CREATE TYPE match_status AS ENUM ('pending', 'ongoing', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- tournaments
-- ============================================================
CREATE TABLE IF NOT EXISTS tournaments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(50) UNIQUE NOT NULL
                CHECK (code ~ '^[a-z0-9_]+$'),
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  rounds_count  INT NOT NULL DEFAULT 5
                CHECK (rounds_count > 0),
  status        tournament_status NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS registrations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id       VARCHAR(20) UNIQUE NOT NULL,
  tournament_id         UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  full_name             VARCHAR(100) NOT NULL,
  email                 VARCHAR(255) NOT NULL,
  student_status        student_status NOT NULL,
  school_name           VARCHAR(100),
  wa_number             VARCHAR(15) NOT NULL,
  chess_rating          INT CHECK (chess_rating >= 0 AND chess_rating <= 3000),
  proof_transfer_url    VARCHAR(500) NOT NULL,
  paid                  BOOLEAN NOT NULL DEFAULT FALSE,
  payment_verified_at   TIMESTAMPTZ,
  payment_verified_by   UUID,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, email)
);

-- Index for filtering active registrations per tournament
CREATE INDEX IF NOT EXISTS idx_registrations_tournament_paid
  ON registrations(tournament_id, paid, is_active);

-- ============================================================
-- tournament_rounds
-- ============================================================
CREATE TABLE IF NOT EXISTS tournament_rounds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number    INT NOT NULL CHECK (round_number > 0),
  status          round_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, round_number)
);

-- ============================================================
-- matches
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id        UUID NOT NULL REFERENCES tournament_rounds(id) ON DELETE CASCADE,
  player1_id      UUID NOT NULL REFERENCES registrations(id),
  player2_id      UUID REFERENCES registrations(id),  -- NULL for bye
  player1_score   DECIMAL(2,1) CHECK (player1_score IN (0, 0.5, 1)),
  player2_score   DECIMAL(2,1) CHECK (player2_score IN (0, 0.5, 1)),
  status          match_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_players CHECK (player1_id <> player2_id)
);

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
