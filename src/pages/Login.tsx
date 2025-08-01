import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthForm } from "../components/AuthForm";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!loading && user && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate("/user");
    }
  }, [user, loading, navigate]);

  const handleAuthSuccess = () => {
    navigate("/user");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return <AuthForm onSuccess={handleAuthSuccess} />;
};

export default Login;
