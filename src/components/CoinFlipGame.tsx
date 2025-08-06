import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { 
  ArrowLeft, 
  Users, 
  Coins, 
  Trophy, 
  Play, 
  Loader,
  Crown,
  Star,
  Zap,
  Shield,
  Target
} from "lucide-react";
import toast from "react-hot-toast";

interface GameState {
  id: string;
  status: string;
  entry_fee: number;
  max_players: number;
  current_players: number;
  winner_id: string | null;
  players: { user_id: string }[];
}

const CoinFlipGame: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const gameId = new URLSearchParams(location.search).get("id");

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchWalletBalance();

    if (gameId) {
      fetchGameState();
    }
  }, [user, gameId, navigate]);

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

  const fetchGameState = async () => {
    if (!gameId) return;

    try {
      const { data: game, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      const { data: participants } = await supabase
        .from("game_participants")
        .select("user_id")
        .eq("game_id", gameId);

      if (game) {
        setGameState({ ...game, players: participants || [] });
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

  const createNewGame = async (entryFee: number, maxPlayers: number = 10) => {
    if (!user) return;

    if (walletBalance < entryFee) {
      toast.error('Insufficient wallet balance!');
      return;
    }

    setLoading(true);

    try {
      // Create new game
      const { data: newGame, error: gameError } = await supabase
        .from('games')
        .insert({
          entry_fee: entryFee,
          max_players: maxPlayers,
          current_players: 0,
          status: 'waiting'
        })
        .select()
        .single();

      if (gameError) throw gameError;

      toast.success('Game created successfully!');
      navigate(`/lobby/${newGame.id}`);

    } catch (error) {
      console.error('Error creating game:', error);
      toast.error('Failed to create game');
    } finally {
      setLoading(false);
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

  const gameCategories = [
    { fee: 100, name: 'Iron', description: 'Perfect for beginners' },
    { fee: 250, name: 'Gold', description: 'Balanced risk and reward' },
    { fee: 500, name: 'Diamond', description: 'Premium gaming experience' },
    { fee: 1000, name: 'Uranium', description: 'High stakes, high rewards' },
    { fee: 2000, name: 'Platinum', description: 'Elite level gaming' },
    { fee: 5000, name: 'Ruby', description: 'Ultimate high roller experience' }
  ];

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
              <h1 className="text-2xl font-bold text-white">Create New Game</h1>
              <p className="text-white/60 text-sm">Choose your game category</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-green-500/20 rounded-full px-4 py-2 border border-green-500/30">
            <Coins className="w-5 h-5 text-green-400" />
            <span className="text-white font-semibold">₹{walletBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Start Your Game
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-lg"
          >
            Select a category and create a new game room
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {gameCategories.map((category, index) => {
            const canAfford = walletBalance >= category.fee;
            
            return (
              <motion.div
                key={category.fee}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={canAfford ? { scale: 1.05, y: -8 } : {}}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getCategoryGradient(category.fee)} p-8 cursor-pointer shadow-2xl border border-white/20 backdrop-blur-sm ${
                  !canAfford ? 'opacity-60' : ''
                }`}
                onClick={() => canAfford && createNewGame(category.fee)}
              >
                {/* Animated background effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-white drop-shadow-lg">
                      {getCategoryIcon(category.fee)}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white drop-shadow-lg">
                        ₹{category.fee.toLocaleString()}
                      </div>
                      <div className="text-sm text-white/90 font-medium">Entry Fee</div>
                    </div>
                  </div>
                  
                  {/* Title and Description */}
                  <div className="mb-6">
                    <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                      {category.name}
                    </h3>
                    <p className="text-white/90 text-base font-medium">
                      {category.description}
                    </p>
                  </div>
                  
                  {/* Game Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-white/90 font-medium">
                        <Users className="w-4 h-4" />
                        <span>Max 10 players</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/90 font-medium">
                        <Trophy className="w-4 h-4" />
                        <span>10% win chance</span>
                      </div>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-green-300">Win:</span>
                        <span className="text-green-300">
                          ₹{(category.fee * 1.5).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium mt-1">
                        <span className="text-orange-300">Lose:</span>
                        <span className="text-orange-300">
                          ₹{(category.fee * 0.8).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Create Button */}
                  <motion.div 
                    className="mt-6"
                    whileHover={canAfford ? { scale: 1.02 } : {}}
                  >
                    <div className={`text-center py-4 px-6 rounded-xl font-bold text-lg border-2 transition-all ${
                      canAfford 
                        ? 'bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50' 
                        : 'bg-black/30 border-red-500/50 text-red-300'
                    }`}>
                      <div className="flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>CREATING...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5" />
                            <span>
                              {canAfford ? 'CREATE GAME' : 'INSUFFICIENT BALANCE'}
                            </span>
                          </>
                        )}
                      </div>
                      {!canAfford && (
                        <div className="text-xs mt-1 text-red-300/80">
                          Need ₹{(category.fee - walletBalance).toLocaleString()} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
                
                {/* Overlay for insufficient balance */}
                {!canAfford && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 rounded-3xl">
                    <div className="text-center">
                      <div className="text-white font-bold text-xl mb-2">Insufficient Balance</div>
                      <div className="text-white/80 text-sm">
                        Add ₹{(category.fee - walletBalance).toLocaleString()} to create
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Game Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">1. Create Game</h4>
              <p className="text-white/70 text-sm">Choose your category and create a game room</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-green-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">2. Wait for Players</h4>
              <p className="text-white/70 text-sm">Up to 10 players can join your game</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8 text-yellow-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">3. Coin Flip</h4>
              <p className="text-white/70 text-sm">Random selection determines the winner</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-purple-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">4. Get Rewards</h4>
              <p className="text-white/70 text-sm">Winner gets 1.5x, others get 0.8x refund</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CoinFlipGame;