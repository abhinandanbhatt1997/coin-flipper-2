import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Users, Clock, Coins } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CoinBetGame from '../../game/CoinBetGame';

interface ActiveGame {
  id: string;
  entry_fee: number;
  current_players: number;
  max_players: number;
  created_at: string;
}

const GameCard: React.FC = () => {
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
    try {
      setJoiningGameId(gameId);

      const { error } = await supabase.rpc('increment_players', {
        game_id: gameId,
      });

      if (error) throw error;

      // TODO: Insert into game_players table, or redirect to /game/:id
      console.log(`Joined game ${gameId}`);
    } catch (err) {
      console.error('Failed to join game:', err);
    } finally {
      setJoiningGameId(null);
    }
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
                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Coins className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        ₹{game.entry_fee} Game
                      </div>
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeAgo(game.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-white/80">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">
                        {game.current_players}/{game.max_players}
                      </span>
                    </div>
                    <div className="text-xs text-white/60">
                      {spotsLeft} spots left
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {spotsLeft > 0 && (
                  <button
                    className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    disabled={joiningGameId === game.id}
                    onClick={() => handleJoinGame(game.id)}
                  >
                    {joiningGameId === game.id ? 'Joining...' : 'Join Game'}
                  </button>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <div className="mt-6">
        <h4 className="text-white font-semibold text-lg mb-3">Start a New Game</h4>
        <CoinBetGame />
      </div>
    </motion.div>
  );
};

export default GameCard;
