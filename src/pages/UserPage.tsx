import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUserData } from "../hooks/useUserData";
import Dashboard from "../components/Dashboard";
import GameCategories from "../components/GameCategories";
import { motion } from "framer-motion";
import { LogOut, Wallet, Trophy, History, User, Settings, Home, Play, CreditCard, Shield } from "lucide-react";
import { signOut } from "../lib/supabase";
import TransactionHistory from "../components/dashboard/TransactionHistory";
import toast from "react-hot-toast";

const UserPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { userData, loading: userLoading, refetch } = useUserData(user?.id);
  const [activeTab, setActiveTab] = useState<'home' | 'games' | 'wallet' | 'history' | 'settings'>('home');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleSelectCategory = (category: any) => {
    if (!userData || userData.wallet_balance < category.amount) {
      toast.error("Insufficient balance!");
      return;
    }
    navigate(`/game?category=${category.name}&amount=${category.amount}`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  if (authLoading || userLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }} 
          className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full" 
        />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Account Setup Required</h2>
          <p className="mb-4">Please complete your account setup.</p>
          <button 
            onClick={() => navigate("/login")} 
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'games', label: 'Play Games', icon: Trophy },
    { id: 'wallet', label: 'Dashboard', icon: Wallet },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent"
            >
              Coin Flip Fortune
            </motion.h1>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Wallet className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">
                ₹{userData.wallet_balance.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quick Action Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('games')}
                className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span className="text-sm">Play</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('wallet')}
                className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">Wallet</span>
              </motion.button>
              
              {user?.email?.includes('admin') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Admin</span>
                </motion.button>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="hidden sm:block">
                {userData.email?.split('@')[0] || 'Player'}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign Out</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap shadow-lg ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/25'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'home' && (
            <div>
              <div className="text-center mb-8">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent"
                >
                  Welcome Back, {userData.email?.split('@')[0] || 'Player'}!
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80 text-lg"
                >
                  Ready to test your luck? Choose your adventure below!
                </motion.p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Wallet className="w-8 h-8 text-green-400" />
                    <h3 className="text-white font-semibold">Wallet Balance</h3>
                  </div>
                  <div className="text-3xl font-bold text-green-400">
                    ₹{userData.wallet_balance.toLocaleString()}
                  </div>
                  <p className="text-green-300/80 text-sm mt-1">Available to play</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Trophy className="w-8 h-8 text-purple-400" />
                    <h3 className="text-white font-semibold">Games Played</h3>
                  </div>
                  <div className="text-3xl font-bold text-purple-400">0</div>
                  <p className="text-purple-300/80 text-sm mt-1">Total rounds</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <History className="w-8 h-8 text-blue-400" />
                    <h3 className="text-white font-semibold">Win Rate</h3>
                  </div>
                  <div className="text-3xl font-bold text-blue-400">0%</div>
                  <p className="text-blue-300/80 text-sm mt-1">Success ratio</p>
                </motion.div>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('games')}
                  className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 hover:border-purple-400/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                      <Play className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-white mb-2">Start Playing</h3>
                      <p className="text-white/70">Choose your game category and test your luck!</p>
                    </div>
                  </div>
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('wallet')}
                  className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30 hover:border-green-400/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <CreditCard className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-white mb-2">Manage Wallet</h3>
                      <p className="text-white/70">Add funds, withdraw winnings, view transactions</p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </div>
          )}
          
          {activeTab === 'games' && (
            <div>
              <div className="text-center mb-8">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Choose Your Game
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80"
                >
                  Select a category and test your luck!
                </motion.p>
              </div>
              <GameCategories
                onSelectCategory={handleSelectCategory}
                userBalance={userData.wallet_balance}
              />
            </div>
          )}

          {activeTab === 'wallet' && (
            <div>
              <div className="text-center mb-8">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Dashboard
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80"
                >
                  Manage your wallet and view active games
                </motion.p>
              </div>
              <Dashboard />
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="text-center mb-8">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Game History
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80"
                >
                  Track your wins, losses, and statistics
                </motion.p>
              </div>
              <div className="max-w-4xl mx-auto mt-6">
                <TransactionHistory userId={user.id} />
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div>
              <div className="text-center mb-8">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Account Settings
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80"
                >
                  Manage your account preferences and security
                </motion.p>
              </div>
              
              <div className="max-w-2xl mx-auto space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
                >
                  <h3 className="text-xl font-bold text-white mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={userData.email || ''}
                        disabled
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white/60 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Phone</label>
                      <input
                        type="tel"
                        value={userData.phone || ''}
                        placeholder="Add your phone number"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
                >
                  <h3 className="text-xl font-bold text-white mb-4">Security</h3>
                  <div className="space-y-4">
                    <button className="w-full text-left p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Change Password</div>
                          <div className="text-white/60 text-sm">Update your account password</div>
                        </div>
                        <div className="text-white/40">→</div>
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Two-Factor Authentication</div>
                          <div className="text-white/60 text-sm">Add an extra layer of security</div>
                        </div>
                        <div className="text-white/40">→</div>
                      </div>
                    </button>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
                >
                  <h3 className="text-xl font-bold text-white mb-4">Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Email Notifications</div>
                        <div className="text-white/60 text-sm">Receive game updates via email</div>
                      </div>
                      <button className="w-12 h-6 bg-purple-500 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Sound Effects</div>
                        <div className="text-white/60 text-sm">Play sounds during games</div>
                      </div>
                      <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default UserPage;

