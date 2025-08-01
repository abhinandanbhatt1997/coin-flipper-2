// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Environment variables with fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl ? 'Loaded' : 'Missing');
console.log('Supabase Key:', supabaseAnonKey ? 'Loaded' : 'Missing');

// Create Supabase client with enhanced auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,     // Keep user logged in after page reload
    autoRefreshToken: true,   // Automatically refresh tokens
    detectSessionInUrl: true, // Handle OAuth redirects
  }
});

// Auth helpers
export const signInWithOTP = async (identifier: string, isEmail: boolean = false) => {
  try {
    return await supabase.auth.signInWithOtp({
      [isEmail ? 'email' : 'phone']: identifier
    });
  } catch (error) {
    console.error('OTP sign-in error:', error);
    throw error;
  }
};

export const verifyOTP = async (identifier: string, token: string, isEmail: boolean = false) => {
  try {
    return await supabase.auth.verifyOtp({
      [isEmail ? 'email' : 'phone']: identifier,
      token,
      type: isEmail ? 'email' : 'sms'
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/user`
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};
