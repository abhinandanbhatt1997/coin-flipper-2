import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const GameLobby: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [players, setPlayers] = useState<number | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("waiting");
  const [validGame, setValidGame] = useState<boolean>(true);
  const [joining, setJoining] = useState<boolean>(false);
  const [joined, setJoined] = useState<boolean>(false);

  useEffect(() => {
    if (!id || typeof id !== "string" || id.length !== 36) {
      console.error("Invalid game ID in URL:", id);
      setValidGame(false);
      return;
    }

    const gameId = id;
    console.log("Mounting GameLobby for ID:", gameId);

    const fetchGame = async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (error || !data) {
        console.error("Game not found or fetch error:", error?.message);
        setValidGame(false);
        return;
      }

      setPlayers(data.current_players);
      setMaxPlayers(data.max_players);
      setStatus(data.status);
    };

    fetchGame();

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games" },
        (payload) => {
          const updated = payload.new;
          if (updated.id !== gameId) return;

          console.log("Game updated via channel:", updated);

          setPlayers(updated.current_players);
          setStatus(updated.status);

          if (updated.current_players >= updated.max_players) {
            console.log("Max players reached. Redirecting to game room...");
            navigate(`/game/${gameId}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, navigate]);

  const handleJoinGame = async () => {
    if (!id || joining || joined) return;
    const gameId = id;

    setJoining(true);

    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      alert("Game not found");
      setJoining(false);
      return;
    }

    if (game.status !== "waiting") {
      alert("Game already started or finished");
      setJoining(false);
      return;
    }

    if (game.current_players >= game.max_players) {
      alert("Game is full");
      setJoining(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("User not authenticated");
      setJoining(false);
      return;
    }

    const userId = user.id;

    const { data: userRow, error: walletError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    const entryFee = game.entry_fee;

    if (walletError || !userRow || userRow.wallet_balance < entryFee) {
      alert("Insufficient wallet balance");
      setJoining(false);
      return;
    }

    const { error: txError } = await supabase.rpc("join_game_transaction", {
      game_id_input: gameId,
      user_id_input: userId,
      entry_fee_input: entryFee,
    });

    if (txError) {
      if (txError.code === "23505") {
        console.warn("User already in game. Redirecting...");
        setJoined(true);
        navigate(`/game/${gameId}`);
      } else {
        console.error(txError);
        alert("Error joining game");
      }
      setJoining(false);
      return;
    }

    console.log("Successfully joined game. Redirecting...");
    setJoined(true);
    navigate(`/game/${gameId}`);
  };

  if (!validGame) {
    return (
      <div className="h-screen flex items-center justify-center text-white bg-black/90">
        <h1 className="text-xl">Invalid Game ID</h1>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center text-white bg-black/90">
      <h1 className="text-3xl font-bold mb-4">Game Lobby</h1>
      <p className="mb-2">Game ID: {id}</p>
      <p className="mb-2">
        Players Joined: {players !== null ? players : "Loading..."} /{" "}
        {maxPlayers !== null ? maxPlayers : "Loading..."}
      </p>
      <p className="mb-2">Status: {status}</p>

      {status === "waiting" && (
        <button
          onClick={handleJoinGame}
          disabled={joining || joined}
          className={`mt-4 px-6 py-2 font-bold rounded-xl ${
            joining || joined
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {joining ? "Joining..." : joined ? "Already Joined" : "Join Game"}
        </button>
      )}
    </div>
  );
};

export default GameLobby;
