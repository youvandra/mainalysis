/*
  # Fresh Clean Database - One Address One Account

  ## Overview
  Complete fresh database schema where one wallet address equals one account.
  Unique constraint on wallet_address ensures no duplicates.

  ## Tables

  ### 1. `accounts`
  Primary table for wallet-based accounts
  - `id` (uuid, primary key) - Unique account identifier
  - `wallet_address` (text, unique, not null) - ONE wallet = ONE account (enforced by UNIQUE constraint)
  - `display_name` (text) - Optional display name
  - `email` (text) - Optional email  
  - `avatar_url` (text) - Optional avatar
  - `created_at` (timestamptz) - Account creation time
  - `last_login` (timestamptz) - Last login time

  ### 2. `domains`
  Domain ownership records
  - `id` (uuid, primary key)
  - `domain_name` (text, unique, not null)
  - `account_id` (uuid, foreign key) - References accounts(id)
  - `is_fractionalized` (boolean) - Tokenization status
  - `total_tokens` (numeric) - Total token supply
  - `token_price` (numeric) - Price per token in ETH
  - `description` (text)
  - `valuation` (numeric) - Domain value in USD
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `domain_tokens`
  Fractionalized domain token ownership
  - `id` (uuid, primary key)
  - `domain_id` (uuid, foreign key) - References domains(id)
  - `account_id` (uuid, foreign key) - References accounts(id)
  - `token_amount` (numeric, not null)
  - `created_at` (timestamptz)
  - Unique constraint on (domain_id, account_id)

  ### 4. `transactions`
  Transaction history
  - `id` (uuid, primary key)
  - `domain_id` (uuid, foreign key) - References domains(id)
  - `from_account_id` (uuid, foreign key) - Sender account
  - `to_account_id` (uuid, foreign key) - Receiver account
  - `transaction_type` (text, not null) - Type of transaction
  - `token_amount` (numeric)
  - `price` (numeric) - Price in ETH
  - `tx_hash` (text) - Blockchain transaction hash
  - `created_at` (timestamptz)

  ### 5. `domain_history`
  Domain search/analysis history
  - `id` (uuid, primary key)
  - `domain_name` (text, not null)
  - `account_id` (uuid, foreign key) - References accounts(id)
  - `price` (text)
  - `analyzed_at` (timestamptz)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Public can read marketplace data
  - Users can write their own data

  ## Key Feature
  **UNIQUE constraint on accounts.wallet_address ensures one wallet = one account ALWAYS**
*/

-- Create accounts table with UNIQUE constraint
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  display_name text DEFAULT '',
  email text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT now()
);

-- Create domains table
CREATE TABLE domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text UNIQUE NOT NULL,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  is_fractionalized boolean DEFAULT false,
  total_tokens numeric DEFAULT 0,
  token_price numeric DEFAULT 0,
  description text DEFAULT '',
  valuation numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create domain_tokens table
CREATE TABLE domain_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(domain_id, account_id)
);

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  from_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  to_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  transaction_type text NOT NULL,
  token_amount numeric DEFAULT 0,
  price numeric DEFAULT 0,
  tx_hash text,
  created_at timestamptz DEFAULT now()
);

-- Create domain_history table
CREATE TABLE domain_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text NOT NULL,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  price text DEFAULT '',
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts
CREATE POLICY "Public can view all accounts"
  ON accounts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create accounts"
  ON accounts FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update accounts"
  ON accounts FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for domains
CREATE POLICY "Public can view domains"
  ON domains FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create domains"
  ON domains FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update domains"
  ON domains FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete domains"
  ON domains FOR DELETE
  TO public
  USING (true);

-- RLS Policies for domain_tokens
CREATE POLICY "Public can view tokens"
  ON domain_tokens FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create token records"
  ON domain_tokens FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update tokens"
  ON domain_tokens FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete tokens"
  ON domain_tokens FOR DELETE
  TO public
  USING (true);

-- RLS Policies for transactions
CREATE POLICY "Public can view transactions"
  ON transactions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create transactions"
  ON transactions FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for domain_history
CREATE POLICY "Public can view domain history"
  ON domain_history FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create history records"
  ON domain_history FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_accounts_wallet ON accounts(wallet_address);
CREATE INDEX idx_domains_account ON domains(account_id);
CREATE INDEX idx_domains_fractionalized ON domains(is_fractionalized);
CREATE INDEX idx_domain_tokens_domain ON domain_tokens(domain_id);
CREATE INDEX idx_domain_tokens_account ON domain_tokens(account_id);
CREATE INDEX idx_transactions_domain ON transactions(domain_id);
CREATE INDEX idx_transactions_from ON transactions(from_account_id);
CREATE INDEX idx_transactions_to ON transactions(to_account_id);
CREATE INDEX idx_domain_history_account ON domain_history(account_id);

-- Create updated_at trigger function
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to domains table
CREATE TRIGGER update_domains_updated_at 
  BEFORE UPDATE ON domains 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
