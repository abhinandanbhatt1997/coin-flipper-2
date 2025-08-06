/*
  # Fix Transactions Table Schema

  This migration fixes the transactions table to include the game_id column
  and ensures all necessary columns are present.

  ## Changes
  1. Add game_id column to transactions table
  2. Update RLS policies if needed
  3. Add proper indexes
*/

-- Add game_id column to transactions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'game_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN game_id uuid REFERENCES games(id);
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_game_id ON transactions(game_id);

-- Update the transactions table to ensure all columns are properly configured
ALTER TABLE transactions ALTER COLUMN type TYPE text;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('deposit', 'withdrawal', 'game_entry', 'game_win', 'game_loss', 'bet', 'payout'));

-- Ensure RLS policies allow game-related transactions
CREATE POLICY IF NOT EXISTS "Users can insert own game transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON TABLE transactions TO authenticated;
GRANT ALL ON TABLE transactions TO anon;