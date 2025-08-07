import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { supabase } from '../lib/supabase';


export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        const { data: dbUser } = await supabase
          .from("users")
          .select("wallet_balance")
          .eq("user_id", user.user_id)
          .single();

        setBalance(dbUser?.wallet_balance ?? 0);
      }
      setLoading(false);
    }

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user?.email}</h1>
      <p className="mb-4">Wallet Balance: ₹{balance}</p>

      <h2 className="text-xl font-semibold mb-2">Available Games</h2>
      <ul className="list-disc pl-6">
        <li>Game 1 - Entry Fee: ₹100</li>
        <li>Game 2 - Entry Fee: ₹50</li>
      </ul>

      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}
