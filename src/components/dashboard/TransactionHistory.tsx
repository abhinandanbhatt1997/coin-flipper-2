// src/components/dashboard/TransactionHistory.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Transaction } from "../../types";

const TransactionHistory: React.FC<{ userId: string }> = ({ userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTransactions(data);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, [userId]);

  if (loading) return <div className="text-white">Loading transactions...</div>;

  if (transactions.length === 0) {
    return <div className="text-white/60">No transactions yet.</div>;
  }

  return (
    <div className="bg-white/10 rounded-xl p-6 border border-white/20">
      <h3 className="text-white text-xl font-semibold mb-4">Transaction History</h3>
      <ul className="divide-y divide-white/10">
        {transactions.map((tx) => (
          <li key={tx.id} className="py-2 text-white/80 flex justify-between items-center">
            <span className="capitalize">{tx.type.replace('_', ' ')}</span>
            <span className={`${tx.type.includes('win') ? 'text-green-400' : tx.type.includes('loss') ? 'text-red-400' : 'text-blue-300'}`}>
              ₹{tx.amount.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionHistory;
