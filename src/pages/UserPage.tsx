import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUserData } from "../hooks/useUserData";
import Dashboard from "../components/Dashboard";
import GameCategories from "../components/GameCategories";
import SecureCoinFlip from "../components/SecureCoinFlip";
import SecureWallet from "../components/SecureWallet";
import { motion } from "framer-motion";
import { LogOut, Wallet, Trophy, History, User, Settings, Home, Play, CreditCard, Shield, Bell, Star, TrendingUp, Users, GamepadIcon } from "lucide-react";
import { signOut } from "../lib/supabase";
import TransactionHistory from "../components/dashboard/TransactionHistory";
import toast from "react-hot-toast";

const UserPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { userData, loading: userLoading, refetch } = useUserData(user?.id);
  const [activeTab, setActiveTab] = useState<'home' | 'games' | 'wallet' | 'history' | 'settings' | 'coin-flip'>('home');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleSelectCategory = (category: any) => {
    if (!userData || userData.wallet_balance < category.amount) {
      toast.error("Insufficient balance! Please add money to your wallet.");
      setActiveTab('wallet');
      return;
    }
    navigate(`/play/${category.id}?amount=${category.amount}&category=${category.name}`);
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
    { id: 'home', label: 'Home', icon: Home, color: 'from-blue-500 to-cyan-500' },
    { id: 'games', label: 'Play Games', icon: Trophy, color: 'from-purple-500 to-pink-500' },
    { id: 'coin-flip', label: 'Coin Flip', icon: Star, color: 'from-yellow-500 to-orange-500' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, color: 'from-green-500 to-emerald-500' },
    { id: 'history', label: 'History', icon: History, color: 'from-orange-500 to-red-500' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'from-gray-500 to-slate-600' }
  ];

  const isAdmin = user?.email?.includes('admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <GamepadIcon className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold text-white"
                >
                  Coin Flip Fortune
                </motion.h1>
                <p className="text-white/60 text-sm">Ultimate Gaming Experience</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Wallet Balance */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-full px-4 py-2 border border-green-500/30"
              >
                <Wallet className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">
                  ₹{userData.wallet_balance.toLocaleString()}
                </span>
              </motion.div>

              {/* Quick Actions */}
              <div className="hidden md:flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('coin-flip')}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-sm font-medium">Play</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('wallet')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/30"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">Wallet</span>
                </motion.button>
                
                {isAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Admin</span>
                  </motion.button>
                )}
              </div>
              
              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-white/80">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-white">
                      {userData.email?.split('@')[0] || 'Player'}
                    </div>
                    <div className="text-xs text-white/60">
                      {isAdmin ? 'Administrator' : 'Player'}
                    </div>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block text-sm font-medium">Sign Out</span>
                </motion.button>
              </div>
            </div>
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
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all whitespace-nowrap shadow-lg border ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg border-white/20`
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border-white/10'
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
              {/* Welcome Section */}
              <div className="text-center mb-8">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent"
                >
                  Welcome Back, {userData.email?.split('@')[0] || 'Player'}!
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80 text-xl"
                >
                  Ready to test your luck? Choose your adventure below!
                </motion.p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                    <TrendingUp className="w-8 h-8 text-blue-400" />
                    <h3 className="text-white font-semibold">Win Rate</h3>
                  </div>
                  <div className="text-3xl font-bold text-blue-400">0%</div>
                  <p className="text-blue-300/80 text-sm mt-1">Success ratio</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Star className="w-8 h-8 text-yellow-400" />
                    <h3 className="text-white font-semibold">Total Winnings</h3>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">₹0</div>
                  <p className="text-yellow-300/80 text-sm mt-1">Lifetime earnings</p>
                </motion.div>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('coin-flip')}
                  className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 hover:border-purple-400/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                      <Play className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-white mb-2">Play Coin Flip</h3>
                      <p className="text-white/70">Secure coin flip game with provably fair results!</p>
                    </div>
                  </div>
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.02, y: -5 }}
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
                  className="text-4xl font-bold text-white mb-4"
                >
                  Multi-Player Games
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80 text-lg"
                >
                  Join other players in exciting multiplayer games!
                </motion.p>
              </div>
              <GameCategories
                onSelectCategory={handleSelectCategory}
                userBalance={userData.wallet_balance}
              />
            </div>
          )}

          {activeTab === 'coin-flip' && (
            <div>
              <div className="text-center mb-8">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold text-white mb-4"
                >
                  Secure Coin Flip
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80 text-lg"
                >
                  Provably fair coin flip game with server-side logic
                </motion.p>
              </div>
              <SecureCoinFlip />
            </div>
          )}

          {activeTab === 'wallet' && (
            <div>
              <div className="text-center mb-8">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold text-white mb-4"
                >
                  Wallet Dashboard
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80 text-lg"
                >
                  Buy coins and manage your secure wallet
                </motion.p>
              </div>
              <SecureWallet />
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="text-center mb-8">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold text-white mb-4"
                >
                  Game History
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80 text-lg"
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
                  className="text-4xl font-bold text-white mb-4"
                >
                  Account Settings
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80 text-lg"
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