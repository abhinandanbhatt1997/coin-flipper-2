// src/utils/logTransaction.ts
import { supabase } from '../lib/supabase';

export const logTransaction = async (
  userId: string,
  gameId: string,
  amount: number,
  type: 'bet' | 'payout',
  isWinner: boolean = false
) => {
  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    game_id: gameId,
    amount,
    type,
    is_winner: isWinner,
  });

  if (error) {
    console.error("❌ Failed to log transaction:", error.message);
  } else {
    console.log("✅ Transaction logged:", { type, amount, isWinner });
  }
};
