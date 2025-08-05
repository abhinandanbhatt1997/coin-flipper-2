import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

interface GameState {
  id: string;
  status: string;
  entry_fee: number;
  max_players: number;
  current_players: number;
  winner_id: string | null;
  players: { user_id: string }[];
}

const CoinFlipGame: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const gameId = new URLSearchParams(location.search).get("id");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!gameId) return;

    const fetchGameState = async () => {
      const { data: game, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      const { data: participants } = await supabase
        .from("game_participants")
        .select("user_id")
        .eq("game_id", gameId);

      if (game) {
        setGameState({ ...game, players: participants || [] });
      }
    };

    fetchGameState();

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games" },
        (payload) => {
          const updated = payload.new;
          setGameState((prev) =>
            prev ? { ...prev, ...updated } : { ...updated, players: [] }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const startCoinFlip = async () => {
    if (!gameId || !userId || !gameState || gameState.status !== "waiting") return;

    setIsFlipping(true);
    setTimeout(async () => {
      const winner = gameState.players[Math.floor(Math.random() * gameState.players.length)];

      await supabase
        .from("games")
        .update({ status: "completed", winner_id: winner.user_id })
        .eq("id", gameId);

      await Promise.all(
        gameState.players.map((p) => {
          const isWinner = p.user_id === winner.user_id;
          return supabase.from("game_participants").update({
            amount_won: isWinner
              ? gameState.entry_fee * 1.5
              : gameState.entry_fee * 0.8,
            is_winner: isWinner,
          })
          .eq("user_id", p.user_id)
          .eq("game_id", gameId);
        })
      );

      setShowResult(true);
      setIsFlipping(false);
    }, 3000);
  };

  useEffect(() => {
    if (
      gameState &&
      gameState.players.length >= 1 && // FOR DEMO MODE
      gameState.status === "waiting"
    ) {
      startCoinFlip();
    }
  }, [gameState]);

  if (!gameState || !userId) return <div className="text-white">Loading game...</div>;

  const isWinner = userId === gameState.winner_id;

  return (
    <div className="h-screen flex flex-col items-center justify-center text-white bg-gradient-to-br from-black to-gray-900">
      <h1 className="text-3xl font-bold mb-4">Coin Flip Game</h1>
      <p className="mb-2">Game ID: {gameId}</p>
      <p className="mb-2">Players Joined: {gameState.players.length}</p>
      <p className="mb-2">Status: {gameState.status}</p>

      {isFlipping && <p className="mt-6 animate-pulse text-yellow-300">Flipping coin...</p>}

      {!isFlipping && !showResult && gameState.status === "waiting" && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => startCoinFlip()}
          className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold"
        >
          Start Game Now
        </motion.button>
      )}

      {showResult && (
        <div className="mt-6 text-center">
          <h2 className="text-2xl font-bold">
            {isWinner ? "🎉 You won!" : "😢 You lost!"}
          </h2>
          <button
            onClick={() => navigate("/user")}
            className="mt-4 px-4 py-2 bg-white text-black rounded"
          >
            Go to Dashboard
          </button>
        </div>
      )}

      <button
        onClick={() => navigate("/user")}
        className="mt-10 px-4 py-2 border border-white rounded"
      >
        Leave Game
      </button>
    </div>
  );
};

export default CoinFlipGame;
