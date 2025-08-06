import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "../styles/game.css";
import { useParams } from "react-router-dom";

const PlayGamePage: React.FC = () => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedBet, setSelectedBet] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [screen, setScreen] = useState("investment");
  const [result, setResult] = useState<{ isWinner: boolean; payout: number; winnerPlayer: number } | null>(null);
  const { id: gameId } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchWallet = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

      if (data) setWalletBalance(data.wallet_balance);
    };

    fetchWallet();
  }, []);

  const handleSelectBet = (amount: number) => {
    if (amount > walletBalance) {
      alert(`Insufficient funds! You have ₹${walletBalance}`);
      return;
    }
    setSelectedBet(amount);
  };

  const confirmBet = () => {
    if (selectedBet > walletBalance) {
      alert("Insufficient funds!");
      return;
    }
    setWalletBalance(prev => prev - selectedBet);
    setCurrentBet(selectedBet);
    setScreen("game");
  };

  const playGame = () => {
    setScreen("coin");
    setTimeout(() => {
      const isWinner = Math.random() < 0.1;
      const payout = isWinner ? currentBet * 1.5 : currentBet * 0.8;
      const winnerPlayer = Math.floor(Math.random() * 10) + 1;
      setWalletBalance(prev => prev + payout);
      setResult({ isWinner, payout, winnerPlayer });
      setScreen("result");
    }, 2000);
  };

  const playAgain = () => {
    if (currentBet > walletBalance) {
      alert("Insufficient funds for another round!");
      setScreen("investment");
      return;
    }
    setWalletBalance(prev => prev - currentBet);
    setScreen("game");
  };

  return (
    <div className="bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900 min-h-screen text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          🪙 Coin Bet Game
        </h1>
        <p className="text-gray-300 text-lg text-center mb-6">10 Players • 1 Winner • Big Rewards</p>

        <div className="text-center mb-6">
          <div className="inline-block bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20">
            <span className="text-gray-300 text-sm uppercase tracking-wide">Wallet Balance</span>
            <div className="text-3xl font-bold text-green-400">₹{walletBalance.toFixed(2)}</div>
          </div>
        </div>

        {screen === "investment" && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Choose Your Bet Amount</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
              {[10, 50, 100, 500].map(amount => (
                <div
                  key={amount}
                  className={`bet-card bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 cursor-pointer text-center ${
                    selectedBet === amount ? "border-blue-400 selected-card" : "border-white/20"
                  }`}
                  onClick={() => handleSelectBet(amount)}
                >
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-2xl font-bold">₹{amount}</div>
                  <div className="text-gray-400 text-sm mt-1">{amount === 10 ? "Starter Bet" : amount === 500 ? "Elite Level" : "Standard Bet"}</div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <button
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-8 rounded-2xl text-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
                disabled={!selectedBet}
                onClick={confirmBet}
              >
                Confirm Bet
              </button>
            </div>
          </>
        )}

        {screen === "game" && (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold mb-4">Ready to Play?</h2>
              <p className="text-gray-300 mb-6">
                Your bet: <span className="text-yellow-400 font-bold">₹{currentBet}</span>
              </p>
              <p className="text-sm mb-4">Win: Get 1.5x your bet • Lose: Get 80% refund</p>
              <button
                onClick={playGame}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-12 rounded-2xl text-xl hover:from-blue-600 hover:to-purple-700 pulse-animation"
              >
                🎲 Play Game
              </button>
            </div>
          </div>
        )}

        {screen === "coin" && (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20">
              <h2 className="text-2xl font-bold mb-8">Flipping the Coin...</h2>
              <div className="coin-container flex justify-center mb-8">
                <img
                  src="https://img.icons8.com/color/100/000000/coin.png"
                  alt="Coin"
                  className="w-24 h-24 coin-flip"
                />
              </div>
              <p className="text-gray-300">Determining the winner...</p>
            </div>
          </div>
        )}

        {screen === "result" && result && (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 fade-in">
              <div className="text-6xl mb-4">{result.isWinner ? "🎉" : "💔"}</div>
              <h2 className={`text-3xl font-bold mb-4 ${result.isWinner ? "text-green-400" : "text-red-400"}`}>
                {result.isWinner ? "Congratulations!" : "Not This Time!"}
              </h2>
              <div className={`text-xl mb-6 ${result.isWinner ? "text-green-300" : "text-red-300"}`}>
                {result.isWinner
                  ? `You win! You received ₹${result.payout.toFixed(2)}`
                  : `You lose. Refund: ₹${result.payout.toFixed(2)}`}
              </div>
              <div className="space-y-4">
                <button
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-8 rounded-2xl text-lg hover:from-blue-600 hover:to-purple-700 mr-4"
                  onClick={playAgain}
                >
                  🎲 Play Again
                </button>
                <button
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 px-8 rounded-2xl text-lg hover:from-gray-600 hover:to-gray-700"
                  onClick={() => {
                    setSelectedBet(0);
                    setCurrentBet(0);
                    setResult(null);
                    setScreen("investment");
                  }}
                >
                  💰 New Bet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayGamePage;
