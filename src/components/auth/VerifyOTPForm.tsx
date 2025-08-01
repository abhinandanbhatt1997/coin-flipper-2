import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import { verifyOTP } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface VerifyOTPFormProps {
  identifier: string;
  isEmail: boolean;
  onSuccess: () => void;
  onBack: () => void;
}

const VerifyOTPForm: React.FC<VerifyOTPFormProps> = ({ 
  identifier, 
  isEmail, 
  onSuccess, 
  onBack 
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Shield className="w-8 h-8 text-white" />
        </motion.div>
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
          onClick={onBack}
          className="w-full text-purple-300 hover:text-purple-200 font-medium"
        >
          ← Back to login
        </button>
      </form>
    </motion.div>
  );
};

export default VerifyOTPForm;