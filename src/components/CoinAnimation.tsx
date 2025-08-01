import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Coin {
  id: number;
  x: number;
  delay: number;
  duration: number;
  rotation: number;
}

const CoinAnimation: React.FC = () => {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    const generateCoin = () => {
      const newCoin: Coin = {
        id: Date.now() + Math.random(),
        x: Math.random() * window.innerWidth,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
        rotation: Math.random() * 360,
      };
      
      setCoins(prev => [...prev.slice(-20), newCoin]); // Keep only last 20 coins
    };

    const interval = setInterval(generateCoin, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {coins.map((coin) => (
        <motion.div
          key={coin.id}
          className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 shadow-lg"
          style={{
            left: coin.x,
            top: -32,
          }}
          initial={{ y: -32, rotate: coin.rotation, opacity: 0.8 }}
          animate={{ 
            y: window.innerHeight + 32, 
            rotate: coin.rotation + 720,
            opacity: 0 
          }}
          transition={{
            duration: coin.duration,
            delay: coin.delay,
            ease: "linear",
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-xs font-bold text-yellow-900">
            ₹
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CoinAnimation;