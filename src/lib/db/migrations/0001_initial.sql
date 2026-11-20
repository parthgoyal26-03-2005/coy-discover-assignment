CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  age integer NOT NULL CHECK(age >= 18),
  city text NOT NULL,
  bio text NOT NULL,
  interests text[] NOT NULL,
  photo_url text NOT NULL,
  sort_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE demo_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL CHECK(action IN ('like','pass')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX unique_swipe ON swipes(session_id, profile_id);
CREATE TABLE incoming_likes (
  session_id uuid NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id),
  PRIMARY KEY(session_id, profile_id)
);
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX unique_match ON matches(session_id, profile_id);
CREATE INDEX session_matches ON matches(session_id, created_at);
