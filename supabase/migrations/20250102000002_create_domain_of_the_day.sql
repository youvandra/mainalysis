/*
  # Create Domain of the Day Table

  1. New Tables
    - `domain_of_the_day`
      - `id` (uuid, primary key) - Unique identifier for each entry
      - `domain_name` (text, not null) - The domain name
      - `description` (text) - Description of the domain
      - `valuation` (numeric) - Estimated domain valuation
      - `market_score` (numeric) - Market score out of 100
      - `seo_value` (text) - SEO value rating
      - `growth_potential` (text) - Growth potential rating
      - `tags` (text array) - Tags for categorization
      - `featured_date` (date, not null) - Date when domain is featured
      - `created_at` (timestamptz) - When the record was created
      - `created_by` (uuid) - User who created the entry (references auth.users)

  2. Security
    - Enable RLS on `domain_of_the_day` table
    - Add policy for public read access (anyone can view domain of the day)
    - Add policy for authenticated users to insert domain of the day
    - Add policy for creators to update their own entries
    - Add policy for creators to delete their own entries

  3. Indexes
    - Index on `featured_date` for efficient date-based queries
    - Unique constraint on `featured_date` to ensure one domain per day
*/

CREATE TABLE IF NOT EXISTS domain_of_the_day (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text NOT NULL,
  description text DEFAULT '',
  valuation numeric DEFAULT 0,
  market_score numeric DEFAULT 0,
  seo_value text DEFAULT '',
  growth_potential text DEFAULT '',
  tags text[] DEFAULT '{}',
  featured_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT unique_featured_date UNIQUE (featured_date)
);

-- Create index for efficient date queries
CREATE INDEX IF NOT EXISTS idx_domain_of_the_day_featured_date
  ON domain_of_the_day(featured_date DESC);

-- Enable RLS
ALTER TABLE domain_of_the_day ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view domain of the day
CREATE POLICY "Anyone can view domain of the day"
  ON domain_of_the_day
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert domain of the day
CREATE POLICY "Authenticated users can insert domain of the day"
  ON domain_of_the_day
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own entries
CREATE POLICY "Users can update own domain entries"
  ON domain_of_the_day
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Policy: Users can delete their own entries
CREATE POLICY "Users can delete own domain entries"
  ON domain_of_the_day
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);
