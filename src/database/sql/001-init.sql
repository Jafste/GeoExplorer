CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  category TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  scene_label TEXT NOT NULL,
  scene_note TEXT NOT NULL,
  scene_image TEXT NULL,
  media_source_provider TEXT NULL,
  image_url TEXT NULL,
  image_source_url TEXT NULL,
  image_attribution TEXT NULL,
  image_license TEXT NULL,
  image_license_url TEXT NULL,
  street_view_provider TEXT NULL,
  street_view_url TEXT NULL,
  media_verified_at DATE NULL,
  prompt TEXT NOT NULL,
  visual_gradient JSONB NOT NULL,
  clues JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  round_count INTEGER NOT NULL,
  timed BOOLEAN NOT NULL,
  round_time_seconds INTEGER NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'created',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES locations(id),
  round_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  guess_label TEXT NULL,
  guess_latitude DOUBLE PRECISION NULL,
  guess_longitude DOUBLE PRECISION NULL,
  distance_km DOUBLE PRECISION NULL,
  score INTEGER NOT NULL DEFAULT 0,
  resolution_reason TEXT NULL,
  resolved_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_session_rounds_session_id ON session_rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_session_rounds_location_id ON session_rounds(location_id);
