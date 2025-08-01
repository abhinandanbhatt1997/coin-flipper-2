import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";
import { Banknote, X, Loader } from "lucide-react";
import toast from "react-hot-toast";

interface WithdrawModalProps {
  onClose: () => void;
  currentBalance: number;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ onClose, currentBalance }) => {
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  const maxWithdraw = Math.floor(currentBalance / 100) * 100; // Round down to nearest 100

  const handleWithdraw = async () => {
    if (amount < 100) {
      toast.error("Minimum withdrawal amount is ₹100");
      return;
    }

    if (amount > currentBalance) {
      toast.error("Insufficient balance");
      return;
    }

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error("Please log in first");
        return;
      }

      // Update balance
      const newBalance = currentBalance - amount;
      const { error: updateError } = await supabase
        .from("users")
        .update({ wallet_balance: newBalance })
        .eq("id", user.id);

      if (updateError) {
        toast.error("Failed to process withdrawal");
        return;
      }

      // Create transaction record
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "withdrawal",
        amount: -amount,
        status: "completed",
        reference_id: `withdrawal_${Date.now()}`
      });

      toast.success(`₹${amount} withdrawn successfully!`);
      onClose();
    } catch (error: any) {
      toast.error("Withdrawal failed");
      console.error("Withdrawal error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-white/20"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
              <Banknote className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Withdraw Money</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-white/60 text-sm">Available Balance</div>
            <div className="text-2xl font-bold text-white">₹{currentBalance.toLocaleString()}</div>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Withdrawal Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="100"
              max={maxWithdraw}
              step="100"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter amount"
            />
            <div className="text-white/60 text-xs mt-1">
              Minimum: ₹100 • Maximum: ₹{maxWithdraw.toLocaleString()}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={loading || amount < 100 || amount > currentBalance}
              className="flex-1 py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Withdraw ₹${amount}`
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WithdrawModal;