// src/components/dashboard/WalletCard.tsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react";
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
      if (!error && data) setWalletBalance(data.wallet_balance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();

    if (user) {
      const subscription = supabase
        .channel("wallet-updates")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "users", filter: `id=eq.${user.id}` },
          (payload) => setWalletBalance(payload.new.wallet_balance)
        )
        .subscribe();

      return () => subscription.unsubscribe();
    }
  }, [user]);

  const handleModalClose = () => {
    setShowDeposit(false);
    setShowWithdraw(false);
    fetchWallet();
  };

  if (loading) return <div className="p-6 bg-white/10 rounded-2xl animate-pulse h-48"></div>;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-green-500/30">
            <Wallet className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Wallet Balance</h3>
            <p className="text-white/60 text-sm">Available funds</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            ₹{walletBalance.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>Ready to play</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDeposit(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/25"
          >
            <ArrowUpRight className="w-4 h-4" />
            Add Money
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowWithdraw(true)}
            disabled={walletBalance < 100}
            className="bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border border-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownRight className="w-4 h-4" />
            Withdraw
          </motion.button>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-white/60">
            <CreditCard className="w-4 h-4" />
            <span>Quick Actions</span>
          </div>
          <div className="flex gap-2">
            {[500, 1000].map((val) => (
              <button
                key={val}
                onClick={() => setShowDeposit(true)}
                className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-xs font-medium"
              >
                +₹{val}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {showDeposit && <DepositModal onClose={handleModalClose} />}
      {showWithdraw && <WithdrawModal currentBalance={walletBalance} onClose={handleModalClose} />}
    </>
  );
};

export default WalletCard;
