import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, CreditCard, TrendingUp, TrendingDown, History, Shield, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface WalletData {
  coin_balance: number;
  total_deposited: number;
  total_withdrawn: number;
}

interface CoinTransaction {
  id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  created_at: string;
  reference_id?: string;
}

const SecureWallet: React.FC = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingCoins, setBuyingCoins] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchTransactions();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('coin_balance, total_deposited, total_withdrawn')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Create wallet if it doesn't exist
        const { error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: user.id, coin_balance: 0 });
        
        if (!createError) {
          setWallet({ coin_balance: 0, total_deposited: 0, total_withdrawn: 0 });
        }
      } else {
        setWallet(data);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const coinPackages = [
    { coins: 10, price: 100, bonus: 0, popular: false },
    { coins: 50, price: 500, bonus: 5, popular: false },
    { coins: 100, price: 1000, bonus: 15, popular: true },
    { coins: 250, price: 2500, bonus: 50, popular: false },
    { coins: 500, price: 5000, bonus: 125, popular: false },
    { coins: 1000, price: 10000, bonus: 300, popular: false },
  ];

  const handleBuyCoins = async (packageData: typeof coinPackages[0]) => {
    if (!user) return;

    setBuyingCoins(true);
    
    try {
      // Create order via edge function
      const { data, error } = await supabase.functions.invoke('create-coin-order', {
        body: {
          amount_inr: packageData.price,
          coins_to_add: packageData.coins + packageData.bonus
        }
      });

      if (error) throw error;

      // For demo purposes, we'll simulate successful payment
      // In production, integrate with actual Razorpay
      toast.success(`Successfully purchased ${packageData.coins + packageData.bonus} coins!`);
      
      // Simulate adding coins (in production, this would be handled by webhook)
      if (wallet) {
        setWallet({
          ...wallet,
          coin_balance: wallet.coin_balance + packageData.coins + packageData.bonus,
          total_deposited: wallet.total_deposited + packageData.price
        });
      }
      
      fetchTransactions();

    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Purchase failed');
    } finally {
      setBuyingCoins(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className="w-5 h-5 text-green-400" />;
      case 'game_bet':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'game_win':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      default:
        return <History className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'game_win':
        return 'text-green-400';
      case 'game_bet':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Wallet Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-lg rounded-3xl p-8 border border-yellow-500/30"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Coins className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Coin Wallet</h2>
            <p className="text-white/80">Secure • Transparent • Fair</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Coins className="w-6 h-6 text-yellow-400" />
              <span className="text-white/80">Current Balance</span>
            </div>
            <div className="text-4xl font-bold text-yellow-400">
              {wallet?.coin_balance || 0}
            </div>
            <div className="text-white/60 text-sm">coins</div>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <span className="text-white/80">Total Purchased</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              ₹{wallet?.total_deposited || 0}
            </div>
            <div className="text-white/60 text-sm">lifetime</div>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-blue-400" />
              <span className="text-white/80">Conversion Rate</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">₹10</div>
            <div className="text-white/60 text-sm">per coin</div>
          </div>
        </div>
      </motion.div>

      {/* Coin Packages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Buy Coins</h3>
            <p className="text-white/60">Choose a package to get started</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coinPackages.map((pkg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white/5 rounded-2xl p-6 border transition-all hover:bg-white/10 ${
                pkg.popular 
                  ? 'border-green-500/50 ring-2 ring-green-500/20' 
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    POPULAR
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🪙</div>
                <div className="text-3xl font-bold text-white mb-1">
                  {pkg.coins}
                  {pkg.bonus > 0 && (
                    <span className="text-green-400"> +{pkg.bonus}</span>
                  )}
                </div>
                <div className="text-white/60">coins</div>
                {pkg.bonus > 0 && (
                  <div className="text-green-400 text-sm font-medium mt-1">
                    {pkg.bonus} bonus coins!
                  </div>
                )}
              </div>

              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-white">₹{pkg.price}</div>
                <div className="text-white/60 text-sm">
                  ₹{(pkg.price / (pkg.coins + pkg.bonus)).toFixed(1)} per coin
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleBuyCoins(pkg)}
                disabled={buyingCoins}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                  pkg.popular
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {buyingCoins ? 'Processing...' : 'Buy Now'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
            <History className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Transaction History</h3>
            <p className="text-white/60">{transactions.length} transactions</p>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No transactions yet</p>
              <p className="text-white/40 text-sm">Your transaction history will appear here</p>
            </div>
          ) : (
            transactions.map((transaction) => (
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
                      <div className="text-white font-medium capitalize">
                        {transaction.type.replace('_', ' ')}
                      </div>
                      <div className="text-white/60 text-sm">
                        {formatDate(transaction.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                      {transaction.amount > 0 ? '+' : ''}
                      {transaction.amount} coins
                    </div>
                    <div className="text-white/60 text-sm">
                      Balance: {transaction.balance_after}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SecureWallet;