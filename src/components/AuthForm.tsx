import React from "react";
import { supabase } from "../lib/supabase";

export const AuthForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      console.error("Google login error:", error.message);
    } else {
      onSuccess(); // callback after successful login
    }
  };

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl mb-4">Login</h2>
      <button
        onClick={handleGoogleSignIn}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Login with Google
      </button>
    </div>
  );
};
