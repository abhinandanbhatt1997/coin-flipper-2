/*
  # Fix Ambiguous Column Reference in auto_join_or_create_game Function

  This migration fixes the ambiguous column reference error in the auto_join_or_create_game function
  by properly qualifying all column names with their table aliases.

  ## Changes
  1. Drop and recreate the auto_join_or_create_game function with proper column qualification
  2. Fix all ambiguous references to game_id and user_id
  3. Ensure proper table aliases are used throughout
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS auto_join_or_create_game(uuid, numeric, int);

-- Recreate the function with proper column qualification
CREATE OR REPLACE FUNCTION auto_join_or_create_game(
  _user_id uuid, 
  _entry_fee numeric, 
  _max_players int
)
RETURNS uuid AS $$
DECLARE
  selected_game uuid;
  user_balance numeric;
  participant_exists boolean;
BEGIN
  -- Check user's wallet balance
  SELECT u.wallet_balance INTO user_balance
  FROM users u
  WHERE u.id = _user_id;

  IF user_balance IS NULL OR user_balance < _entry_fee THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Find an open waiting game with available spots
  SELECT g.id INTO selected_game
  FROM games g
  WHERE g.status = 'waiting'
    AND g.entry_fee = _entry_fee
    AND g.current_players < g.max_players
  ORDER BY g.created_at ASC
  LIMIT 1;

  -- Create a new game if none found
  IF selected_game IS NULL THEN
    INSERT INTO games (entry_fee, max_players, current_players, status)
    VALUES (_entry_fee, _max_players, 0, 'waiting')
    RETURNING id INTO selected_game;
  END IF;

  -- Check if user is already a participant
  SELECT EXISTS(
    SELECT 1 FROM game_participants gp
    WHERE gp.game_id = selected_game AND gp.user_id = _user_id
  ) INTO participant_exists;

  -- Only add participant if not already joined
  IF NOT participant_exists THEN
    -- Add the user as a participant
    INSERT INTO game_participants (game_id, user_id, amount_paid)
    VALUES (selected_game, _user_id, _entry_fee);

    -- Update player count
    UPDATE games g
    SET current_players = (
      SELECT COUNT(*) FROM game_participants gp WHERE gp.game_id = selected_game
    )
    WHERE g.id = selected_game;

    -- Check if game is now full and should be marked as ready
    UPDATE games g
    SET status = CASE 
      WHEN g.current_players >= g.max_players THEN 'ready'
      ELSE 'waiting'
    END
    WHERE g.id = selected_game;
  END IF;

  RETURN selected_game;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auto_join_or_create_game(uuid, numeric, int) TO authenticated;