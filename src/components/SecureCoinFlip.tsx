import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Trophy, RotateCcw, Home, TrendingUp, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';

interface GameResult {
  user_choice: string;
  actual_result: string;
  is_winner: boolean;
  coins_bet: number;
  coins_won: number;
  new_balance: number;
  game_id: string;
}

interface WalletData {
  coin_balance: number;
  total_deposited: number;
  total_withdrawn: number;
}

const SecureCoinFlip: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [selectedBet, setSelectedBet] = useState<number>(1);
  const [userChoice, setUserChoice] = useState<'heads' | 'tails' | null>(null);
  const [gamePhase, setGamePhase] = useState<'betting' | 'choosing' | 'flipping' | 'result'>('betting');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWallet();
  }, [user, navigate]);

  const fetchWallet = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('coin_balance, total_deposited, total_withdrawn')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Create wallet if it doesn't exist
        const { error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: user.id, coin_balance: 0 });
        
        if (!createError) {
          setWallet({ coin_balance: 0, total_deposited: 0, total_withdrawn: 0 });
        }
      } else {
        setWallet(data);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to load wallet');
    }
  };

  const betAmounts = [1, 5, 10, 25, 50, 100];

  const handleBetSelection = (amount: number) => {
    if (!wallet || wallet.coin_balance < amount) {
      toast.error('Insufficient coins!');
      return;
    }
    setSelectedBet(amount);
    setGamePhase('choosing');
  };

  const handleChoiceSelection = (choice: 'heads' | 'tails') => {
    setUserChoice(choice);
    setGamePhase('flipping');
    playGame(choice);
  };

  const playGame = async (choice: 'heads' | 'tails') => {
    if (!user) return;

    setLoading(true);
    
    try {
      // Call secure edge function
      const { data, error } = await supabase.functions.invoke('secure-coin-flip', {
        body: {
          user_choice: choice,
          coins_bet: selectedBet,
          multiplier: 2.0
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Game failed');
      }

      // Simulate coin flip animation delay
      setTimeout(() => {
        setGameResult(data.result);
        setGamePhase('result');
        
        // Update wallet balance
        if (wallet) {
          setWallet({
            ...wallet,
            coin_balance: data.result.new_balance
          });
        }

        // Show confetti for winners
        if (data.result.is_winner) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          toast.success(`🎉 You won ${data.result.coins_won} coins!`);
        } else {
          toast.error(`💔 You lost ${data.result.coins_bet} coins`);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Game error:', error);
      toast.error(error.message || 'Game failed');
      setGamePhase('betting');
    } finally {
      setLoading(false);
    }
  };

  const resetGame = () => {
    setSelectedBet(1);
    setUserChoice(null);
    setGameResult(null);
    setGamePhase('betting');
    setShowConfetti(false);
  };

  const playAgain = () => {
    if (!wallet || wallet.coin_balance < selectedBet) {
      toast.error('Insufficient coins for another round!');
      resetGame();
      return;
    }
    setUserChoice(null);
    setGameResult(null);
    setGamePhase('choosing');
    setShowConfetti(false);
  };

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
      
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
              <h1 className="text-2xl font-bold text-white">Secure Coin Flip</h1>
              <p className="text-white/60 text-sm">Provably fair • Server-side logic</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-yellow-500/20 rounded-full px-4 py-2 border border-yellow-500/30">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">{wallet.coin_balance} coins</span>
            </div>
            <button
              onClick={() => navigate('/user?tab=wallet')}
              className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
            >
              Buy Coins
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Betting Phase */}
        {gamePhase === 'betting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Choose Your Bet
              </h2>
              <p className="text-white/80 text-lg">Select how many coins you want to bet</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {betAmounts.map((amount, index) => {
                const canAfford = wallet.coin_balance >= amount;
                
                return (
                  <motion.button
                    key={amount}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={canAfford ? { scale: 1.05 } : {}}
                    whileTap={canAfford ? { scale: 0.95 } : {}}
                    onClick={() => canAfford && handleBetSelection(amount)}
                    disabled={!canAfford}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      canAfford
                        ? 'bg-white/10 border-white/20 hover:border-purple-400 hover:bg-purple-500/20 cursor-pointer'
                        : 'bg-black/30 border-red-500/50 text-red-300 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="text-3xl mb-2">🪙</div>
                    <div className="text-2xl font-bold text-white">{amount} coins</div>
                    <div className="text-purple-300 text-sm mt-1">
                      Win: {amount * 2} coins
                    </div>
                    {!canAfford && (
                      <div className="text-red-300 text-xs mt-2">
                        Need {amount - wallet.coin_balance} more
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Game Rules */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <span className="text-white/80">50% chance to win</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-white/80">2x multiplier on wins</span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-white/80">Provably fair results</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Choice Selection Phase */}
        {gamePhase === 'choosing' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20">
              <h2 className="text-3xl font-bold mb-6">Choose Heads or Tails</h2>
              <div className="mb-8">
                <p className="text-white/80 text-lg mb-2">
                  Betting: <span className="text-yellow-400 font-bold">{selectedBet} coins</span>
                </p>
                <p className="text-white/60">
                  Potential win: <span className="text-green-400 font-bold">{selectedBet * 2} coins</span>
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChoiceSelection('heads')}
                  className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
                >
                  <div className="text-6xl mb-4">👑</div>
                  <div className="text-xl font-bold">HEADS</div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChoiceSelection('tails')}
                  className="bg-gradient-to-br from-green-500 to-teal-600 p-8 rounded-2xl hover:from-green-600 hover:to-teal-700 transition-all shadow-lg"
                >
                  <div className="text-6xl mb-4">🦅</div>
                  <div className="text-xl font-bold">TAILS</div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Coin Flip Animation */}
        {gamePhase === 'flipping' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20">
              <h2 className="text-3xl font-bold mb-8 animate-pulse">Flipping the Coin...</h2>
              <div className="flex justify-center mb-8">
                <motion.div
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-6xl shadow-2xl"
                >
                  🪙
                </motion.div>
              </div>
              <p className="text-white/80 text-lg">
                You chose: <span className="text-blue-400 font-bold capitalize">{userChoice}</span>
              </p>
              <p className="text-white/60">Determining the result securely...</p>
            </div>
          </motion.div>
        )}

        {/* Results Phase */}
        {gamePhase === 'result' && gameResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20">
              <div className="text-8xl mb-6">
                {gameResult.is_winner ? "🎉" : "💔"}
              </div>
              
              <h2 className={`text-4xl font-bold mb-6 ${
                gameResult.is_winner ? "text-green-400" : "text-red-400"
              }`}>
                {gameResult.is_winner ? "You Won!" : "You Lost!"}
              </h2>
              
              <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-white/60 text-sm mb-1">Your Choice</div>
                    <div className="text-2xl font-bold text-blue-400 capitalize">
                      {gameResult.user_choice}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm mb-1">Result</div>
                    <div className="text-2xl font-bold text-purple-400 capitalize">
                      {gameResult.actual_result}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className={`text-2xl font-bold mb-2 ${
                    gameResult.is_winner ? "text-green-400" : "text-red-400"
                  }`}>
                    {gameResult.is_winner 
                      ? `+${gameResult.coins_won} coins` 
                      : `-${gameResult.coins_bet} coins`
                    }
                  </div>
                  <div className="text-white/60">
                    New balance: {gameResult.new_balance} coins
                  </div>
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
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 px-8 rounded-2xl text-lg hover:from-gray-600 hover:to-gray-700 flex items-center gap-2"
                  onClick={() => navigate('/user')}
                >
                  <Home className="w-5 h-5" />
                  Dashboard
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SecureCoinFlip;