-- sync_wallets.sql
-- This updates all users' wallet balances based on their transactions.

UPDATE users u
SET wallet_balance = COALESCE(sub.calculated_balance, 0)
FROM (
  SELECT 
    user_id,
    SUM(
      CASE 
        WHEN t.type IN ('deposit', 'game_win') THEN t.amount
        WHEN t.type = 'game_entry' THEN -t.amount
        ELSE 0
      END
    ) AS calculated_balance
  FROM transactions t
  GROUP BY user_id
) sub
WHERE u.id = sub.user_id;

-- Verify after update
\echo '=== After Sync ==='
SELECT 
  u.id AS user_id,
  u.email,
  u.wallet_balance,
  COALESCE(SUM(
    CASE 
      WHEN t.type IN ('deposit', 'game_win') THEN t.amount
      WHEN t.type = 'game_entry' THEN -t.amount
      ELSE 0
    END
  ),0) AS calculated_balance,
  (u.wallet_balance = COALESCE(SUM(
    CASE 
      WHEN t.type IN ('deposit', 'game_win') THEN t.amount
      WHEN t.type = 'game_entry' THEN -t.amount
      ELSE 0
    END
  ),0)) AS is_consistent
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id, u.email, u.wallet_balance;
