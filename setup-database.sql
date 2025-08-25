-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  meta TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS codes (
  id SERIAL PRIMARY KEY,
  user TEXT NOT NULL,
  step TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS verification_codes (
  id SERIAL PRIMARY KEY,
  recovery_target TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  user_agent TEXT,
  ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password_changes table if it doesn't exist
CREATE TABLE IF NOT EXISTS password_changes (
  id SERIAL PRIMARY KEY,
  user TEXT NOT NULL,
  phone_or_email TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create latest table if it doesn't exist
CREATE TABLE IF NOT EXISTS latest (
  id SERIAL PRIMARY KEY,
  user TEXT NOT NULL,
  latest_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE latest ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anonymous inserts
CREATE POLICY "Allow anonymous inserts" ON users
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts" ON codes
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts" ON verification_codes
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts" ON password_changes
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts" ON latest
  FOR INSERT TO anon
  WITH CHECK (true);
