import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowLeft, Coins, Trophy, Users, TrendingUp, Play, RotateCcw } from "lucide-react";
import "../styles/game.css";
import toast from "react-hot-toast";

const PlayGamePage: React.FC = () => {
  const { id: categoryId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedBet, setSelectedBet] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [screen, setScreen] = useState("investment");
  const [result, setResult] = useState<{ isWinner: boolean; payout: number; winnerPlayer: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const amount = parseInt(searchParams.get('amount') || '100');
  const categoryName = searchParams.get('category') || 'Game';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchWallet = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

      if (data) {
        setWalletBalance(data.wallet_balance);
      }
    };

    fetchWallet();
  }, [user, navigate]);

  const betOptions = [
    { amount: amount * 0.1, label: "10%" },
    { amount: amount * 0.5, label: "50%" },
    { amount: amount, label: "100%" },
    { amount: amount * 2, label: "200%" }
  ];

  const handleSelectBet = (betAmount: number) => {
    if (betAmount > walletBalance) {
      toast.error(`Insufficient funds! You have ₹${walletBalance.toLocaleString()}`);
      return;
    }
    setSelectedBet(betAmount);
  };

  const confirmBet = async () => {
    if (selectedBet > walletBalance) {
      toast.error("Insufficient funds!");
      return;
    }

    setLoading(true);
    try {
      // Deduct bet amount from wallet
      const { error: updateError } = await supabase
        .from("users")
        .update({ wallet_balance: walletBalance - selectedBet })
        .eq("id", user!.id);

      if (updateError) throw updateError;

      // Log the bet transaction
      await supabase.from("transactions").insert({
        user_id: user!.id,
        type: "game_entry",
        amount: -selectedBet,
        status: "completed",
        reference_id: `game_${Date.now()}`
      });

      setWalletBalance(prev => prev - selectedBet);
      setCurrentBet(selectedBet);
      setScreen("game");
      toast.success(`Bet placed: ₹${selectedBet.toLocaleString()}`);
    } catch (error) {
      toast.error("Failed to place bet");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const playGame = async () => {
    setScreen("coin");
    setLoading(true);

    // Simulate coin flip with 10% win chance
    setTimeout(async () => {
      const isWinner = Math.random() < 0.1; // 10% win chance
      const payout = isWinner ? currentBet * 1.5 : currentBet * 0.8;
      const winnerPlayer = Math.floor(Math.random() * 10) + 1;

      try {
        // Update wallet with payout
        const { error: updateError } = await supabase
          .from("users")
          .update({ wallet_balance: walletBalance + payout })
          .eq("id", user!.id);

        if (updateError) throw updateError;

        // Log the payout transaction
        await supabase.from("transactions").insert({
          user_id: user!.id,
          type: isWinner ? "game_win" : "game_loss",
          amount: payout,
          status: "completed",
          reference_id: `payout_${Date.now()}`
        });

        setWalletBalance(prev => prev + payout);
        setResult({ isWinner, payout, winnerPlayer });
        setScreen("result");

        if (isWinner) {
          toast.success(`🎉 You won ₹${payout.toLocaleString()}!`);
        } else {
          toast.error(`💔 You lost. Refund: ₹${payout.toLocaleString()}`);
        }
      } catch (error) {
        toast.error("Failed to process game result");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, 3000);
  };

  const playAgain = () => {
    if (currentBet > walletBalance) {
      toast.error("Insufficient funds for another round!");
      setScreen("investment");
      setSelectedBet(0);
      setCurrentBet(0);
      setResult(null);
      return;
    }
    
    setScreen("game");
    setResult(null);
  };

  const resetGame = () => {
    setSelectedBet(0);
    setCurrentBet(0);
    setResult(null);
    setScreen("investment");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/user')}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-white">{categoryName} Game</h1>
              <p className="text-white/60 text-sm">10 Players • 1 Winner • Big Rewards</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-green-500/20 rounded-full px-4 py-2 border border-green-500/30">
            <Coins className="w-5 h-5 text-green-400" />
            <span className="text-white font-semibold">
              ₹{walletBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Investment Screen */}
        {screen === "investment" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Choose Your Bet Amount
              </h2>
              <p className="text-white/80 text-lg">
                Select how much you want to bet in this {categoryName} game
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {betOptions.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bet-card bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 cursor-pointer text-center transition-all ${
                    selectedBet === option.amount 
                      ? "border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/25" 
                      : "border-white/20 hover:border-white/40 hover:bg-white/15"
                  } ${option.amount > walletBalance ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => option.amount <= walletBalance && handleSelectBet(option.amount)}
                  whileHover={option.amount <= walletBalance ? { scale: 1.05 } : {}}
                  whileTap={option.amount <= walletBalance ? { scale: 0.95 } : {}}
                >
                  <div className="text-4xl mb-3">💰</div>
                  <div className="text-2xl font-bold text-white">
                    ₹{option.amount.toLocaleString()}
                  </div>
                  <div className="text-purple-300 text-sm mt-1 font-medium">
                    {option.label} of base
                  </div>
                  {option.amount > walletBalance && (
                    <div className="text-red-300 text-xs mt-2">
                      Insufficient funds
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Game Rules */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Game Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-white/80">10 players maximum</span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-white/80">10% chance to win</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-white/80">1.5x win, 0.8x loss</span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-12 rounded-2xl text-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              disabled={!selectedBet || loading}
              onClick={confirmBet}
            >
              {loading ? 'Processing...' : `Confirm Bet ₹${selectedBet.toLocaleString()}`}
            </motion.button>
          </motion.div>
        )}

        {/* Game Screen */}
        {screen === "game" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20">
              <h2 className="text-3xl font-bold mb-6">Ready to Play?</h2>
              <div className="mb-8">
                <div className="text-6xl mb-4">🎲</div>
                <p className="text-white/80 text-lg mb-2">
                  Your bet: <span className="text-yellow-400 font-bold">₹{currentBet.toLocaleString()}</span>
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-500/30">
                    <div className="text-green-400 font-bold">Win (10%)</div>
                    <div className="text-white">₹{(currentBet * 1.5).toLocaleString()}</div>
                  </div>
                  <div className="bg-orange-500/20 rounded-lg p-3 border border-orange-500/30">
                    <div className="text-orange-400 font-bold">Lose (90%)</div>
                    <div className="text-white">₹{(currentBet * 0.8).toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={playGame}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-12 rounded-2xl text-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <Play className="w-6 h-6" />
                  {loading ? 'Playing...' : 'Flip Coin'}
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Coin Flip Animation */}
        {screen === "coin" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20">
              <h2 className="text-3xl font-bold mb-8 animate-pulse">Flipping the Coin...</h2>
              <div className="coin-container flex justify-center mb-8">
                <motion.div
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-4xl shadow-2xl"
                >
                  🪙
                </motion.div>
              </div>
              <p className="text-white/80 text-lg">Determining the winner...</p>
            </div>
          </motion.div>
        )}

        {/* Result Screen */}
        {screen === "result" && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20">
              <div className="text-8xl mb-6">{result.isWinner ? "🎉" : "💔"}</div>
              <h2 className={`text-4xl font-bold mb-6 ${result.isWinner ? "text-green-400" : "text-red-400"}`}>
                {result.isWinner ? "Congratulations!" : "Better Luck Next Time!"}
              </h2>
              
              <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
                <div className={`text-2xl font-bold mb-2 ${result.isWinner ? "text-green-400" : "text-orange-400"}`}>
                  {result.isWinner 
                    ? `You won ₹${result.payout.toLocaleString()}!` 
                    : `Refund: ₹${result.payout.toLocaleString()}`
                  }
                </div>
                <div className="text-white/60">
                  {result.isWinner 
                    ? `Amazing! You beat the 10% odds!` 
                    : `You get 80% of your bet back as consolation`
                  }
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-8 rounded-2xl text-lg hover:from-blue-600 hover:to-purple-700 flex items-center gap-2"
                  onClick={playAgain}
                >
                  <RotateCcw className="w-5 h-5" />
                  Play Again
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-8 rounded-2xl text-lg hover:from-green-600 hover:to-emerald-700"
                  onClick={resetGame}
                >
                  New Bet
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 px-8 rounded-2xl text-lg hover:from-gray-600 hover:to-gray-700"
                  onClick={() => navigate('/user')}
                >
                  Exit Game
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlayGamePage;