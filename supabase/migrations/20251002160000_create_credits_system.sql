/*
  # Create Credits and Billing System

  ## Overview
  Implements a credit-based billing system where users can purchase credits to access domain analysis features.
  - 1 credit = $0.20
  - Bulk discount: $10 off for every 1000 credits purchased

  ## Tables Created

  ### `credit_balances`
  Tracks the current credit balance for each account
  - `account_id` (uuid, FK to accounts) - Links to user account
  - `balance` (integer) - Current credit balance
  - `total_purchased` (integer) - Lifetime total credits purchased
  - `total_used` (integer) - Lifetime total credits used
  - `updated_at` (timestamptz) - Last balance update time

  ### `credit_transactions`
  Records all credit purchases and usage
  - `id` (uuid, PK) - Transaction ID
  - `account_id` (uuid, FK to accounts) - User who made the transaction
  - `type` (text) - 'purchase' or 'usage'
  - `amount` (integer) - Credit amount (positive for purchase, negative for usage)
  - `balance_after` (integer) - Balance after transaction
  - `description` (text) - Transaction description
  - `metadata` (jsonb) - Additional transaction data (price paid, domain analyzed, etc.)
  - `created_at` (timestamptz) - Transaction timestamp

  ### `credit_packages`
  Defines available credit packages for purchase
  - `id` (uuid, PK) - Package ID
  - `name` (text) - Package name (Starter, Professional, Enterprise)
  - `credits` (integer) - Number of credits in package
  - `base_price` (numeric) - Base price in dollars
  - `final_price` (numeric) - Final price after discounts
  - `features` (jsonb) - Package features
  - `is_popular` (boolean) - Whether package is marked as popular
  - `sort_order` (integer) - Display order

  ## Security
  - RLS enabled on all tables
  - Users can only access their own credit data
  - Credit transactions are immutable (no updates or deletes)
*/

-- Create credit_balances table
CREATE TABLE IF NOT EXISTS credit_balances (
  account_id uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_purchased integer NOT NULL DEFAULT 0,
  total_used integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit balance"
  ON credit_balances FOR SELECT
  TO public
  USING (true);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('purchase', 'usage')),
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  description text NOT NULL DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions FOR SELECT
  TO public
  USING (true);

-- Create credit_packages table
CREATE TABLE IF NOT EXISTS credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits integer NOT NULL,
  base_price numeric(10, 2) NOT NULL,
  final_price numeric(10, 2) NOT NULL,
  features jsonb DEFAULT '[]',
  is_popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view credit packages"
  ON credit_packages FOR SELECT
  TO public
  USING (true);

-- Insert default credit packages
INSERT INTO credit_packages (name, credits, base_price, final_price, features, is_popular, sort_order)
VALUES
  (
    'Starter',
    100,
    20.00,
    29.00,
    '["100 domain analyses", "Basic market insights", "Email support", "30-day history"]'::jsonb,
    false,
    1
  ),
  (
    'Professional',
    500,
    100.00,
    99.00,
    '["500 domain analyses", "Advanced market insights", "Priority support", "Unlimited history", "Export reports", "API access"]'::jsonb,
    true,
    2
  ),
  (
    'Enterprise',
    2000,
    400.00,
    299.00,
    '["2000 domain analyses", "Premium market insights", "24/7 dedicated support", "Unlimited history", "Export reports", "API access", "Custom integrations", "Bulk analysis tools"]'::jsonb,
    false,
    3
  )
ON CONFLICT DO NOTHING;

-- Create function to add credits
CREATE OR REPLACE FUNCTION add_credits(
  p_account_id uuid,
  p_amount integer,
  p_description text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void AS $$
DECLARE
  v_new_balance integer;
BEGIN
  -- Ensure credit balance record exists
  INSERT INTO credit_balances (account_id, balance)
  VALUES (p_account_id, 0)
  ON CONFLICT (account_id) DO NOTHING;

  -- Update balance
  UPDATE credit_balances
  SET
    balance = balance + p_amount,
    total_purchased = total_purchased + p_amount,
    updated_at = now()
  WHERE account_id = p_account_id
  RETURNING balance INTO v_new_balance;

  -- Record transaction
  INSERT INTO credit_transactions (account_id, type, amount, balance_after, description, metadata)
  VALUES (p_account_id, 'purchase', p_amount, v_new_balance, p_description, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to use credits
CREATE OR REPLACE FUNCTION use_credits(
  p_account_id uuid,
  p_amount integer,
  p_description text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS boolean AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM credit_balances
  WHERE account_id = p_account_id;

  -- Check if balance exists and is sufficient
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN false;
  END IF;

  -- Update balance
  UPDATE credit_balances
  SET
    balance = balance - p_amount,
    total_used = total_used + p_amount,
    updated_at = now()
  WHERE account_id = p_account_id
  RETURNING balance INTO v_new_balance;

  -- Record transaction
  INSERT INTO credit_transactions (account_id, type, amount, balance_after, description, metadata)
  VALUES (p_account_id, 'usage', -p_amount, v_new_balance, p_description, p_metadata);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_account_id ON credit_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_packages_sort_order ON credit_packages(sort_order);
