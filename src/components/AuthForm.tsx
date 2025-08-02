import React from "react";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button"; // or use a plain button

export const AuthForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      console.error("Google login error:", error.message);
    } else {
      onSuccess(); // Navigate to dashboard on success
    }
  };

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl mb-4">Login</h2>
      <Button onClick={handleGoogleSignIn}>Login with Google</Button>
    </div>
  );
};
