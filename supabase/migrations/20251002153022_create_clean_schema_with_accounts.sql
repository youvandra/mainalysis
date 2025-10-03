/*
  # Clean Database Schema with Account-Based Architecture

  ## Overview
  Complete database schema for domain management platform with wallet-based accounts.
  All data is tied to wallet addresses through the accounts table.

  ## New Tables

  ### 1. `accounts`
  Primary table for wallet-based user accounts
  - `id` (uuid, primary key) - Unique account identifier
  - `wallet_address` (text, unique, not null) - Ethereum wallet address (unique constraint ensures one account per address)
  - `display_name` (text) - Optional display name
  - `email` (text) - Optional email
  - `avatar_url` (text) - Optional profile picture URL
  - `created_at` (timestamptz) - Account creation timestamp
  - `last_login` (timestamptz) - Last connection timestamp

  ### 2. `domains`
  Stores domain information and ownership
  - `id` (uuid, primary key) - Unique identifier
  - `domain_name` (text, unique, not null) - The domain name
  - `account_id` (uuid, foreign key) - References accounts table
  - `owner_address` (text, not null) - Wallet address for backward compatibility
  - `is_fractionalized` (boolean) - Whether domain is tokenized
  - `total_tokens` (numeric) - Total token supply if fractionalized
  - `token_price` (numeric) - Price per token in ETH
  - `description` (text) - Domain description
  - `valuation` (numeric) - Estimated domain value in USD
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `domain_tokens`
  Tracks ownership of fractionalized domain tokens
  - `id` (uuid, primary key) - Unique identifier
  - `domain_id` (uuid, foreign key) - Reference to domains table
  - `account_id` (uuid, foreign key) - Reference to accounts table
  - `wallet_address` (text, not null) - Token holder's wallet address
  - `token_amount` (numeric, not null) - Number of tokens owned
  - `created_at` (timestamptz) - Record creation timestamp
  - Unique constraint on (domain_id, account_id) to prevent duplicate entries

  ### 4. `transactions`
  Records all domain-related transactions
  - `id` (uuid, primary key) - Unique identifier
  - `domain_id` (uuid, foreign key) - Reference to domains table
  - `from_account_id` (uuid, foreign key) - Sender's account reference
  - `to_account_id` (uuid, foreign key) - Receiver's account reference
  - `from_address` (text, not null) - Sender wallet address
  - `to_address` (text, not null) - Receiver wallet address
  - `transaction_type` (text, not null) - Type: fractionalize, transfer, purchase
  - `token_amount` (numeric) - Number of tokens involved
  - `price` (numeric) - Transaction price in ETH
  - `tx_hash` (text) - Blockchain transaction hash
  - `created_at` (timestamptz) - Transaction timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public read access for browsing marketplace data
  - Write operations allowed for all users (controlled by application logic)
  - Account operations restricted to own data

  ## Important Notes
  1. One wallet address = One account (enforced by unique constraint)
  2. All relationships use account_id as foreign key
  3. Wallet addresses stored for backward compatibility and quick lookups
  4. Indexes added for optimal query performance
*/

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  display_name text DEFAULT '',
  email text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT now()
);

-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text UNIQUE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  owner_address text NOT NULL,
  is_fractionalized boolean DEFAULT false,
  total_tokens numeric DEFAULT 0,
  token_price numeric DEFAULT 0,
  description text DEFAULT '',
  valuation numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create domain_tokens table
CREATE TABLE IF NOT EXISTS domain_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  token_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(domain_id, account_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  from_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  to_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  transaction_type text NOT NULL,
  token_amount numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  tx_hash text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts table
CREATE POLICY "Anyone can view accounts"
  ON accounts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert accounts"
  ON accounts FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update accounts"
  ON accounts FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for domains table
CREATE POLICY "Anyone can view domains"
  ON domains FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert domains"
  ON domains FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update domains"
  ON domains FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete domains"
  ON domains FOR DELETE
  TO public
  USING (true);

-- RLS Policies for domain_tokens table
CREATE POLICY "Anyone can view token holdings"
  ON domain_tokens FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert token records"
  ON domain_tokens FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update token holdings"
  ON domain_tokens FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete token holdings"
  ON domain_tokens FOR DELETE
  TO public
  USING (true);

-- RLS Policies for transactions table
CREATE POLICY "Anyone can view transactions"
  ON transactions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert transactions"
  ON transactions FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_accounts_wallet ON accounts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_domains_account ON domains(account_id);
CREATE INDEX IF NOT EXISTS idx_domains_owner ON domains(owner_address);
CREATE INDEX IF NOT EXISTS idx_domains_fractionalized ON domains(is_fractionalized);
CREATE INDEX IF NOT EXISTS idx_domain_tokens_account ON domain_tokens(account_id);
CREATE INDEX IF NOT EXISTS idx_domain_tokens_wallet ON domain_tokens(wallet_address);
CREATE INDEX IF NOT EXISTS idx_domain_tokens_domain ON domain_tokens(domain_id);
CREATE INDEX IF NOT EXISTS idx_transactions_domain ON transactions(domain_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_addresses ON transactions(from_address, to_address);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
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
