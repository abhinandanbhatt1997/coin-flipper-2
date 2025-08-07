-- Drop the old function if it exists
drop function if exists auto_join_or_create_game(text, integer, integer, uuid);

-- Recreate the function with clear and unambiguous references
create function auto_join_or_create_game(
  category text,
  entry_fee integer,
  max_players integer,
  user_id uuid
)
returns uuid
language plpgsql
as $$
declare
  existing_game_id uuid;
begin
  -- Try to find an existing waiting game the user is not part of
  select g.id into existing_game_id
  from games g
  where g.category = category
    and g.entry_fee = entry_fee
    and g.max_players = max_players
    and g.status = 'waiting'
    and g.id not in (
      select gp.game_id
      from game_participants gp
      where gp.user_id = user_id
    )
  limit 1;

  -- If a suitable game was found, return its ID
  if existing_game_id is not null then
    return existing_game_id;
  end if;

  -- Otherwise, create a new game and return its ID
  insert into games (category, entry_fee, max_players, status)
  values (category, entry_fee, max_players, 'waiting')
  returning id into existing_game_id;

  return existing_game_id;
end;
$$;
