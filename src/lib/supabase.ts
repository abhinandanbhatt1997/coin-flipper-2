// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Environment variables - use local development setup if not configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('Supabase URL:', supabaseUrl ? 'Loaded' : 'Missing');
console.log('Supabase Key:', supabaseAnonKey ? 'Loaded' : 'Missing');

// Create Supabase client with enhanced auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,     // Keep user logged in after page reload
    autoRefreshToken: true,   // Automatically refresh tokens
    detectSessionInUrl: true, // Handle OAuth redirects
    flowType: 'pkce'         // Use PKCE flow for better security
  }
});

// Enhanced auth helpers with better error handling
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Email sign-in error:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/user`
      }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Email sign-up error:', error);
    throw error;
  }
};

export const signInWithOTP = async (identifier: string, isEmail: boolean = false) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      [isEmail ? 'email' : 'phone']: identifier,
      options: {
        emailRedirectTo: `${window.location.origin}/user`
      }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('OTP sign-in error:', error);
    throw error;
  }
};

export const verifyOTP = async (identifier: string, token: string, isEmail: boolean = false) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      [isEmail ? 'email' : 'phone']: identifier,
      token,
      type: isEmail ? 'email' : 'sms'
    });
    
    if (error) throw error;
    return { data, error: null };
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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/user`
      }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }

}