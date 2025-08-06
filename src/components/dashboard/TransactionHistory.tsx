import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, TrendingUp, TrendingDown, Calendar, Filter, Search, Download } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Transaction } from "../../types";

interface TransactionHistoryProps {
  userId: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'game_entry' | 'game_win' | 'game_loss'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [userId, filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;

      if (!error && data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.reference_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'withdrawal':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'game_entry':
        return <TrendingDown className="w-5 h-5 text-orange-400" />;
      case 'game_win':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'game_loss':
        return <TrendingUp className="w-5 h-5 text-orange-400" />;
      default:
        return <History className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'game_win':
        return 'text-green-400';
      case 'withdrawal':
      case 'game_entry':
        return 'text-red-400';
      case 'game_loss':
        return 'text-orange-400';
      default:
        return 'text-blue-400';
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Math.abs(amount));
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'game_entry':
        return 'Game Entry';
      case 'game_win':
        return 'Game Win';
      case 'game_loss':
        return 'Game Loss';
      default:
        return type.replace('_', ' ');
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
            <History className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Transaction History</h3>
            <p className="text-white/60 text-sm">{filteredTransactions.length} transactions</p>
          </div>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/60" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="game_entry">Game Entries</option>
            <option value="game_win">Game Wins</option>
            <option value="game_loss">Game Losses</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No transactions found</p>
            <p className="text-white/40 text-sm">Your transaction history will appear here</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {getTransactionLabel(transaction.type)}
                    </div>
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(transaction.created_at)}</span>
                      {transaction.reference_id && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-xs">
                            {transaction.reference_id.slice(0, 8)}...
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                    {transaction.amount > 0 ? '+' : ''}
                    {formatAmount(transaction.amount)}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    transaction.status === 'completed'
                      ? 'bg-green-500/20 text-green-300'
                      : transaction.status === 'pending'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {transaction.status}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-green-400 font-bold">
                +{formatAmount(filteredTransactions
                  .filter(t => t.amount > 0)
                  .reduce((sum, t) => sum + t.amount, 0)
                )}
              </div>
              <div className="text-white/60 text-xs">Total In</div>
            </div>
            <div>
              <div className="text-red-400 font-bold">
                -{formatAmount(Math.abs(filteredTransactions
                  .filter(t => t.amount < 0)
                  .reduce((sum, t) => sum + t.amount, 0)
                ))}
              </div>
              <div className="text-white/60 text-xs">Total Out</div>
            </div>
            <div>
              <div className="text-white font-bold">
                {formatAmount(filteredTransactions.reduce((sum, t) => sum + t.amount, 0))}
              </div>
              <div className="text-white/60 text-xs">Net Change</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TransactionHistory;