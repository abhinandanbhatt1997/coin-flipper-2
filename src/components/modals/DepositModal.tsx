import React, { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, X, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";

interface DepositModalProps {
  onClose: () => void;
}

declare const Razorpay: any; // Ensure Razorpay script is loaded in your HTML

const DepositModal: React.FC<DepositModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(500);
  const [loading, setLoading] = useState(false);

  const predefinedAmounts = [100, 500, 1000, 2000, 5000];

  const handleDeposit = async () => {
    if (!user) return toast.error("Please login first");
    if (amount < 100) return toast.error("Minimum deposit ₹100");

    setLoading(true);
    try {
      // Call Edge Function
      const res = await fetch(
        "https://YOUR-PROJECT-ref.supabase.co/functions/v1/create-coin-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, userId: user.id })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      // Open Razorpay checkout
      const options = {
        key: "RAZORPAY_KEY_ID", // Replace with your Razorpay Key ID
        amount: data.amount,
        currency: "INR",
        name: "Coin Flipper",
        description: "Add funds to wallet",
        order_id: data.orderId,
        prefill: { email: user.email },
        handler: async (response: any) => {
          toast.success("Payment successful!");
          onClose();
          // Optionally mark transaction completed via Edge Function or RPC
        },
        modal: { escape: true }
      };

      const rzp = new Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error("Deposit error:", err);
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-lg p-6 rounded-xl w-full max-w-md border border-white/20"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-white font-bold text-lg">Add Money</h2>
          </div>
          <button onClick={onClose} className="text-white w-8 h-8 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {predefinedAmounts.map(a => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`py-2 rounded-lg text-sm ${
                  amount === a ? "bg-green-500 text-white" : "bg-white/10 text-white/80"
                }`}
              >
                ₹{a}
              </button>
            ))}
          </div>

          <input
            type="number"
            min={100}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
          />

          <button
            onClick={handleDeposit}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-green-500 text-white flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? "Processing..." : `Pay ₹${amount}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DepositModal;
