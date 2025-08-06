import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { 
  Users, 
  Clock, 
  Coins, 
  Trophy, 
  ArrowLeft, 
  Play, 
  Loader, 
  Crown,
  Star,
  Zap,
  Shield,
  Target,
  Timer,
  UserPlus,
  Gamepad2
} from "lucide-react";
import toast from "react-hot-toast";

interface GameData {
  id: string;
  status: string;
  entry_fee: number;
  max_players: number;
  current_players: number;
  created_at: string;
  participants: Array<{
    user_id: string;
    users: {
      email: string;
    };
  }>;
}

const GameLobby: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
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
      .channel(`game-lobby-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${id}` },
        (payload) => {
          console.log('Game updated:', payload.new);
          if (payload.new.current_players >= payload.new.max_players) {
            navigate(`/game/${id}`);
          } else {
            fetchGameData();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_participants', filter: `game_id=eq.${id}` },
        () => {
          fetchGameData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, navigate]);

  // Countdown timer
  useEffect(() => {
    if (gameData && gameData.status === 'waiting' && gameData.current_players > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Auto-start game when timer reaches 0
            if (gameData.current_players >= 2) {
              navigate(`/game/${id}`);
            }
            return 30; // Reset timer
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameData, id, navigate]);

  const fetchGameData = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          game_participants (
            user_id,
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

      // Check if current user has joined
      const userJoined = data.game_participants?.some((p: any) => p.user_id === user?.id);
      setJoined(userJoined);

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

  const handleJoinGame = async () => {
    if (!user || !gameData || joining || joined) return;

    if (walletBalance < gameData.entry_fee) {
      toast.error('Insufficient wallet balance!');
      return;
    }

    if (gameData.current_players >= gameData.max_players) {
      toast.error('Game is full!');
      return;
    }

    setJoining(true);

    try {
      // Deduct entry fee from wallet
      const { error: walletError } = await supabase
        .from('users')
        .update({ wallet_balance: walletBalance - gameData.entry_fee })
        .eq('id', user.id);

      if (walletError) throw walletError;

      // Add participant
      const { error: participantError } = await supabase
        .from('game_participants')
        .insert({
          game_id: gameData.id,
          user_id: user.id,
          amount_paid: gameData.entry_fee
        });

      if (participantError) throw participantError;

      // Update game player count
      const { error: gameError } = await supabase
        .from('games')
        .update({ current_players: gameData.current_players + 1 })
        .eq('id', gameData.id);

      if (gameError) throw gameError;

      // Log transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'game_entry',
        amount: -gameData.entry_fee,
        status: 'completed',
        reference_id: gameData.id
      });

      setWalletBalance(prev => prev - gameData.entry_fee);
      setJoined(true);
      toast.success('Successfully joined the game!');

      // Auto-redirect if game is full
      if (gameData.current_players + 1 >= gameData.max_players) {
        setTimeout(() => navigate(`/game/${id}`), 1000);
      }

    } catch (error) {
      console.error('Error joining game:', error);
      toast.error('Failed to join game');
    } finally {
      setJoining(false);
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
      default: return <Gamepad2 className="w-8 h-8" />;
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

  const progress = (gameData.current_players / gameData.max_players) * 100;
  const spotsLeft = gameData.max_players - gameData.current_players;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
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
              <h1 className="text-2xl font-bold text-white">Game Lobby</h1>
              <p className="text-white/60 text-sm">Waiting for players to join</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Info Card */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-br ${getCategoryGradient(gameData.entry_fee)} rounded-3xl p-8 border border-white/20 shadow-2xl relative overflow-hidden`}
            >
              {/* Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-white drop-shadow-lg">
                      {getCategoryIcon(gameData.entry_fee)}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                        {getCategoryName(gameData.entry_fee)} Game
                      </h2>
                      <p className="text-white/90 font-medium">
                        Entry Fee: ₹{gameData.entry_fee.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-4xl font-bold text-white drop-shadow-lg">
                      {gameData.current_players}/{gameData.max_players}
                    </div>
                    <div className="text-white/90 font-medium">Players</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/90 font-medium">Game Progress</span>
                    <span className="text-white/90 font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-white/60 to-white/80 rounded-full"
                    />
                  </div>
                </div>

                {/* Game Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <span className="text-white/90 font-medium">Win Prize</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      ₹{(gameData.entry_fee * 1.5).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-orange-400" />
                      <span className="text-white/90 font-medium">Loss Refund</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      ₹{(gameData.entry_fee * 0.8).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-green-400" />
                      <span className="text-white/90 font-medium">Win Chance</span>
                    </div>
                    <div className="text-xl font-bold text-white">10%</div>
                  </div>
                </div>

                {/* Timer */}
                {gameData.current_players > 0 && gameData.status === 'waiting' && (
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm mb-6">
                    <div className="flex items-center justify-center gap-3">
                      <Timer className="w-6 h-6 text-blue-400" />
                      <span className="text-white font-medium">Game starts in:</span>
                      <span className="text-2xl font-bold text-blue-400">{timeLeft}s</span>
                    </div>
                  </div>
                )}

                {/* Join Button */}
                {!joined && spotsLeft > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleJoinGame}
                    disabled={joining || walletBalance < gameData.entry_fee}
                    className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-4 px-6 rounded-xl text-lg border-2 border-white/30 hover:border-white/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {joining ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Joining Game...
                      </>
                    ) : walletBalance < gameData.entry_fee ? (
                      <>
                        <Coins className="w-5 h-5" />
                        Insufficient Balance
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Join Game (₹{gameData.entry_fee.toLocaleString()})
                      </>
                    )}
                  </motion.button>
                )}

                {joined && (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-300 font-bold text-lg">
                      <Play className="w-5 h-5" />
                      You're in the game! Waiting for other players...
                    </div>
                  </div>
                )}

                {spotsLeft === 0 && (
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-blue-300 font-bold text-lg">
                      <Play className="w-5 h-5" />
                      Game is full! Starting soon...
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Players List */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Players</h3>
                  <p className="text-white/60 text-sm">{gameData.current_players} joined</p>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {gameData.participants.map((participant, index) => (
                    <motion.div
                      key={participant.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          {participant.users.email?.split('@')[0] || `Player ${index + 1}`}
                          {participant.user_id === user?.id && (
                            <span className="ml-2 text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-white/60 text-sm">Ready to play</div>
                      </div>
                      <div className="text-green-400">
                        <Play className="w-4 h-4" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Empty Slots */}
                {Array.from({ length: spotsLeft }, (_, index) => (
                  <motion.div
                    key={`empty-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 border-dashed"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-white/40" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white/40 font-medium">Waiting for player...</div>
                      <div className="text-white/30 text-sm">Slot {gameData.current_players + index + 1}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Game Rules */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-bold text-white mb-4">Game Rules</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-white/80">Maximum {gameData.max_players} players per game</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-white/80">10% chance to win the game</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-white/80">Winner gets 1.5x entry fee</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-white/80">Losers get 0.8x refund</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-white/80">Game starts automatically when full</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;