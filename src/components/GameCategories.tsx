import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Diamond, Wrench, Star, Crown, Gem } from 'lucide-react';

interface GameCategory {
  id: string;
  name: string;
  amount: number;
  icon: React.ReactNode;
  gradient: string;
  description: string;
}

const categories: GameCategory[] = [
  {
    id: 'uranium',
    name: 'Uranium',
    amount: 1000,
    icon: <Zap className="w-8 h-8" />,
    gradient: 'from-green-400 via-emerald-500 to-teal-600 shadow-green-500/25',
    description: 'High stakes, high rewards'
  },
  {
    id: 'diamond',
    name: 'Diamond',
    amount: 500,
    icon: <Diamond className="w-8 h-8" />,
    gradient: 'from-blue-400 via-purple-500 to-pink-600 shadow-purple-500/25',
    description: 'Premium gaming experience'
  },
  {
    id: 'iron',
    name: 'Iron',
    amount: 100,
    icon: <Wrench className="w-8 h-8" />,
    gradient: 'from-gray-400 via-gray-500 to-gray-600 shadow-gray-500/25',
    description: 'Perfect for beginners'
  },
  {
    id: 'platinum',
    name: 'Platinum',
    amount: 2000,
    icon: <Star className="w-8 h-8" />,
    gradient: 'from-indigo-400 via-purple-500 to-pink-600 shadow-indigo-500/25',
    description: 'Elite level gaming'
  },
  {
    id: 'gold',
    name: 'Gold',
    amount: 250,
    icon: <Crown className="w-8 h-8" />,
    gradient: 'from-yellow-400 via-orange-500 to-red-600 shadow-yellow-500/25',
    description: 'Balanced risk and reward'
  },
  {
    id: 'ruby',
    name: 'Ruby',
    amount: 5000,
    icon: <Gem className="w-8 h-8" />,
    gradient: 'from-red-400 via-pink-500 to-purple-600 shadow-red-500/25',
    description: 'Ultimate high roller experience'
  }
];

interface GameCategoriesProps {
  onSelectCategory: (category: GameCategory) => void;
  userBalance: number;
}

const GameCategories: React.FC<GameCategoriesProps> = ({ onSelectCategory, userBalance }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {categories.map((category, index) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ scale: 1.05, y: -8 }}
          whileTap={{ scale: 0.95 }}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.gradient} p-6 cursor-pointer shadow-2xl border border-white/20 backdrop-blur-sm`}
          onClick={() => userBalance >= category.amount && onSelectCategory(category)}
        >
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white drop-shadow-lg">
                {category.icon}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white drop-shadow-lg">₹{category.amount.toLocaleString()}</div>
                <div className="text-sm text-white/90 font-medium">Entry Fee</div>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">{category.name}</h3>
            <p className="text-white/90 text-sm mb-4 font-medium">{category.description}</p>
            
            <div className="flex justify-between items-center text-sm">
              <div className="text-white/90 font-medium">
                Max 10 players
              </div>
              <div className="text-white/90 font-medium">
                Win: ₹{(category.amount * 1.5).toLocaleString()}
              </div>
            </div>
            
            {/* Play button */}
            <motion.div 
              className="mt-4 pt-4 border-t border-white/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-center">
                <span className="text-white font-bold text-lg">
                  {userBalance >= category.amount ? 'PLAY NOW' : 'INSUFFICIENT BALANCE'}
                </span>
              </div>
            </motion.div>
          </div>
          
          {userBalance < category.amount && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
              <div className="text-center">
                <div className="text-white font-bold text-lg mb-2">Insufficient Balance</div>
                <div className="text-white/80 text-sm">Need ₹{(category.amount - userBalance).toLocaleString()} more</div>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default GameCategories;