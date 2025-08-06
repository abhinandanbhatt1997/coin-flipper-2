import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  GamepadIcon, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Trophy,
  Wallet
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  totalGames: number;
  totalRevenue: number;
  activeGames: number;
  completedGames: number;
  totalTransactions: number;
}

interface User {
  id: string;
  email: string;
  wallet_balance: number;
  created_at: string;
}

interface Game {
  id: string;
  status: string;
  entry_fee: number;
  current_players: number;
  max_players: number;
  created_at: string;
  completed_at?: string;
  winner_id?: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  users: {
    email: string;
  };
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'games' | 'transactions'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalGames: 0,
    totalRevenue: 0,
    activeGames: 0,
    completedGames: 0,
    totalTransactions: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Simple admin check - in production, you'd have proper role-based access
    if (!user.email?.includes('admin')) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/user');
      return;
    }

    fetchAdminData();
  }, [user, navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchGames(),
        fetchTransactions()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const [usersRes, gamesRes, transactionsRes] = await Promise.all([
      supabase.from('users').select('wallet_balance', { count: 'exact' }),
      supabase.from('games').select('status, entry_fee', { count: 'exact' }),
      supabase.from('transactions').select('amount', { count: 'exact' })
    ]);

    const totalUsers = usersRes.count || 0;
    const totalGames = gamesRes.count || 0;
    const totalTransactions = transactionsRes.count || 0;
    
    const activeGames = gamesRes.data?.filter(g => g.status === 'waiting').length || 0;
    const completedGames = gamesRes.data?.filter(g => g.status === 'completed').length || 0;
    
    const totalRevenue = gamesRes.data?.reduce((sum, game) => {
      if (game.status === 'completed') {
        return sum + (game.entry_fee * 0.13); // 13% platform fee
      }
      return sum;
    }, 0) || 0;

    setStats({
      totalUsers,
      totalGames,
      totalRevenue,
      activeGames,
      completedGames,
      totalTransactions
    });
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setGames(data);
    }
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        users (
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setTransactions(data);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'games', label: 'Games', icon: GamepadIcon },
    { id: 'transactions', label: 'Transactions', icon: DollarSign }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/user')}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-white/60 text-sm">System Management</p>
              </div>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAdminData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </motion.button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Total Users</h3>
                    <p className="text-white/60 text-sm">Registered players</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <GamepadIcon className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Total Games</h3>
                    <p className="text-white/60 text-sm">All time games</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{stats.totalGames}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Platform Revenue</h3>
                    <p className="text-white/60 text-sm">13% commission</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Activity className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Active Games</h3>
                    <p className="text-white/60 text-sm">Waiting for players</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{stats.activeGames}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Completed Games</h3>
                    <p className="text-white/60 text-sm">Finished rounds</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{stats.completedGames}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Total Transactions</h3>
                    <p className="text-white/60 text-sm">All payments</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{stats.totalTransactions}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-6">User Management</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left text-white/80 py-3 px-4">Email</th>
                    <th className="text-left text-white/80 py-3 px-4">Wallet Balance</th>
                    <th className="text-left text-white/80 py-3 px-4">Joined</th>
                    <th className="text-left text-white/80 py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 text-white">{user.email}</td>
                      <td className="py-3 px-4 text-green-400 font-semibold">
                        {formatCurrency(user.wallet_balance)}
                      </td>
                      <td className="py-3 px-4 text-white/60">{formatDate(user.created_at)}</td>
                      <td className="py-3 px-4">
                        <button className="text-blue-400 hover:text-blue-300 mr-3">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-red-400 hover:text-red-300">
                          <Ban className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Games Tab */}
        {activeTab === 'games' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-6">Game Management</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left text-white/80 py-3 px-4">Game ID</th>
                    <th className="text-left text-white/80 py-3 px-4">Status</th>
                    <th className="text-left text-white/80 py-3 px-4">Entry Fee</th>
                    <th className="text-left text-white/80 py-3 px-4">Players</th>
                    <th className="text-left text-white/80 py-3 px-4">Created</th>
                    <th className="text-left text-white/80 py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 text-white font-mono text-sm">
                        {game.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          game.status === 'waiting' 
                            ? 'bg-yellow-500/20 text-yellow-300' 
                            : 'bg-green-500/20 text-green-300'
                        }`}>
                          {game.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white">{formatCurrency(game.entry_fee)}</td>
                      <td className="py-3 px-4 text-white">
                        {game.current_players}/{game.max_players}
                      </td>
                      <td className="py-3 px-4 text-white/60">{formatDate(game.created_at)}</td>
                      <td className="py-3 px-4">
                        <button className="text-blue-400 hover:text-blue-300 mr-3">
                          <Eye className="w-4 h-4" />
                        </button>
                        {game.status === 'waiting' && (
                          <button className="text-red-400 hover:text-red-300">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-6">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left text-white/80 py-3 px-4">User</th>
                    <th className="text-left text-white/80 py-3 px-4">Type</th>
                    <th className="text-left text-white/80 py-3 px-4">Amount</th>
                    <th className="text-left text-white/80 py-3 px-4">Status</th>
                    <th className="text-left text-white/80 py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 text-white">
                        {transaction.users?.email || 'Unknown'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                          transaction.type === 'deposit' 
                            ? 'bg-green-500/20 text-green-300'
                            : transaction.type === 'withdrawal'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {transaction.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-semibold ${
                        transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(Math.abs(transaction.amount))}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          transaction.status === 'completed'
                            ? 'bg-green-500/20 text-green-300'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white/60">{formatDate(transaction.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;