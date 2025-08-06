// 💎 Enhanced GameRoom.tsx with elegant UI & animation
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import '../styles/game.css';
import { placeBetAndLog, applyPayoutAndLog } from '../utils/wallet';
import { motion } from 'framer-motion';

const GameRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [status, setStatus] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState("investment");
  const [selectedBet, setSelectedBet] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [result, setResult] = useState<{ isWinner: boolean; payout: number; winnerPlayer: number } | null>(null);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: walletData } = await supabase.from('users').select('wallet_balance').eq('id', user.id).single();
      setWalletBalance(walletData?.wallet_balance || 0);

      const { data: gameData } = await supabase.from('games').select('status').eq('id', id).single();
      setStatus(gameData?.status ?? "unknown");

      const { data: participantData } = await supabase.from('game_participants').select('user_id').eq('game_id', id);
      setPlayers(participantData?.map((p) => p.user_id) || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:game:${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${id}` }, (payload) => {
        setStatus(payload.new.status);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_participants', filter: `game_id=eq.${id}` }, (payload) => {
        setPlayers((prev) => [...new Set([...prev, payload.new.user_id])]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleSelectBet = (amount: number) => {
    if (amount > walletBalance) {
      alert(`Insufficient funds! You have ₹${walletBalance}`);
      return;
    }
    setSelectedBet(amount);
  };

  const confirmBet = async () => {
    if (selectedBet > walletBalance) {
      alert("Insufficient funds!");
      return;
    }
    const success = await placeBetAndLog(userId, id!, selectedBet);
    if (!success) return;
    setWalletBalance((prev) => prev - selectedBet);
    setCurrentBet(selectedBet);
    setScreen("game");
  };

  const playGame = async () => {
    setScreen("coin");
    setTimeout(async () => {
      const isWinner = Math.random() < 0.5;
      const payout = isWinner ? currentBet * 1.5 : currentBet * 0.8;
      const winnerPlayer = Math.floor(Math.random() * 10) + 1;
      const success = await applyPayoutAndLog(userId, id!, payout, isWinner);
      if (!success) return;
      setWalletBalance((prev) => prev + payout);
      setResult({ isWinner, payout, winnerPlayer });
      setScreen("result");
    }, 2000);
  };

  const resetGame = () => {
    setSelectedBet(0);
    setCurrentBet(0);
    setResult(null);
    setScreen("investment");
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-white bg-black">Loading...</div>;
  }

  return (
    <div className="min-h-screen text-white bg-gradient-to-b from-black via-gray-900 to-black p-6">
      <div className="flex justify-between items-center mb-4">
        <motion.h1 className="text-3xl font-bold text-yellow-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Game Room #{id?.slice(0, 6)}
        </motion.h1>
        <button
          onClick={() => navigate('/user')}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl"
        >
          🔙 Exit
        </button>
      </div>

      <motion.div
        className="text-sm text-gray-400 mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Wallet: ₹{walletBalance.toFixed(2)} • Status: <span className="text-white font-semibold">{status}</span>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        {screen === "investment" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-xl text-center mb-4">Select Your Bet</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[10, 50, 100, 500].map((amount) => (
                <div
                  key={amount}
                  onClick={() => handleSelectBet(amount)}
                  className={`p-4 rounded-xl cursor-pointer text-center bg-white/10 hover:bg-white/20 transition ${
                    selectedBet === amount ? "ring-2 ring-blue-400" : ""
                  }`}
                >
                  ₹{amount}
                </div>
              ))}
            </div>
            <div className="text-center">
              <button
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-xl"
                onClick={confirmBet}
                disabled={!selectedBet}
              >
                Confirm Bet
              </button>
            </div>
          </motion.div>
        )}

        {screen === "game" && (
          <motion.div className="text-center mt-10" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <h2 className="text-lg mb-4">You bet ₹{currentBet}</h2>
            <motion.button
              onClick={playGame}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-8 rounded-xl pulse-animation"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🎲 Flip Coin
            </motion.button>
          </motion.div>
        )}

        {screen === "coin" && (
          <motion.div className="text-center mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-xl mb-4 animate-pulse">Flipping...</h2>
            <motion.img
              src="https://img.icons8.com/color/100/000000/coin.png"
              alt="coin"
              className="mx-auto w-24 h-24 animate-spin"
            />
          </motion.div>
        )}

        {screen === "result" && result && (
          <motion.div className="text-center mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className={`text-2xl font-bold mb-4 ${result.isWinner ? "text-green-400" : "text-red-400"}`}>
              {result.isWinner ? "🎉 You Win!" : "😢 You Lose!"}
            </h2>
            <p className="text-lg mb-4">
              {result.isWinner ? `Payout: ₹${result.payout.toFixed(2)}` : `Refund: ₹${result.payout.toFixed(2)}`}
            </p>
            <div className="flex justify-center gap-4">
              <button className="bg-blue-600 text-white py-2 px-6 rounded-xl" onClick={resetGame}>Play Again</button>
              <button className="bg-gray-600 text-white py-2 px-6 rounded-xl" onClick={() => navigate('/user')}>Exit</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GameRoom;
