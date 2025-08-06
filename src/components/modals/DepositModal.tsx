import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";
import { CreditCard, X, Loader } from "lucide-react";
import toast from "react-hot-toast";

interface DepositModalProps {
  onClose: () => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ onClose }) => {
  const [amount, setAmount] = useState<number>(500);
  const [loading, setLoading] = useState(false);

  const predefinedAmounts = [100, 500, 1000, 2000, 5000, 10000];

  const handleDeposit = async () => {
    if (amount < 100) {
      toast.error("Minimum deposit amount is ₹100");
      return;
    }

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error("Please log in first");
        return;
      }

      // Get current balance
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        toast.error("Failed to fetch wallet balance");
        return;
      }

      // Update balance (simplified for demo - in production use payment gateway)
      const newBalance = userData.wallet_balance + amount;
      const { error: updateError } = await supabase
        .from("users")
        .update({ wallet_balance: newBalance })
        .eq("id", user.id);

      if (updateError) {
        toast.error("Failed to update balance");
        return;
      }

      // Create transaction record
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount: amount,
        status: "completed",
        reference_id: `demo_deposit_${Date.now()}`
      });

      toast.success(`₹${amount} deposited successfully!`);
      onClose();
    } catch (error: any) {
      toast.error("Deposit failed");
      console.error("Deposit error:", error);
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
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Add Money</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Select Amount
            </label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {predefinedAmounts.map((preAmount) => (
                <button
                  key={preAmount}
                  onClick={() => setAmount(preAmount)}
                  className={`py-3 px-3 rounded-lg text-sm font-medium transition-all ${
                    amount === preAmount
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  ₹{preAmount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Custom Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="100"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
              placeholder="Enter amount"
            />
            <div className="text-white/60 text-xs mt-1">
              Minimum deposit: ₹100
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
              onClick={handleDeposit}
              disabled={loading || amount < 100}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Add ₹${amount.toLocaleString()}`
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DepositModal;