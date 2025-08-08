-- Secure Wallet System Migration
-- Creates coin-based wallet system and game results tracking

-- Create wallets table for coin-based system
CREATE TABLE IF NOT EXISTS wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_balance integer DEFAULT 0 CHECK (coin_balance >= 0),
  total_deposited numeric DEFAULT 0,
  total_withdrawn numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game_results table for secure game tracking
CREATE TABLE IF NOT EXISTS game_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type text NOT NULL DEFAULT 'coin_flip',
  user_choice text NOT NULL CHECK (user_choice IN ('heads', 'tails')),
  actual_result text NOT NULL CHECK (actual_result IN ('heads', 'tails')),
  is_winner boolean NOT NULL,
  coins_bet integer NOT NULL CHECK (coins_bet > 0),
  coins_won integer NOT NULL DEFAULT 0,
  multiplier numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

-- Create coin_transactions table for audit trail
CREATE TABLE IF NOT EXISTS coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'game_bet', 'game_win', 'purchase')),
  amount integer NOT NULL,
  balance_before integer NOT NULL,
  balance_after integer NOT NULL,
  reference_id text,
  game_result_id uuid REFERENCES game_results(id),
  razorpay_payment_id text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallets
CREATE POLICY "Users can read own wallet"
  ON wallets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for game_results
CREATE POLICY "Users can read own game results"
  ON game_results FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for coin_transactions
CREATE POLICY "Users can read own transactions"
  ON coin_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admin policies for all tables
CREATE POLICY "Admins can read all wallets"
  ON wallets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.admin_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can read all game results"
  ON game_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.admin_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can read all coin transactions"
  ON coin_transactions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.admin_role IN ('admin', 'super_admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_game_results_user_id ON game_results(user_id);
CREATE INDEX IF NOT EXISTS idx_game_results_created_at ON game_results(created_at);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(type);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at);

-- Function to initialize wallet for new users
CREATE OR REPLACE FUNCTION initialize_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, coin_balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet for new users
DROP TRIGGER IF EXISTS on_user_wallet_created ON auth.users;
CREATE TRIGGER on_user_wallet_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_wallet();

-- Function to log coin transactions
CREATE OR REPLACE FUNCTION log_coin_transaction(
  p_user_id uuid,
  p_type text,
  p_amount integer,
  p_balance_before integer,
  p_balance_after integer,
  p_reference_id text DEFAULT NULL,
  p_game_result_id uuid DEFAULT NULL,
  p_razorpay_payment_id text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  transaction_id uuid;
BEGIN
  INSERT INTO coin_transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_id, game_result_id, razorpay_payment_id
  )
  VALUES (
    p_user_id, p_type, p_amount, p_balance_before, p_balance_after,
    p_reference_id, p_game_result_id, p_razorpay_payment_id
  )
  RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_reference_id text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  current_balance integer;
  new_balance integer;
BEGIN
  -- Get current balance with row lock
  SELECT coin_balance INTO current_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if wallet exists
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance + p_amount;
  
  -- Check for negative balance
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient coin balance';
  END IF;
  
  -- Update wallet
  UPDATE wallets
  SET coin_balance = new_balance,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  PERFORM log_coin_transaction(
    p_user_id, p_type, p_amount, current_balance, new_balance, p_reference_id
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON TABLE wallets TO authenticated;
GRANT ALL ON TABLE game_results TO authenticated;
GRANT ALL ON TABLE coin_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION log_coin_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION update_wallet_balance TO authenticated;