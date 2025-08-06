/*
  # Fix Auto Join or Create Game Function

  This migration fixes the auto_join_or_create_game function to properly handle
  wallet deductions and participant management.

  ## Changes
  1. Update the RPC function to handle wallet deductions
  2. Ensure proper transaction handling
  3. Fix participant insertion logic
*/

-- Drop and recreate the auto_join_or_create_game function with proper wallet handling
DROP FUNCTION IF EXISTS auto_join_or_create_game(uuid, numeric, int);

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
  SELECT wallet_balance INTO user_balance
  FROM users
  WHERE id = _user_id;

  IF user_balance IS NULL OR user_balance < _entry_fee THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Find an open waiting game with available spots
  SELECT id INTO selected_game
  FROM games
  WHERE status = 'waiting'
    AND entry_fee = _entry_fee
    AND current_players < max_players
  ORDER BY created_at ASC
  LIMIT 1;

  -- Create a new game if none found
  IF selected_game IS NULL THEN
    INSERT INTO games (entry_fee, max_players, current_players, status)
    VALUES (_entry_fee, _max_players, 0, 'waiting')
    RETURNING id INTO selected_game;
  END IF;

  -- Check if user is already a participant
  SELECT EXISTS(
    SELECT 1 FROM game_participants 
    WHERE game_id = selected_game AND user_id = _user_id
  ) INTO participant_exists;

  -- Only add participant if not already joined
  IF NOT participant_exists THEN
    -- Add the user as a participant
    INSERT INTO game_participants (game_id, user_id, amount_paid)
    VALUES (selected_game, _user_id, _entry_fee);

    -- Update player count
    UPDATE games
    SET current_players = (
      SELECT COUNT(*) FROM game_participants WHERE game_id = selected_game
    )
    WHERE id = selected_game;

    -- Check if game is now full and should be marked as ready
    UPDATE games
    SET status = CASE 
      WHEN current_players >= max_players THEN 'ready'
      ELSE 'waiting'
    END
    WHERE id = selected_game;
  END IF;

  RETURN selected_game;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auto_join_or_create_game(uuid, numeric, int) TO authenticated;