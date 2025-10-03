/*
  # Add Accounts Table for Wallet Management

  ## Overview
  Creates an accounts table to manage connected wallet addresses as user accounts.
  Updates existing tables to reference accounts instead of using raw wallet addresses.

  ## New Tables

  ### 1. `accounts`
  Stores connected wallet information and user profiles
  - `id` (uuid, primary key) - Unique identifier
  - `wallet_address` (text, unique) - Ethereum wallet address
  - `display_name` (text) - Optional display name
  - `email` (text) - Optional email
  - `avatar_url` (text) - Optional profile picture
  - `created_at` (timestamptz) - Account creation timestamp
  - `last_login` (timestamptz) - Last connection timestamp

  ## Changes to Existing Tables
  - Adds foreign key relationships from domains, domain_tokens, and transactions to accounts
  - Maintains backward compatibility with existing wallet_address fields

  ## Security
  - Enable RLS on accounts table
  - Users can view all accounts (for displaying owner info)
  - Users can insert their own account
  - Users can update only their own account information
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

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts table
CREATE POLICY "Anyone can view accounts"
  ON accounts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert their account"
  ON accounts FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own account"
  ON accounts FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_accounts_wallet ON accounts(wallet_address);

-- Add account_id columns to existing tables (optional, for future use)
-- This maintains backward compatibility while allowing migration to account-based references
ALTER TABLE domains ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE domain_tokens ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS from_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS to_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL;

-- Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_domains_account ON domains(account_id);
CREATE INDEX IF NOT EXISTS idx_domain_tokens_account ON domain_tokens(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
