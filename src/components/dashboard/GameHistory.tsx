import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Trophy, TrendingDown, Calendar, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface GameHistoryItem {
  id: string;
  game_id: string;
  amount_paid: number;
  amount_won: number;
  is_winner: boolean;
  created_at: string;
  game: {
    entry_fee: number;
    max_players: number;
    completed_at: string;
  };
}

const GameHistory: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGames: 0,
    totalWins: 0,
    totalWinnings: 0,
    totalSpent: 0
  });

  useEffect(() => {
    if (user) {
      fetchGameHistory();
    }
  }, [user]);

  const fetchGameHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('game_participants')
        .select(`
          id,
          game_id,
          amount_paid,
          amount_won,
          is_winner,
          created_at,
          games!inner (
            entry_fee,
            max_players,
            completed_at
          )
        `)
        .eq('user_id', user.id)
        .not('games.completed_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const historyData = data?.map(item => ({
        ...item,
        game: item.games
      })) || [];

      setHistory(historyData);

      // Calculate stats
      const totalGames = historyData.length;
      const totalWins = historyData.filter(item => item.is_winner).length;
      const totalWinnings = historyData.reduce((sum, item) => sum + item.amount_won, 0);
      const totalSpent = historyData.reduce((sum, item) => sum + item.amount_paid, 0);

      setStats({ totalGames, totalWins, totalWinnings, totalSpent });
    } catch (error) {
      console.error('Error fetching game history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
          <History className="w-5 h-5 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Game History</h3>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-white/60 text-xs">Total Games</div>
          <div className="text-lg font-bold text-white">{stats.totalGames}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-white/60 text-xs">Wins</div>
          <div className="text-lg font-bold text-green-400">{stats.totalWins}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-white/60 text-xs">Total Won</div>
          <div className="text-lg font-bold text-green-400">₹{stats.totalWinnings.toLocaleString()}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-white/60 text-xs">Net P&L</div>
          <div className={`text-lg font-bold ${stats.totalWinnings - stats.totalSpent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ₹{(stats.totalWinnings - stats.totalSpent).toLocaleString()}
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No games played yet</p>
            <p className="text-white/40 text-sm">Your game history will appear here</p>
          </div>
        ) : (
          history.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`bg-white/5 rounded-lg p-4 border border-white/10 ${
                item.is_winner ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.is_winner ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {item.is_winner ? (
                      <Trophy className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${
                        item.is_winner ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {item.is_winner ? 'Won' : 'Lost'}
                      </span>
                      <span className="text-white/60 text-sm">•</span>
                      <span className="text-white/60 text-sm">₹{item.game.entry_fee} Entry</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(item.game.completed_at)}</span>
                      <Users className="w-3 h-3 ml-2" />
                      <span>{item.game.max_players} players</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${
                    item.is_winner ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {item.is_winner ? '+' : ''}₹{(item.amount_won - item.amount_paid).toLocaleString()}
                  </div>
                  <div className="text-white/60 text-xs">
                    Won: ₹{item.amount_won.toLocaleString()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default GameHistory;