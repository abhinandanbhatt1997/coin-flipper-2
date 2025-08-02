import React, { useState } from 'react';
import { signInWithOTP, verifyOTP, signInWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Phone, Mail, ArrowRight, Shield, Chrome, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import CoinAnimation from './CoinAnimation';

interface AuthFormProps {
  onSuccess: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'input' | 'verify' | 'signup'>('input');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isEmail, setIsEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'otp'>('signin');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (authMode === 'signup') {
        result = await signUpWithEmail(identifier, password);
        if (result.data?.user && !result.data?.session) {
          toast.success('Please check your email to confirm your account');
          setAuthMode('signin');
          return;
        }
      } else {
        result = await signInWithEmail(identifier, password);
      }

      if (result.error) throw result.error;
      
      toast.success('Login successful!');
      onSuccess();
    } catch (error: any) {
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else if (error.message?.includes('User not found')) {
        toast.error('No account found with this email. Please sign up first.');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Please enter your phone number or email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithOTP(identifier, isEmail);
      if (error) throw error;

      toast.success(`OTP sent to your ${isEmail ? 'email' : 'phone'}`);
      setStep('verify');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const { error } = await verifyOTP(identifier, otp, isEmail);
      if (error) throw error;

      toast.success('Login successful!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;

      toast.success('Login successful!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification Step
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
        <CoinAnimation />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div> {/* FIXED closing tag */}
            <h1 className="text-2xl font-bold text-white mb-2">Verify OTP</h1>
            <p className="text-white/80">
              Enter the OTP sent to your {isEmail ? 'email' : 'phone'}
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-lg font-mono text-white placeholder-white/60"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setStep('input')}
              className="w-full text-purple-300 hover:text-purple-200 font-medium"
            >
              ← Back to login
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Login Step
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      <CoinAnimation />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
          >
            Coin Flip Fortune
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/80 text-lg"
          >
            Flip your way to fortune!
          </motion.p>
        </div>

        {/* Google Sign In */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-3 mb-6"
        >
          <Chrome className="w-5 h-5" />
          Continue with Google
        </motion.button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-white/60">Or continue with</span>
          </div>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex mb-6 bg-white/10 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              authMode === 'signin' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60'
            }`}
          >
            <Mail className="w-4 h-4" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              authMode === 'signup' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('otp')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              authMode === 'otp' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60'
            }`}
          >
            <Phone className="w-4 h-4" />
            OTP
          </button>
        </div>

        {/* Email/Password Form */}
        {(authMode === 'signin' || authMode === 'signup') && (
          <form onSubmit={handleEmailAuth} className="space-y-6">
            <div>
              <input
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-white/60"
                required
              />
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-white/60 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (authMode === 'signup' ? 'Creating Account...' : 'Signing In...') : (authMode === 'signup' ? 'Create Account' : 'Sign In')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        {/* OTP Form */}
        {authMode === 'otp' && (
          <>
            {/* Phone or Email toggle for OTP */}
            <div className="flex mb-4 bg-white/10 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setIsEmail(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  !isEmail ? 'bg-white/20 text-white shadow-sm' : 'text-white/60'
                }`}
              >
                <Phone className="w-4 h-4" />
                Phone
              </button>
              <button
                type="button"
                onClick={() => setIsEmail(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isEmail ? 'bg-white/20 text-white shadow-sm' : 'text-white/60'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <input
                  type={isEmail ? 'email' : 'tel'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={isEmail ? 'Enter your email' : 'Enter your phone number'}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-white/60"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2"
              >
                {loading ? 'Sending...' : 'Send OTP'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-white/20">
          <p className="text-xs text-white/60 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
