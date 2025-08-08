import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { useEffect } from "react";
import { supabase } from "./lib/supabase";

import Login from "./pages/Login";
import UserPage from "./pages/UserPage";
import GameRoom from "./pages/GameRoom";
import PaymentsPage from "./pages/PaymentsPage";
import GameLobby from "./game/GameLobby";
import PlayGamePage from "./pages/PlayGamePage"; // ✅ Import PlayGamePage
import AdminPage from "./pages/AdminPage";
import SecureCoinFlip from "./components/SecureCoinFlip";
import CoinFlipGame from "./components/CoinFlipGame";

function App() {
  useEffect(() => {
    // Handle OAuth redirect callback
    const exchangeSession = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession();
      if (error) {
        console.error("OAuth callback error:", error.message);
      } else {
        console.log("OAuth session:", data?.session);
      }
    };

    if (window.location.href.includes('code=') && window.location.href.includes('state=')) {
      exchangeSession();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);
      console.log("Session:", session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/game/:id" element={<GameRoom />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/lobby/:id" element={<GameLobby />} />
          <Route path="/play/:id" element={<PlayGamePage />} /> {/* ✅ FIXED: route now accepts :id */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/coin-flip" element={<SecureCoinFlip />} />
          <Route path="/create-game" element={<CoinFlipGame />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      />
    </>
  );
}

export default App;
