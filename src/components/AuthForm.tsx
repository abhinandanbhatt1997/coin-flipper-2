import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

type Tab = "login" | "signup" | "otp";

export const AuthForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Logged in successfully");
      onSuccess?.();
      navigate("/user");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast.success("Signup successful. Check your email.");
      setTab("login");
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "magiclink" });
      if (error) throw error;
      toast.success("OTP login successful");
      onSuccess?.();
      navigate("/user");
    } catch (error: any) {
      toast.error(error.message || "OTP login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast.success("OTP sent to email");
      setTab("otp");
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "http://localhost:5173/user", // ⚠️ Change this to your production URL when deploying
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 bg-white rounded-xl shadow-md space-y-4 text-black">
      <div className="flex justify-between mb-4">
        <button onClick={() => setTab("login")} className={`px-4 py-2 rounded ${tab === "login" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
          Login
        </button>
        <button onClick={() => setTab("signup")} className={`px-4 py-2 rounded ${tab === "signup" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
          Signup
        </button>
        <button onClick={() => setTab("otp")} className={`px-4 py-2 rounded ${tab === "otp" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
          OTP
        </button>
      </div>

      <input
        className="w-full border border-gray-300 rounded px-3 py-2"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {(tab === "login" || tab === "signup") && (
        <div className="relative">
          <input
            className="w-full border border-gray-300 rounded px-3 py-2"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-sm text-blue-600"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      )}

      {tab === "otp" && (
        <input
          className="w-full border border-gray-300 rounded px-3 py-2"
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
      )}

      <button
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={
          tab === "login"
            ? handleEmailLogin
            : tab === "signup"
            ? handleEmailSignup
            : handleOtpLogin
        }
        disabled={loading}
      >
        {loading ? "Please wait..." : tab === "login" ? "Login" : tab === "signup" ? "Signup" : "Verify OTP"}
      </button>

      {tab === "otp" && (
        <button
          className="w-full mt-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          onClick={handleSendOtp}
          disabled={loading}
        >
          Send OTP
        </button>
      )}

      <hr className="my-4" />

      <button
        className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        Continue with Google
      </button>
    </div>
  );
};
