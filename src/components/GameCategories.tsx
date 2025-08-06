import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Diamond, Wrench, Star, Crown, Gem, Play, TrendingUp, Users } from 'lucide-react';

interface GameCategory {
  id: string;
  name: string;
  amount: number;
  icon: React.ReactNode;
  gradient: string;
  description: string;
  winMultiplier: number;
  lossMultiplier: number;
}

const categories: GameCategory[] = [
  {
    id: 'iron',
    name: 'Iron',
    amount: 100,
    icon: <Wrench className="w-8 h-8" />,
    gradient: 'from-gray-400 via-gray-500 to-gray-600',
    description: 'Perfect for beginners',
    winMultiplier: 1.5,
    lossMultiplier: 0.8
  },
  {
    id: 'gold',
    name: 'Gold',
    amount: 250,
    icon: <Crown className="w-8 h-8" />,
    gradient: 'from-yellow-400 via-orange-500 to-red-600',
    description: 'Balanced risk and reward',
    winMultiplier: 1.5,
    lossMultiplier: 0.8
  },
  {
    id: 'diamond',
    name: 'Diamond',
    amount: 500,
    icon: <Diamond className="w-8 h-8" />,
    gradient: 'from-blue-400 via-purple-500 to-pink-600',
    description: 'Premium gaming experience',
    winMultiplier: 1.5,
    lossMultiplier: 0.8
  },
  {
    id: 'uranium',
    name: 'Uranium',
    amount: 1000,
    icon: <Zap className="w-8 h-8" />,
    gradient: 'from-green-400 via-emerald-500 to-teal-600',
    description: 'High stakes, high rewards',
    winMultiplier: 1.5,
    lossMultiplier: 0.8
  },
  {
    id: 'platinum',
    name: 'Platinum',
    amount: 2000,
    icon: <Star className="w-8 h-8" />,
    gradient: 'from-indigo-400 via-purple-500 to-pink-600',
    description: 'Elite level gaming',
    winMultiplier: 1.5,
    lossMultiplier: 0.8
  },
  {
    id: 'ruby',
    name: 'Ruby',
    amount: 5000,
    icon: <Gem className="w-8 h-8" />,
    gradient: 'from-red-400 via-pink-500 to-purple-600',
    description: 'Ultimate high roller experience',
    winMultiplier: 1.5,
    lossMultiplier: 0.8
  }
];

interface GameCategoriesProps {
  onSelectCategory: (category: GameCategory) => void;
  userBalance: number;
}

const GameCategories: React.FC<GameCategoriesProps> = ({ onSelectCategory, userBalance }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-6">
      {categories.map((category, index) => {
        const canAfford = userBalance >= category.amount;
        
        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={canAfford ? { scale: 1.05, y: -8 } : {}}
            whileTap={canAfford ? { scale: 0.95 } : {}}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${category.gradient} p-8 cursor-pointer shadow-2xl border border-white/20 backdrop-blur-sm ${
              !canAfford ? 'opacity-60' : ''
            }`}
            onClick={() => canAfford && onSelectCategory(category)}
          >
            {/* Animated background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 pointer-events-none" />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-white drop-shadow-lg">
                  {category.icon}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white drop-shadow-lg">
                    ₹{category.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-white/90 font-medium">Entry Fee</div>
                </div>
              </div>
              
              {/* Title and Description */}
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                  {category.name}
                </h3>
                <p className="text-white/90 text-base font-medium">
                  {category.description}
                </p>
              </div>
              
              {/* Game Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-white/90 font-medium">
                    <Users className="w-4 h-4" />
                    <span>Max 10 players</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 font-medium">
                    <TrendingUp className="w-4 h-4" />
                    <span>10% win chance</span>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-green-300">Win:</span>
                    <span className="text-green-300">
                      ₹{(category.amount * category.winMultiplier).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium mt-1">
                    <span className="text-orange-300">Lose:</span>
                    <span className="text-orange-300">
                      ₹{(category.amount * category.lossMultiplier).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Play Button */}
              <motion.div 
                className="mt-6"
                whileHover={canAfford ? { scale: 1.02 } : {}}
              >
                <div className={`text-center py-4 px-6 rounded-xl font-bold text-lg border-2 transition-all ${
                  canAfford 
                    ? 'bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50' 
                    : 'bg-black/30 border-red-500/50 text-red-300'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    <span>
                      {canAfford ? 'PLAY NOW' : 'INSUFFICIENT BALANCE'}
                    </span>
                  </div>
                  {!canAfford && (
                    <div className="text-xs mt-1 text-red-300/80">
                      Need ₹{(category.amount - userBalance).toLocaleString()} more
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
            
            {/* Overlay for insufficient balance */}
            {!canAfford && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 rounded-3xl">
                <div className="text-center">
                  <div className="text-white font-bold text-xl mb-2">Insufficient Balance</div>
                  <div className="text-white/80 text-sm">
                    Add ₹{(category.amount - userBalance).toLocaleString()} to play
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default GameCategories;