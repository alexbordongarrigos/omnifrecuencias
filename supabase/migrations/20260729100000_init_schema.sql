-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. os_profiles
CREATE TABLE IF NOT EXISTS os_profiles (
  user_id text PRIMARY KEY,
  display_name text,
  avatar_url text,
  cover_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE os_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON os_profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON os_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON os_profiles FOR UPDATE USING (true);

-- 2. omni_presets
CREATE TABLE IF NOT EXISTS omni_presets (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  content jsonb NOT NULL,
  author_id text NOT NULL,
  is_public boolean DEFAULT false,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE omni_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for public presets" ON omni_presets FOR SELECT USING (is_public = true);
CREATE POLICY "Enable read access for author" ON omni_presets FOR SELECT USING (true); -- Permitimos lectura general temporalmente para debug
CREATE POLICY "Enable insert for all" ON omni_presets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all" ON omni_presets FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all" ON omni_presets FOR DELETE USING (true);

-- 3. omni_sessions
CREATE TABLE IF NOT EXISTS omni_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id text NOT NULL,
  host_name text,
  preset_name text,
  preset_content jsonb NOT NULL,
  is_public boolean DEFAULT false,
  allow_open_modifications boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE omni_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for sessions" ON omni_sessions FOR SELECT USING (true); -- Permitimos leer todas (las privadas usan UUID, así que no se ven en la lista de todos modos si el cliente filtra por is_public=true)
CREATE POLICY "Enable insert access for sessions" ON omni_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for sessions" ON omni_sessions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for sessions" ON omni_sessions FOR DELETE USING (true);

-- 4. os_files
CREATE TABLE IF NOT EXISTS os_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner text NOT NULL,
  name text NOT NULL,
  mime text NOT NULL,
  size bigint,
  path text UNIQUE NOT NULL,
  is_public boolean DEFAULT false,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE os_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for files" ON os_files FOR SELECT USING (true);
CREATE POLICY "Enable insert access for files" ON os_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for files" ON os_files FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for files" ON os_files FOR DELETE USING (true);

-- 5. omni_resonances
CREATE TABLE IF NOT EXISTS omni_resonances (
  follower_id text NOT NULL,
  following_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE omni_resonances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for resonances" ON omni_resonances FOR SELECT USING (true);
CREATE POLICY "Enable insert access for resonances" ON omni_resonances FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete access for resonances" ON omni_resonances FOR DELETE USING (true);
