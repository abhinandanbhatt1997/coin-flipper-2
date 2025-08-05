import { supabase } from "../lib/supabase";
import { Database } from "../lib/supabaseTypes";

type User = Database["public"]["Tables"]["users"]["Row"];
type Game = Database["public"]["Tables"]["games"]["Row"];

export const completeGame = async (gameId: string, winnerId: string, participants: User[], entryFee: number) => {
  const { data, error } = await supabase.from("game_participants").insert(
    participants.map((user) => ({
      game_id: gameId,
      user_id: user.id,
      amount_paid: entryFee,
      amount_won: user.id === winnerId ? entryFee * 1.5 : entryFee * 0.8,
      is_winner: user.id === winnerId,
    }))
  );

  if (error) throw error;

  // Update wallet balances
  const updates = participants.map((user) => {
    const amount = user.id === winnerId ? entryFee * 1.5 : entryFee * 0.8;
    return supabase.from("users").update({ wallet_balance: user.wallet_balance + amount }).eq("id", user.id);
  });

  await Promise.all(updates);

  await supabase.from("games").update({ status: "completed", winner_id: winnerId }).eq("id", gameId);
};
