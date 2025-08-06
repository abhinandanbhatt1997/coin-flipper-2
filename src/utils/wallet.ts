// src/utils/wallet.ts
import { supabase } from '../lib/supabase';

export async function placeBetAndLog(userId: string, gameId: string, amount: number): Promise<boolean> {
  try {
    // Adjust wallet balance (deduct)
    const { error: rpcError } = await supabase.rpc('adjust_wallet_balance', {
      amount: -amount,
      user_id: userId,
    });
    if (rpcError) {
      console.error('Wallet deduction failed:', rpcError);
      return false;
    }

    // Log transaction
    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: userId,
      game_id: gameId,
      amount,
      type: 'bet',
    });
    if (insertError) {
      console.error('Transaction insert failed:', insertError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Bet placement failed:', err);
    return false;
  }
}

export async function applyPayoutAndLog(userId: string, gameId: string, payout: number, isWinner: boolean): Promise<boolean> {
  try {
    // Adjust wallet balance (add payout)
    const { error: rpcError } = await supabase.rpc('adjust_wallet_balance', {
      amount: payout,
      user_id: userId,
    });
    if (rpcError) {
      console.error('Payout RPC failed:', rpcError);
      return false;
    }

    // Log payout transaction (use 'payout' for both win/loss)
    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: userId,
      game_id: gameId,
      amount: payout,
      type: 'payout',
    });
    if (insertError) {
      console.error('Payout transaction failed:', insertError);
      return false;
    }

    // Add a 2-second delay to simulate transaction confirmation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return true;
  } catch (err) {
    console.error('applyPayoutAndLog failed:', err);
    return false;
  }
}
