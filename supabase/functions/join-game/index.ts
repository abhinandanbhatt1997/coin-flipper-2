// supabase/functions/join-game/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // service role needed for writes
  );

  const { user_id, game_id } = await req.json();

  // Fetch user & game
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("wallet_balance")
    .eq("id", user_id)
    .single();

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("*")
    .eq("id", game_id)
    .single();

  if (userErr || gameErr) {
    return new Response(JSON.stringify({ error: "User or game not found" }), {
      status: 400,
    });
  }

  if (user.wallet_balance < game.entry_fee) {
    return new Response(JSON.stringify({ error: "Insufficient balance" }), {
      status: 400,
    });
  }

  // Deduct balance and add participant atomically
  const { error: txnErr } = await supabase.rpc("join_game", {
    p_user_id: user_id,
    p_game_id: game_id,
    p_entry_fee: game.entry_fee,
  });

  if (txnErr) {
    return new Response(JSON.stringify({ error: txnErr.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
