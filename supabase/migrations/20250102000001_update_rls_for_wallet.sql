/*
  # Update RLS Policies for Wallet-Based Authentication

  1. Changes
    - Drop existing overly permissive RLS policies
    - Add new policies that allow users to only access their own data based on wallet address
    - The `user_session` column now stores the wallet address (Ethereum address)

  2. Security
    - Users can only read their own history (filtered by user_session = wallet address)
    - Users can only insert records with their own wallet address
    - No cross-user data access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous read access" ON domain_history;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON domain_history;

-- Policy: Allow users to read their own history based on wallet address
CREATE POLICY "Users can read own history"
  ON domain_history
  FOR SELECT
  TO anon
  USING (user_session = current_setting('request.headers')::json->>'wallet-address');

-- Policy: Allow users to insert their own history
CREATE POLICY "Users can insert own history"
  ON domain_history
  FOR INSERT
  TO anon
  WITH CHECK (user_session = current_setting('request.headers')::json->>'wallet-address');
