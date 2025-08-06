import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  Coins, 
  Play, 
  RotateCcw, 
  Home,
  Crown,
  Star,
  Zap,
  Shield,
  Target,
  Timer,
  Sparkles,
  Gift,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';

interface GameData {
  id: string;
  status: string;
  entry_fee: number;
  max_players: number;
  current_players: number;
  winner_id?: string;
  completed_at?: string;
  participants: Array<{
    user_id: string;
    amount_paid: number;
    amount_won: number;
    is_winner: boolean;
    users: {
      email: string;
    };
  }>;
}

const GameRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gamePhase, setGamePhase] = useState<'waiting' | 'starting' | 'playing' | 'finished'>('waiting');
  const [countdown, setCountdown] = useState(5);
  const [showConfetti, setShowConfetti] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (!user || !id) {
      navigate('/user');
      return;
    }

    fetchGameData();
    fetchWalletBalance();

    // Set up real-time subscription
    const channel = supabase
      .channel(`game-room-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${id}` },
        (payload) => {
          console.log('Game updated:', payload.new);
          fetchGameData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, navigate]);

  // Game flow management
  useEffect(() => {
    if (gameData) {
      if (gameData.status === 'completed') {
        setGamePhase('finished');
        const userParticipant = gameData.participants.find(p => p.user_id === user?.id);
        if (userParticipant?.is_winner) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      } else if (gameData.current_players >= gameData.max_players) {
        setGamePhase('starting');
        startCountdown();
      }
    }
  }, [gameData]);

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGamePhase('playing');
          setTimeout(() => {
            processGame();
          }, 3000); // 3 seconds of coin flip animation
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fetchGameData = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
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
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setGameData({
        ...data,
        participants: data.game_participants || []
      });

    } catch (error) {
      console.error('Error fetching game data:', error);
      toast.error('Failed to load game data');
      navigate('/user');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setWalletBalance(data.wallet_balance);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const processGame = async () => {
    if (!gameData || gameData.status === 'completed') return;

    try {
      // Randomly select winner (10% chance for each player)
      const participants = gameData.participants;
      const winnerIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[winnerIndex];

      // Calculate payouts
      const winnerPayout = gameData.entry_fee * 1.5;
      const loserPayout = gameData.entry_fee * 0.8;

      // Update participants with results
      for (const participant of participants) {
        const isWinner = participant.user_id === winner.user_id;
        const payout = isWinner ? winnerPayout : loserPayout;

        // Update participant record
        await supabase
          .from('game_participants')
          .update({
            is_winner: isWinner,
            amount_won: payout
          })
          .eq('user_id', participant.user_id)
          .eq('game_id', gameData.id);

        // Update user wallet
        const { data: userData } = await supabase
          .from('users')
          .select('wallet_balance')
          .eq('id', participant.user_id)
          .single();

        if (userData) {
          await supabase
            .from('users')
            .update({ wallet_balance: userData.wallet_balance + payout })
            .eq('id', participant.user_id);
        }

        // Log transaction
        await supabase.from('transactions').insert({
          user_id: participant.user_id,
          type: isWinner ? 'game_win' : 'game_loss',
          amount: payout,
          status: 'completed',
          reference_id: gameData.id
        });
      }

      // Update game status
      await supabase
        .from('games')
        .update({
          status: 'completed',
          winner_id: winner.user_id,
          completed_at: new Date().toISOString()
        })
        .eq('id', gameData.id);

      // Refresh data
      fetchGameData();
      fetchWalletBalance();

    } catch (error) {
      console.error('Error processing game:', error);
      toast.error('Failed to process game');
    }
  };

  const getCategoryIcon = (entryFee: number) => {
    switch (entryFee) {
      case 100: return <Shield className="w-8 h-8" />;
      case 250: return <Crown className="w-8 h-8" />;
      case 500: return <Star className="w-8 h-8" />;
      case 1000: return <Zap className="w-8 h-8" />;
      case 2000: return <Trophy className="w-8 h-8" />;
      case 5000: return <Target className="w-8 h-8" />;
      default: return <Play className="w-8 h-8" />;
    }
  };

  const getCategoryGradient = (entryFee: number) => {
    switch (entryFee) {
      case 100: return 'from-gray-400 via-gray-500 to-gray-600';
      case 250: return 'from-yellow-400 via-orange-500 to-red-600';
      case 500: return 'from-blue-400 via-purple-500 to-pink-600';
      case 1000: return 'from-green-400 via-emerald-500 to-teal-600';
      case 2000: return 'from-indigo-400 via-purple-500 to-pink-600';
      case 5000: return 'from-red-400 via-pink-500 to-purple-600';
      default: return 'from-purple-400 via-blue-500 to-indigo-600';
    }
  };

  const getCategoryName = (entryFee: number) => {
    switch (entryFee) {
      case 100: return 'Iron';
      case 250: return 'Gold';
      case 500: return 'Diamond';
      case 1000: return 'Uranium';
      case 2000: return 'Platinum';
      case 5000: return 'Ruby';
      default: return 'Custom';
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

  if (!gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Game Not Found</h2>
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

  const userParticipant = gameData.participants.find(p => p.user_id === user?.id);
  const winner = gameData.participants.find(p => p.is_winner);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {showConfetti && <Confetti />}
      
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/user')}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {getCategoryName(gameData.entry_fee)} Game Room
              </h1>
              <p className="text-white/60 text-sm">
                {gamePhase === 'waiting' && 'Waiting for players'}
                {gamePhase === 'starting' && 'Game starting soon'}
                {gamePhase === 'playing' && 'Game in progress'}
                {gamePhase === 'finished' && 'Game completed'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-500/20 rounded-full px-4 py-2 border border-green-500/30">
              <Coins className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">₹{walletBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Waiting Phase */}
        {gamePhase === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className={`bg-gradient-to-br ${getCategoryGradient(gameData.entry_fee)} rounded-3xl p-12 border border-white/20 shadow-2xl relative overflow-hidden mx-auto max-w-2xl`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
              <div className="relative z-10">
                <div className="text-white drop-shadow-lg mb-6">
                  {getCategoryIcon(gameData.entry_fee)}
                </div>
                <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                  Waiting for Players
                </h2>
                <p className="text-white/90 text-lg mb-8">
                  {gameData.current_players}/{gameData.max_players} players joined
                </p>
                
                <div className="w-full bg-white/20 rounded-full h-4 mb-8">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(gameData.current_players / gameData.max_players) * 100}%` }}
                    className="h-full bg-gradient-to-r from-white/60 to-white/80 rounded-full"
                  />
                </div>

                <div className="text-white/90">
                  Game will start automatically when all players join
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Starting Phase */}
        {gamePhase === 'starting' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 max-w-2xl mx-auto">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-8xl mb-6"
              >
                🎲
              </motion.div>
              <h2 className="text-4xl font-bold text-white mb-4">Game Starting!</h2>
              <div className="text-6xl font-bold text-yellow-400 mb-4">{countdown}</div>
              <p className="text-white/80 text-lg">Get ready for the ultimate coin flip!</p>
            </div>
          </motion.div>
        )}

        {/* Playing Phase */}
        {gamePhase === 'playing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-8 animate-pulse">
                Flipping the Coin...
              </h2>
              <motion.div
                animate={{ rotateY: 360 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-6xl shadow-2xl mx-auto mb-8"
              >
                🪙
              </motion.div>
              <p className="text-white/80 text-lg">Determining the winner...</p>
            </div>
          </motion.div>
        )}

        {/* Finished Phase */}
        {gamePhase === 'finished' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Result Card */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`bg-gradient-to-br ${
                  userParticipant?.is_winner 
                    ? 'from-green-400 via-emerald-500 to-teal-600' 
                    : 'from-orange-400 via-red-500 to-pink-600'
                } rounded-3xl p-12 border border-white/20 shadow-2xl relative overflow-hidden max-w-2xl mx-auto`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
                <div className="relative z-10">
                  <div className="text-8xl mb-6">
                    {userParticipant?.is_winner ? '🎉' : '💔'}
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                    {userParticipant?.is_winner ? 'Congratulations!' : 'Better Luck Next Time!'}
                  </h2>
                  <p className="text-white/90 text-xl mb-6">
                    {userParticipant?.is_winner 
                      ? `You won ₹${userParticipant.amount_won.toLocaleString()}!`
                      : `You received ₹${userParticipant?.amount_won.toLocaleString()} refund`
                    }
                  </p>
                  
                  {userParticipant?.is_winner && (
                    <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-2 text-white font-bold">
                        <Sparkles className="w-5 h-5" />
                        Amazing! You beat the 10% odds!
                        <Sparkles className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* All Players Results */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Final Results</h3>
                  <p className="text-white/60 text-sm">All players and their outcomes</p>
                </div>
              </div>

              <div className="space-y-3">
                {gameData.participants
                  .sort((a, b) => (b.is_winner ? 1 : 0) - (a.is_winner ? 1 : 0))
                  .map((participant, index) => (
                    <motion.div
                      key={participant.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        participant.is_winner
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          participant.is_winner ? 'bg-green-500/20' : 'bg-white/10'
                        }`}>
                          {participant.is_winner ? (
                            <Crown className="w-6 h-6 text-yellow-400" />
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
                            {participant.is_winner ? 'Winner! 🏆' : 'Participant'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-lg flex items-center gap-1 ${
                          participant.is_winner ? 'text-green-400' : 'text-orange-400'
                        }`}>
                          {participant.is_winner ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          ₹{participant.amount_won.toLocaleString()}
                        </div>
                        <div className="text-white/60 text-sm">
                          {participant.is_winner ? '1.5x return' : '0.8x refund'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/user?tab=games')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-8 rounded-2xl text-lg hover:from-blue-600 hover:to-purple-700 flex items-center justify-center gap-3 shadow-lg"
              >
                <Play className="w-5 h-5" />
                Play Again
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/user?tab=history')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-8 rounded-2xl text-lg hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-3 shadow-lg"
              >
                <Trophy className="w-5 h-5" />
                View History
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/user')}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-4 px-8 rounded-2xl text-lg hover:from-gray-600 hover:to-gray-700 flex items-center justify-center gap-3 shadow-lg"
              >
                <Home className="w-5 h-5" />
                Dashboard
              </motion.button>
            </div>
          </motion.div>
        )}
    </div>
  </div>
  );
};

export default GameRoom;