/*
  # Ensure Credit Functions Exist

  This migration ensures the credit management functions exist with the correct signatures.
  It's safe to run multiple times (idempotent).

  ## Functions

  ### add_credits
  Adds credits to an account (for purchases)

  ### use_credits
  Deducts credits from an account (for usage)
  Returns boolean indicating success (false if insufficient credits)
*/

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
  -- Ensure credit balance record exists
  INSERT INTO credit_balances (account_id, balance)
  VALUES (p_account_id, 0)
  ON CONFLICT (account_id) DO NOTHING;

  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM credit_balances
  WHERE account_id = p_account_id;

  -- Check if balance is sufficient
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. You have % credits but need %.', v_current_balance, p_amount;
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
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
