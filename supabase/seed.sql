-- Seed Script for Money Pool Game with Winners & Payouts

-- 0. Clear existing game data (keep users, since Auth manages them)
TRUNCATE transactions, game_participants, games RESTART IDENTITY CASCADE;

-- 1. Display existing users
\echo '=== Existing Users (created via Auth) ==='
SELECT id, email, wallet_balance FROM users;

-- 2. Create two new games
INSERT INTO games (status, entry_fee, max_players, current_players)
VALUES
  ('waiting', 100, 10, 0),
  ('waiting', 200, 10, 0)
RETURNING id;

-- 3. Add 5 participants to each game
WITH selected_users AS (
  SELECT id FROM users LIMIT 5
), selected_games AS (
  SELECT id FROM games
)
INSERT INTO game_participants (game_id, user_id, amount_paid)
SELECT g.id, u.id, g.entry_fee
FROM selected_games g, selected_users u;

-- Update player counts
UPDATE games
SET current_players = sub.count
FROM (
  SELECT game_id, COUNT(*) AS count FROM game_participants GROUP BY game_id
) sub
WHERE games.id = sub.game_id;

-- 4. Assign a random winner for each game
WITH winners AS (
  SELECT DISTINCT ON (gp.game_id) gp.game_id, gp.user_id
  FROM game_participants gp
  ORDER BY gp.game_id, random()
)
UPDATE game_participants gp
SET is_winner = true, amount_won = gp.amount_paid * 1.5
FROM winners w
WHERE gp.game_id = w.game_id AND gp.user_id = w.user_id;

-- 5. Update losers (0.8x return)
UPDATE game_participants
SET amount_won = amount_paid * 0.8
WHERE is_winner = false;

-- 6. Credit wallet balances and add transactions
-- Deposit seed funds (1000 for each user if not already)
INSERT INTO transactions (user_id, type, amount, status, reference_id)
SELECT id, 'deposit', 1000, 'completed', 'seed'
FROM users;

-- Record entry fees
INSERT INTO transactions (user_id, type, amount, status, reference_id)
SELECT user_id, 'game_entry', amount_paid, 'completed', 'seed'
FROM game_participants;

-- Record winnings/loss refunds
INSERT INTO transactions (user_id, type, amount, status, reference_id)
SELECT user_id, 'game_win', amount_won, 'completed', 'seed'
FROM game_participants;

-- Apply winnings to wallet balances
UPDATE users
SET wallet_balance = wallet_balance + sub.total
FROM (
  SELECT user_id, SUM(amount_won) AS total FROM game_participants GROUP BY user_id
) sub
WHERE users.id = sub.user_id;

-- 7. Mark games as completed
UPDATE games SET status = 'completed', completed_at = NOW();

-- 8. Show final state
\echo '=== Final Users with Wallets ==='
SELECT id, email, wallet_balance FROM users;

\echo '=== Games ==='
SELECT * FROM games;

\echo '=== Participants (with winners) ==='
SELECT * FROM game_participants;

\echo '=== Transactions ==='
SELECT * FROM transactions;
