\echo '=== Checking Balances Consistency ==='

-- For each user: wallet_balance vs sum of transactions
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
