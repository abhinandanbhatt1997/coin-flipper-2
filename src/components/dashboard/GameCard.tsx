import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Users, Clock, Coins, Plus, Gamepad2, Trophy, Star, Crown, Shield, Target, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface ActiveGame {
  id: string;
  entry_fee: number;
  current_players: number;
  max_players: number;
  created_at: string;
}

const GameCard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveGames();

    const subscription = supabase
      .channel('active-games')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: 'status=eq.waiting',
        },
        () => {
          fetchActiveGames();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchActiveGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, entry_fee, current_players, max_players, created_at')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setActiveGames(data || []);
    } catch (error) {
      console.error('Error fetching active games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (gameId: string) => {
    if (!user) {
      toast.error('Please log in first');
      navigate('/login');
      return;
    }

    setJoiningGameId(gameId);
    
    try {
      // Get game details
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('entry_fee, current_players, max_players')
        .eq('id', gameId)
        .single();

      if (gameError || !gameData) {
        toast.error('Game not found');
        return;
      }

      // Check user balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      if (userError || !userData || userData.wallet_balance < gameData.entry_fee) {
        toast.error('Insufficient wallet balance!');
        return;
      }

      if (gameData.current_players >= gameData.max_players) {
        toast.error('Game is full!');
        fetchActiveGames(); // Refresh the list
        return;
      }

      // Use RPC to join game
      const { data: resultGameId, error: rpcError } = await supabase
        .rpc('auto_join_or_create_game', {
          _user_id: user.id,
          _entry_fee: gameData.entry_fee,
          _max_players: gameData.max_players
        });

      if (rpcError) throw rpcError;

      // Deduct from wallet
      const { error: walletError } = await supabase
        .from('users')
        .update({ wallet_balance: userData.wallet_balance - gameData.entry_fee })
        .eq('id', user.id);

      if (walletError) throw walletError;

      // Log transaction (without game_id to avoid schema issues)
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'game_entry',
        amount: -gameData.entry_fee,
        status: 'completed',
        reference_id: gameId
      });

      toast.success('Joined game successfully!');
      navigate(`/lobby/${resultGameId || gameId}`);

    } catch (error: any) {
      console.error('Error joining game:', error);
      toast.error(error.message || 'Failed to join game');
    } finally {
      setJoiningGameId(null);
    }
  };

  const handleCreateGame = () => {
    navigate('/create-game');
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const gameTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - gameTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getCategoryIcon = (entryFee: number) => {
    switch (entryFee) {
      case 100: return <Shield className="w-5 h-5" />;
      case 250: return <Crown className="w-5 h-5" />;
      case 500: return <Star className="w-5 h-5" />;
      case 1000: return <Zap className="w-5 h-5" />;
      case 2000: return <Trophy className="w-5 h-5" />;
      case 5000: return <Target className="w-5 h-5" />;
      default: return <Play className="w-5 h-5" />;
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

  const getCategoryGradient = (entryFee: number) => {
    switch (entryFee) {
      case 100: return 'from-gray-400 to-gray-600';
      case 250: return 'from-yellow-400 to-orange-600';
      case 500: return 'from-blue-400 to-purple-600';
      case 1000: return 'from-green-400 to-emerald-600';
      case 2000: return 'from-indigo-400 to-purple-600';
      case 5000: return 'from-red-400 to-pink-600';
      default: return 'from-purple-400 to-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
          <Play className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Active Games</h3>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {activeGames.length === 0 ? (
          <div className="text-center py-8">
            <Play className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No active games</p>
            <p className="text-white/40 text-sm">Start a new game to see it here</p>
          </div>
        ) : (
          activeGames.map((game) => {
            const spotsLeft = game.max_players - game.current_players;
            const progress = (game.current_players / game.max_players) * 100;

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-gradient-to-r ${getCategoryGradient(game.entry_fee)} rounded-lg p-4 border border-white/20 hover:shadow-lg transition-all`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      {getCategoryIcon(game.entry_fee)}
                    </div>
                    <div>
                      <div className="text-white font-bold">
                        {getCategoryName(game.entry_fee)} Game
                      </div>
                      <div className="text-white/80 text-sm">
                        ₹{game.entry_fee.toLocaleString()} Entry
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-white">
                      <Users className="w-4 h-4" />
                      <span className="font-bold">
                        {game.current_players}/{game.max_players}
                      </span>
                    </div>
                    <div className="text-xs text-white/80">
                      {spotsLeft} spots left
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white/60 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-white/80 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{getTimeAgo(game.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>Win: ₹{(game.entry_fee * 1.5).toLocaleString()}</span>
                    <span>Loss: ₹{(game.entry_fee * 0.8).toLocaleString()}</span>
                  </div>
                </div>

                {spotsLeft > 0 && (
                  <button
                    className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition font-semibold border border-white/30 hover:border-white/50"
                    disabled={joiningGameId === game.id}
                    onClick={() => handleJoinGame(game.id)}
                  >
                    {joiningGameId === game.id ? 'Joining...' : `Join Game (${game.current_players}/${game.max_players})`}
                  </button>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-semibold text-lg">Quick Actions</h4>
        </div>
        
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateGame}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create New Game
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/user?tab=games')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Gamepad2 className="w-5 h-5" />
            Browse Games
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;