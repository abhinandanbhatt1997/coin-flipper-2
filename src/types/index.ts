export interface User {
  id: string;
  phone?: string;
  email?: string;
  wallet_balance: number;
  created_at: string;
}

export interface Game {
  id: string;
  status: 'waiting' | 'completed';
  entry_fee: number;
  max_players: number;
  current_players: number;
  winner_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface GameParticipant {
  id: string;
  game_id: string;
  user_id: string;
  amount_paid: number;
  amount_won: number;
  is_winner: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'game_entry' | 'game_win' | 'game_loss';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference_id?: string;
  created_at: string;
}

export interface RazorpayPayment {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}