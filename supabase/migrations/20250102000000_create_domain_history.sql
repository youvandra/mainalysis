/*
  # Create Domain History Table

  1. New Tables
    - `domain_history`
      - `id` (uuid, primary key) - Unique identifier for each history entry
      - `domain_name` (text) - The domain name that was analyzed
      - `price` (text) - The price of the domain in wei (stored as text to handle large numbers)
      - `analyzed_at` (timestamptz) - When the domain was analyzed
      - `user_session` (text) - Session identifier to track user-specific history
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `domain_history` table
    - Add policy for users to read their own history based on session
    - Add policy for users to insert their own history
*/

-- Create domain_history table
CREATE TABLE IF NOT EXISTS domain_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text NOT NULL,
  price text NOT NULL,
  analyzed_at timestamptz DEFAULT now(),
  user_session text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE domain_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to read all history
CREATE POLICY "Allow anonymous read access"
  ON domain_history
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow anonymous users to insert history
CREATE POLICY "Allow anonymous insert access"
  ON domain_history
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_domain_history_session ON domain_history(user_session);
CREATE INDEX IF NOT EXISTS idx_domain_history_analyzed_at ON domain_history(analyzed_at DESC);
