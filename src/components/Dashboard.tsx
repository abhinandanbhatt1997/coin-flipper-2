import React from "react";
import { motion } from "framer-motion";
import WalletCard from "./dashboard/WalletCard";
import GameCard from "./dashboard/GameCard";
import GameHistory from "./dashboard/GameHistory";
import StatsCard from "./dashboard/StatsCard";

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <StatsCard />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <WalletCard />
        <GameCard />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GameHistory />
      </motion.div>
    </div>
  );
};

export default Dashboard;