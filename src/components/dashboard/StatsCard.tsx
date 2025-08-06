import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Award, DollarSign, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface UserStats {
  totalGames: number;
  totalWins: number;
  totalWinnings: number;
  totalSpent: number;
  winRate: number;
  netProfit: number;
  bestWin: number;
  currentStreak: number;
}

const StatsCard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalGames: 0,
    totalWins: 0,
    totalWinnings: 0,
    totalSpent: 0,
    winRate: 0,
    netProfit: 0,
    bestWin: 0,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch game participation data
      const { data: gameData, error: gameError } = await supabase
        .from('game_participants')
        .select('amount_paid, amount_won, is_winner, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (gameError) throw gameError;

      if (gameData && gameData.length > 0) {
        const totalGames = gameData.length;
        const totalWins = gameData.filter(game => game.is_winner).length;
        const totalWinnings = gameData.reduce((sum, game) => sum + game.amount_won, 0);
        const totalSpent = gameData.reduce((sum, game) => sum + game.amount_paid, 0);
        const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
        const netProfit = totalWinnings - totalSpent;
        const bestWin = Math.max(...gameData.map(game => game.amount_won - game.amount_paid), 0);

        // Calculate current streak
        let currentStreak = 0;
        for (const game of gameData) {
          if (game.is_winner) {
            currentStreak++;
          } else {
            break;
          }
        }

        setStats({
          totalGames,
          totalWins,
          totalWinnings,
          totalSpent,
          winRate,
          netProfit,
          bestWin,
          currentStreak
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      label: 'Total Games',
      value: stats.totalGames.toString(),
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      label: 'Net Profit',
      value: formatCurrency(stats.netProfit),
      icon: stats.netProfit >= 0 ? TrendingUp : TrendingDown,
      color: stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: stats.netProfit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
    },
    {
      label: 'Best Win',
      value: formatCurrency(stats.bestWin),
      icon: Award,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
    {
      label: 'Current Streak',
      value: stats.currentStreak.toString(),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20'
    },
    {
      label: 'Total Winnings',
      value: formatCurrency(stats.totalWinnings),
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Your Statistics</h3>
          <p className="text-white/60 text-sm">Performance overview</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 ${item.bgColor} rounded-full flex items-center justify-center`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
            </div>
            <div className={`text-lg font-bold ${item.color} mb-1`}>
              {item.value}
            </div>
            <div className="text-white/60 text-xs">
              {item.label}
            </div>
          </motion.div>
        ))}
      </div>

      {stats.totalGames === 0 && (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/60">No games played yet</p>
          <p className="text-white/40 text-sm">Start playing to see your statistics</p>
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;