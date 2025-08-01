/*
  # Money Pool Game Database Schema

  This migration creates the complete database schema for the money pooling game.

  ## New Tables
  
  1. **users** - User profiles with wallet balance
     - `id` (uuid, primary key) - Matches Supabase auth user ID
     - `email` (text) - User's email address
     - `phone` (text) - User's phone number  
     - `wallet_balance` (numeric) - Current wallet balance
     - `created_at` (timestamp) - Account creation time

  2. **games** - Game rounds
     - `id` (uuid, primary key) - Unique game identifier
     - `status` (text) - Game status: 'waiting' or 'completed'
     - `entry_fee` (numeric) - Entry fee amount (₹100)
     - `max_players` (integer) - Maximum players (10)
     - `current_players` (integer) - Current number of players
     - `winner_id` (uuid) - Winner's user ID
     - `created_at` (timestamp) - Game creation time
     - `completed_at` (timestamp) - Game completion time

  3. **game_participants** - Players in each game
     - `id` (uuid, primary key) - Unique participation ID
     - `game_id` (uuid) - Reference to games table
     - `user_id` (uuid) - Reference to users table
     - `amount_paid` (numeric) - Amount paid to join
     - `amount_won` (numeric) - Amount won from game
     - `is_winner` (boolean) - Whether this participant won
     - `created_at` (timestamp) - Participation time

  4. **transactions** - Financial transaction log
     - `id` (uuid, primary key) - Unique transaction ID
     - `user_id` (uuid) - Reference to users table
     - `type` (text) - Transaction type
     - `amount` (numeric) - Transaction amount
     - `status` (text) - Transaction status
     - `reference_id` (text) - External reference (Razorpay, etc.)
     - `created_at` (timestamp) - Transaction time

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Games and participants are publicly readable
  - Transactions are private to the user
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  wallet_balance numeric DEFAULT 0 CHECK (wallet_balance >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'completed')),
  entry_fee numeric NOT NULL DEFAULT 100,
  max_players integer NOT NULL DEFAULT 10,
  current_players integer NOT NULL DEFAULT 0,
  winner_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create game_participants table
CREATE TABLE IF NOT EXISTS game_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL DEFAULT 100,
  amount_won numeric NOT NULL DEFAULT 0,
  is_winner boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'game_entry', 'game_win', 'game_loss')),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  reference_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for games table (publicly readable)
CREATE POLICY "Anyone can read games"
  ON games
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for game_participants table
CREATE POLICY "Anyone can read game participants"
  ON game_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read own participation"
  ON game_participants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for transactions table
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);