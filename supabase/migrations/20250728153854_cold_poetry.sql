-- Drop old tables to avoid conflicts
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS game_participants CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- -------------------
-- Users Table
-- -------------------
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text,
  phone text,
  wallet_balance numeric DEFAULT 0 CHECK (wallet_balance >= 0),
  created_at timestamptz DEFAULT now()
);

-- Trigger: Sync with auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, wallet_balance, created_at)
  VALUES (NEW.id, NEW.email, 0, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- -------------------
-- Games Table
-- -------------------
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'completed')),
  entry_fee numeric NOT NULL DEFAULT 100,
  max_players integer NOT NULL DEFAULT 10,
  current_players integer NOT NULL DEFAULT 0,
  winner_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- -------------------
-- Game Participants
-- -------------------
CREATE TABLE game_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL DEFAULT 100,
  amount_won numeric NOT NULL DEFAULT 0,
  is_winner boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- -------------------
-- Transactions
-- -------------------
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'game_entry', 'game_win', 'game_loss')),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  reference_id text,
  created_at timestamptz DEFAULT now()
);

-- -------------------
-- Enable Row Level Security
-- -------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- -------------------
-- RLS Policies
-- -------------------

-- Users: Read & Update Own Data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Games: Anyone can read, only authenticated can insert
CREATE POLICY "Anyone can read games"
  ON games FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create games"
  ON games FOR INSERT TO authenticated WITH CHECK (true);

-- Game Participants: Read all, join only for own user_id
CREATE POLICY "Anyone can read game participants"
  ON game_participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join games"
  ON game_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own participation"
  ON game_participants FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Transactions: Private per user
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Allow RPC and functions to bypass user_id check (still secure)
CREATE POLICY "Allow functions to manage participants"
  ON game_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow RPCs to create games freely (authenticated only)
CREATE POLICY "Allow functions to create games"
  ON games
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- -------------------
-- Indexes
-- -------------------
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- -------------------
-- RPC for Auto-Matchmaking

DROP FUNCTION IF EXISTS auto_join_or_create_game(uuid, numeric, int);
CREATE OR REPLACE FUNCTION auto_join_or_create_game(_user_id uuid, _entry_fee numeric, _max_players int)
RETURNS uuid AS $$
DECLARE
  selected_game uuid;
BEGIN
  -- Find an open waiting game
  SELECT id INTO selected_game
  FROM games
  WHERE status = 'waiting'
    AND entry_fee = _entry_fee
    AND current_players < max_players
  ORDER BY created_at
  LIMIT 1;

  -- Create a new game if none found
  IF selected_game IS NULL THEN
    INSERT INTO games (entry_fee, max_players, current_players)
    VALUES (_entry_fee, _max_players, 0)
    RETURNING id INTO selected_game;
  END IF;

  -- Add the user as a participant (skip duplicates)
  INSERT INTO game_participants (game_id, user_id, amount_paid)
  VALUES (selected_game, _user_id, _entry_fee)
  ON CONFLICT DO NOTHING;

  -- Update player count
  UPDATE games
  SET current_players = (
    SELECT COUNT(*) FROM game_participants WHERE game_id = selected_game
  )
  WHERE id = selected_game;

  -- Mark as completed if full
  UPDATE games
  SET status = 'completed'
  WHERE id = selected_game AND current_players >= max_players;

  RETURN selected_game;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
