/*
  # Create analyzed_domains table

  1. New Tables
    - `analyzed_domains`
      - `id` (uuid, primary key) - Unique identifier for each analysis
      - `account_id` (uuid, foreign key) - References the account that analyzed the domain
      - `domain_name` (text) - Full domain name (e.g., "example.com")
      - `price` (numeric) - Domain price in ETH (stored as wei)
      - `analysis_data` (jsonb) - Stores the complete AI-generated analysis including:
        - valueHistory: array of historical value data points
        - trafficData: array of estimated traffic data
        - seoMetrics: array of SEO metric scores
        - keywordData: array of related keywords with volume and difficulty
        - features: array of domain features
        - marketScore: estimated market score
        - estimatedGrowth: growth percentage
        - searchVolume: monthly search volume
        - domainAge: age in years
        - registrationYear: year registered
      - `created_at` (timestamptz) - When the analysis was created
      - `updated_at` (timestamptz) - When the analysis was last updated

  2. Indexes
    - Index on account_id for fast lookups by user
    - Unique index on account_id + domain_name to prevent duplicate analyses per user

  3. Security
    - Enable RLS on `analyzed_domains` table
    - Add policy for authenticated users to read their own analyzed domains
    - Add policy for authenticated users to insert their own analyzed domains
    - Add policy for authenticated users to update their own analyzed domains
*/

CREATE TABLE IF NOT EXISTS analyzed_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  domain_name text NOT NULL,
  price numeric NOT NULL,
  analysis_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_analyzed_domains_account_id ON analyzed_domains(account_id);

-- Create unique constraint to prevent duplicate analyses per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_analyzed_domains_account_domain ON analyzed_domains(account_id, domain_name);

-- Enable RLS
ALTER TABLE analyzed_domains ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own analyzed domains" ON analyzed_domains;
DROP POLICY IF EXISTS "Users can insert own analyzed domains" ON analyzed_domains;
DROP POLICY IF EXISTS "Users can update own analyzed domains" ON analyzed_domains;

-- Policy for users to read their own analyzed domains
CREATE POLICY "Users can read own analyzed domains"
  ON analyzed_domains
  FOR SELECT
  TO authenticated
  USING (auth.uid() = account_id);

-- Policy for users to insert their own analyzed domains
CREATE POLICY "Users can insert own analyzed domains"
  ON analyzed_domains
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = account_id);

-- Policy for users to update their own analyzed domains
CREATE POLICY "Users can update own analyzed domains"
  ON analyzed_domains
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = account_id)
  WITH CHECK (auth.uid() = account_id);
