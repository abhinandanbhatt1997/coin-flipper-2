import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { supabase } from '../lib/supabase';
import { 
  CreditCard, 
  Wallet, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trophy,
  Users,
  Coins
} from 'lucide-react';
import toast from 'react-hot-toast';

interface GameResult {
  id: string;
  entry_fee: number;
  winner_id: string;
  completed_at: string;
  participants: {
    user_id: string;
    amount_paid: number;
    amount_won: number;
    is_winner: boolean;
    users: {
      email: string;
    };
  }[];
}

const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { userData, refetch } = useUserData(user?.id);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  const gameId = searchParams.get('gameId');
  const isWinner = searchParams.get('winner') === 'true';
  const amount = parseFloat(searchParams.get('amount') || '0');

  useEffect(() => {
    if (!user || !gameId) {
      navigate('/user');
      return;
    }
    fetchGameResult();
  }, [user, gameId]);

  const fetchGameResult = async () => {
    if (!gameId) return;

    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          id,
          entry_fee,
          winner_id,
          completed_at,
          game_participants (
            user_id,
            amount_paid,
            amount_won,
            is_winner,
            users (
              email
            )
          )
        `)
        .eq('id', gameId)
        .single();

      if (error) throw error;
      setGameResult(data);
    } catch (error) {
      console.error('Error fetching game result:', error);
      toast.error('Failed to load game results');
      navigate('/user');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimWinnings = async () => {
    if (!user || !gameResult) return;

    setProcessingPayment(true);
    try {
      // Find user's participation
      const userParticipation = gameResult.participants.find(p => p.user_id === user.id);
      if (!userParticipation) {
        toast.error('Participation record not found');
        return;
      }

      // Get current balance
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Update wallet balance
      const newBalance = currentUser.wallet_balance + userParticipation.amount_won;
      const { error: updateError } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Create transaction record
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: userParticipation.is_winner ? 'game_win' : 'game_loss',
        amount: userParticipation.amount_won,
        status: 'completed',
        reference_id: gameId
      });

      toast.success(`₹${userParticipation.amount_won.toLocaleString()} added to your wallet!`);
      refetch();
      
      // Navigate back after a delay
      setTimeout(() => {
        navigate('/user');
      }, 2000);

    } catch (error: any) {
      console.error('Error claiming winnings:', error);
      toast.error('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  if (!gameResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Game Not Found</h2>
          <p className="mb-4">The requested game could not be found.</p>
          <button
            onClick={() => navigate('/user')}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const userParticipation = gameResult.participants.find(p => p.user_id === user?.id);
  const winner = gameResult.participants.find(p => p.is_winner);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/user')}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-3xl font-bold text-white">Game Results</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Game Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Game Summary</h2>
                <p className="text-white/60">Final results and payouts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Entry Fee</span>
                <span className="text-white font-semibold">₹{gameResult.entry_fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Total Players</span>
                <span className="text-white font-semibold">{gameResult.participants.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Winner</span>
                <span className="text-green-400 font-semibold">
                  {winner?.users.email?.split('@')[0] || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Completed At</span>
                <span className="text-white font-semibold">
                  {new Date(gameResult.completed_at).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Your Result */}
            {userParticipation && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className={`text-center p-4 rounded-lg ${
                  userParticipation.is_winner 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-blue-500/20 border border-blue-500/30'
                }`}>
                  {userParticipation.is_winner ? (
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  ) : (
                    <Clock className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                  )}
                  <h3 className="text-lg font-bold text-white mb-1">
                    {userParticipation.is_winner ? '🎉 You Won!' : 'Better Luck Next Time'}
                  </h3>
                  <p className="text-white/80 text-sm mb-3">
                    {userParticipation.is_winner 
                      ? 'Congratulations on your victory!' 
                      : 'You receive a partial refund'}
                  </p>
                  <div className="text-2xl font-bold text-white">
                    ₹{userParticipation.amount_won.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Payment Processing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Payment Details</h2>
                <p className="text-white/60">Claim your winnings</p>
              </div>
            </div>

            {userParticipation && (
              <div className="space-y-6">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/80">Amount Paid</span>
                    <span className="text-red-400">-₹{userParticipation.amount_paid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/80">Amount Won</span>
                    <span className="text-green-400">+₹{userParticipation.amount_won.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-white/20 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Net Result</span>
                      <span className={`font-bold ${
                        (userParticipation.amount_won - userParticipation.amount_paid) >= 0 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {(userParticipation.amount_won - userParticipation.amount_paid) >= 0 ? '+' : ''}
                        ₹{(userParticipation.amount_won - userParticipation.amount_paid).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Wallet className="w-5 h-5 text-green-400" />
                    <span className="text-white font-medium">Current Wallet Balance</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ₹{userData?.wallet_balance.toLocaleString() || '0'}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClaimWinnings}
                  disabled={processingPayment}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Claim ₹{userParticipation.amount_won.toLocaleString()}
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>

        {/* All Participants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">All Participants</h2>
              <p className="text-white/60">Final standings and payouts</p>
            </div>
          </div>

          <div className="space-y-3">
            {gameResult.participants
              .sort((a, b) => (b.is_winner ? 1 : 0) - (a.is_winner ? 1 : 0))
              .map((participant, index) => (
                <div
                  key={participant.user_id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    participant.is_winner
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      participant.is_winner ? 'bg-green-500/20' : 'bg-white/10'
                    }`}>
                      {participant.is_winner ? (
                        <Trophy className="w-5 h-5 text-green-400" />
                      ) : (
                        <span className="text-white font-semibold">{index}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {participant.users.email?.split('@')[0] || `Player ${index + 1}`}
                        {participant.user_id === user?.id && (
                          <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-white/60 text-sm">
                        {participant.is_winner ? 'Winner' : 'Participant'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      participant.is_winner ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      ₹{participant.amount_won.toLocaleString()}
                    </div>
                    <div className="text-white/60 text-sm">
                      {participant.is_winner ? '1.5x return' : '0.8x return'}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentsPage;