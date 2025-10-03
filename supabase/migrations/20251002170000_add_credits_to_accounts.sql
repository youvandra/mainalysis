/*
  # Add Credits to Accounts Table

  ## Changes
  - Add `credits` column to accounts table to track user credit balance
  - Set default value to 0
  - Add constraint to ensure credits cannot be negative

  ## Notes
  - This simplifies credit tracking by storing it directly in the accounts table
  - Existing accounts will default to 0 credits
*/

-- Add credits column to accounts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'credits'
  ) THEN
    ALTER TABLE accounts ADD COLUMN credits integer NOT NULL DEFAULT 0 CHECK (credits >= 0);
  END IF;
END $$;
