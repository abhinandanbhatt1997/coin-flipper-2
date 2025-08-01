// supabase/functions/coin-flip-game/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Environment variables for Supabase (auto-provided in Edge Functions)
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  try {
    const { gameId } = await req.json();

    if (!gameId) {
      return new Response(JSON.stringify({ error: "Missing gameId" }), { status: 400 });
    }

    // Fetch participants for the game
    const { data: participants, error: participantsError } = await supabase
      .from("game_participants")
      .select("id, user_id, amount_paid")
      .eq("game_id", gameId);

    if (participantsError || !participants || participants.length < 2) {
      return new Response(
        JSON.stringify({ error: "Not enough players or failed to fetch participants" }),
        { status: 400 }
      );
    }

    // Randomly select a winner
    const winnerIndex = Math.floor(Math.random() * participants.length);
    const winner = participants[winnerIndex];
    const losers = participants.filter((_, idx) => idx !== winnerIndex);

    const entryFee = participants[0].amount_paid;

    // Calculate payouts
    const winnerPayout = entryFee * 1.5;
    const loserPayout = entryFee * 0.8;

    // Update balances and mark winner
    for (const p of participants) {
      const isWinner = p.user_id === winner.user_id;
      const payout = isWinner ? winnerPayout : loserPayout;

      await supabase.rpc("adjust_wallet_balance", {
        user_id: p.user_id,
        amount: payout - entryFee, // credit (minus entry fee)
      });

      // Update participant record
      await supabase
        .from("game_participants")
        .update({
          is_winner: isWinner,
          amount_won: payout,
        })
        .eq("id", p.id);

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: p.user_id,
        type: isWinner ? "game_win" : "game_loss",
        amount: payout,
        status: "completed",
        reference_id: gameId,
      });
    }

    // Update game status and winner_id
    await supabase
      .from("games")
      .update({
        status: "completed",
        winner_id: winner.user_id,
        completed_at: new Date().toISOString(),
      })
      .eq("id", gameId);

    return new Response(
      JSON.stringify({
        message: "Game completed",
        winner: winner.user_id,
        payouts: {
          winner: winnerPayout,
          losers: loserPayout,
        },
      }),
      { status: 200 }
    );
  } catch (e) {
    console.error("Error running coin flip game:", e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
});
