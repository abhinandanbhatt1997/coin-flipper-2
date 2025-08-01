import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, Minus, TrendingUp } from "lucide-react";
import DepositModal from "../modals/DepositModal";
import WithdrawModal from "../modals/WithdrawModal";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

const WalletCard: React.FC = () => {
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const fetchWallet = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setWalletBalance(data.wallet_balance);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();

    // Subscribe to real-time updates
    if (user) {
      const subscription = supabase
        .channel('wallet-updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        }, (payload) => {
          setWalletBalance(payload.new.wallet_balance);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const handleModalClose = () => {
    setShowDeposit(false);
    setShowWithdraw(false);
    fetchWallet(); // Refresh balance
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="h-8 bg-white/20 rounded mb-6"></div>
          <div className="flex gap-3">
            <div className="h-10 bg-white/20 rounded flex-1"></div>
            <div className="h-10 bg-white/20 rounded flex-1"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
            <Wallet className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Wallet Balance</h3>
            <p className="text-white/60 text-sm">Available funds</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-3xl font-bold text-white mb-2">
            ₹{walletBalance.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Ready to play</span>
          </div>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDeposit(true)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Money
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowWithdraw(true)}
            disabled={walletBalance < 100}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-4 h-4" />
            Withdraw
          </motion.button>
        </div>
      </motion.div>

      {showDeposit && <DepositModal onClose={handleModalClose} />}
      {showWithdraw && (
        <WithdrawModal 
          onClose={handleModalClose} 
          currentBalance={walletBalance}
        />
      )}
    </>
  );
};

export default WalletCard;