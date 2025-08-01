import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { Users, Clock, Trophy, Coins } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  avatar: string;
}

interface GameState {
  id: string;
  category: string;
  entryFee: number;
  players: Player[];
  maxPlayers: number;
  status: 'waiting' | 'flipping' | 'completed';
  winner?: Player;
  timeLeft?: number;
}

interface CoinFlipGameProps {
  gameState: GameState;
  onGameComplete: (winner: Player, payout: number) => void;
  onLeaveGame: () => void;
}

const CoinFlipGame: React.FC<CoinFlipGameProps> = ({ 
  gameState, 
  onGameComplete, 
  onLeaveGame 
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (gameState.players.length === gameState.maxPlayers && gameState.status === 'waiting') {
      // Start countdown when room is full
      const delay = 500 + Math.random() * 300; // 500-800ms variable delay
      setCountdown(3);
      
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setTimeout(() => startCoinFlip(), delay);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [gameState.players.length, gameState.maxPlayers]);

  const startCoinFlip = () => {
    setIsFlipping(true);
    
    // Simulate coin flip animation
    setTimeout(() => {
      const winnerIndex = Math.floor(Math.random() * gameState.players.length);
      const winner = gameState.players[winnerIndex];
      const payout = gameState.entryFee * 1.5;
      
      setIsFlipping(false);
      setShowResult(true);
      onGameComplete(winner, payout);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {showResult && gameState.winner && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {gameState.category} Room
          </h1>
          <div className="flex items-center justify-center gap-4 text-white/80">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              <span>₹{gameState.entryFee}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{gameState.players.length}/{gameState.maxPlayers}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <span>₹{(gameState.entryFee * 1.5).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {Array.from({ length: gameState.maxPlayers }).map((_, index) => {
            const player = gameState.players[index];
            const isWinner = showResult && gameState.winner?.id === player?.id;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative aspect-square rounded-2xl flex items-center justify-center ${
                  player 
                    ? isWinner 
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    : 'bg-white/10 border-2 border-dashed border-white/30'
                }`}
              >
                {player ? (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 mx-auto">
                      <span className="text-white font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-white text-xs font-medium truncate">
                      {player.name}
                    </div>
                    {isWinner && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2"
                      >
                        <Trophy className="w-6 h-6 text-yellow-300" />
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="text-white/50 text-center">
                    <Users className="w-8 h-8 mx-auto mb-1" />
                    <div className="text-xs">Waiting</div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Game Status */}
        <div className="text-center">
          <AnimatePresence mode="wait">
            {countdown > 0 && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="text-6xl font-bold text-white mb-4"
              >
                {countdown}
              </motion.div>
            )}
            
            {isFlipping && (
              <motion.div
                key="flipping"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-2xl font-bold text-yellow-900"
                >
                  ₹
                </motion.div>
                <div className="text-2xl font-bold text-white">Flipping Coin...</div>
              </motion.div>
            )}
            
            {showResult && gameState.winner && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-white mb-2">
                  🎉 {gameState.winner.name} Wins! 🎉
                </div>
                <div className="text-xl text-yellow-400 mb-4">
                  Prize: ₹{(gameState.entryFee * 1.5).toLocaleString()}
                </div>
                <div className="text-white/80">
                  Others receive: ₹{(gameState.entryFee * 0.8).toLocaleString()}
                </div>
              </motion.div>
            )}
            
            {gameState.players.length < gameState.maxPlayers && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 text-white mb-4">
                  <Clock className="w-5 h-5 animate-pulse" />
                  <span>Waiting for players...</span>
                </div>
                <div className="text-white/60">
                  {gameState.maxPlayers - gameState.players.length} more players needed
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          {!showResult && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLeaveGame}
              className="px-6 py-3 bg-red-500/20 text-red-300 rounded-xl font-semibold hover:bg-red-500/30 transition-colors"
            >
              Leave Game
            </motion.button>
          )}
          
          {showResult && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLeaveGame}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Play Again
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CoinFlipGame;