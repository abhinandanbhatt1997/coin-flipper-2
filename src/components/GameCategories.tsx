import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Diamond, Wrench } from 'lucide-react';

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
    gradient: 'from-green-400 via-emerald-500 to-teal-600',
    description: 'High stakes, high rewards'
  },
  {
    id: 'diamond',
    name: 'Diamond',
    amount: 500,
    icon: <Diamond className="w-8 h-8" />,
    gradient: 'from-blue-400 via-purple-500 to-pink-600',
    description: 'Premium gaming experience'
  },
  {
    id: 'iron',
    name: 'Iron',
    amount: 100,
    icon: <Wrench className="w-8 h-8" />,
    gradient: 'from-gray-400 via-gray-500 to-gray-600',
    description: 'Perfect for beginners'
  }
];

interface GameCategoriesProps {
  onSelectCategory: (category: GameCategory) => void;
  userBalance: number;
}

const GameCategories: React.FC<GameCategoriesProps> = ({ onSelectCategory, userBalance }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {categories.map((category, index) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.gradient} p-6 cursor-pointer shadow-2xl`}
          onClick={() => userBalance >= category.amount && onSelectCategory(category)}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white">
                {category.icon}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">₹{category.amount}</div>
                <div className="text-sm text-white/80">Entry Fee</div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
            <p className="text-white/90 text-sm mb-4">{category.description}</p>
            
            <div className="flex justify-between items-center">
              <div className="text-white/80 text-xs">
                Max 10 players
              </div>
              <div className="text-white/80 text-xs">
                Winner: {(category.amount * 1.5).toLocaleString()}₹
              </div>
            </div>
          </div>
          
          {userBalance < category.amount && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <div className="text-white font-semibold">Insufficient Balance</div>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        </motion.div>
      ))}
    </div>
  );
};

export default GameCategories;