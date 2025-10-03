/*
  # Add Credits Column to Accounts

  ## Changes
  - Add `credits` column to accounts table
  - Default value is 0
  - Cannot be negative (CHECK constraint)

  ## Purpose
  Enables credit tracking directly in accounts table for user balance management
*/

-- Add credits column to accounts table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'accounts'
    AND column_name = 'credits'
  ) THEN
    ALTER TABLE accounts ADD COLUMN credits integer NOT NULL DEFAULT 0 CHECK (credits >= 0);
  END IF;
END $$;
