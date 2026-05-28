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
  visual_sources JSONB NULL,
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
  visual_source JSONB NULL,
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

CREATE TABLE IF NOT EXISTS multiplayer_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  round_count INTEGER NOT NULL,
  timed BOOLEAN NOT NULL,
  round_time_seconds INTEGER NULL,
  owner_player_id TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash TEXT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS multiplayer_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_owner BOOLEAN NOT NULL DEFAULT FALSE,
  connected BOOLEAN NOT NULL DEFAULT TRUE,
  total_score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NULL,
  UNIQUE (room_id, player_id),
  UNIQUE (room_id, display_name)
);

CREATE TABLE IF NOT EXISTS multiplayer_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES locations(id),
  round_number INTEGER NOT NULL,
  visual_source JSONB NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NULL,
  ends_at TIMESTAMPTZ NULL,
  resolved_at TIMESTAMPTZ NULL,
  resolution_reason TEXT NULL,
  UNIQUE (room_id, round_number)
);

CREATE TABLE IF NOT EXISTS multiplayer_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES multiplayer_rounds(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  guess_label TEXT NULL,
  guess_latitude DOUBLE PRECISION NULL,
  guess_longitude DOUBLE PRECISION NULL,
  distance_km DOUBLE PRECISION NULL,
  score INTEGER NOT NULL DEFAULT 0,
  resolution_reason TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (round_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_multiplayer_rounds_location_id ON multiplayer_rounds(location_id);
