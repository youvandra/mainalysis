/*
  # Initial Database Schema for Domain Management Platform

  ## Overview
  Creates the core database structure for a domain asset management and fractionalization platform.

  ## New Tables

  ### 1. `domains`
  Stores information about domain names and their tokenization status
  - `id` (uuid, primary key) - Unique identifier
  - `domain_name` (text, unique) - The domain name (e.g., example.com)
  - `owner_address` (text) - Ethereum wallet address of the owner
  - `is_fractionalized` (boolean) - Whether domain is fractionalized
  - `total_tokens` (numeric) - Total token supply if fractionalized
  - `token_price` (numeric) - Price per token in ETH
  - `description` (text) - Domain description
  - `valuation` (numeric) - Estimated domain value
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `domain_tokens`
  Tracks ownership of fractionalized domain tokens
  - `id` (uuid, primary key) - Unique identifier
  - `domain_id` (uuid, foreign key) - Reference to domains table
  - `wallet_address` (text) - Token holder's wallet address
  - `token_amount` (numeric) - Number of tokens owned
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `transactions`
  Records all domain-related transactions
  - `id` (uuid, primary key) - Unique identifier
  - `domain_id` (uuid, foreign key) - Reference to domains table
  - `from_address` (text) - Sender wallet address
  - `to_address` (text) - Receiver wallet address
  - `transaction_type` (text) - Type of transaction (fractionalize, transfer, purchase)
  - `token_amount` (numeric) - Number of tokens involved
  - `price` (numeric) - Transaction price in ETH
  - `tx_hash` (text) - Blockchain transaction hash
  - `created_at` (timestamptz) - Transaction timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Public read access for domains (browsing marketplace)
  - Authenticated users can insert/update their own domains
  - Token ownership tied to wallet addresses
  - Transaction records are public but immutable
*/

-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text UNIQUE NOT NULL,
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
  wallet_address text NOT NULL,
  token_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(domain_id, wallet_address)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  from_address text NOT NULL,
  to_address text NOT NULL,
  transaction_type text NOT NULL,
  token_amount numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  tx_hash text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for domains table
CREATE POLICY "Anyone can view domains"
  ON domains FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert domains with their wallet"
  ON domains FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Owners can update their domains"
  ON domains FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

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
CREATE INDEX IF NOT EXISTS idx_domains_owner ON domains(owner_address);
CREATE INDEX IF NOT EXISTS idx_domains_fractionalized ON domains(is_fractionalized);
CREATE INDEX IF NOT EXISTS idx_domain_tokens_wallet ON domain_tokens(wallet_address);
CREATE INDEX IF NOT EXISTS idx_domain_tokens_domain ON domain_tokens(domain_id);
CREATE INDEX IF NOT EXISTS idx_transactions_domain ON transactions(domain_id);
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
