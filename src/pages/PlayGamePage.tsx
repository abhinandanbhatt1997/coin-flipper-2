import React, { useState } from "react";
import CoinFlipGame from "../components/CoinFlipGame";

const dummyPlayers = [
  { id: "1", name: "Abhinandan", avatar: "" },
  { id: "2", name: "Bot", avatar: "" },
  { id: "3", name: "Player3", avatar: "" },
  { id: "4", name: "Player4", avatar: "" },
  { id: "5", name: "Player5", avatar: "" },
];

const PlayGamePage: React.FC = () => {
  const [gameComplete, setGameComplete] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const [payout, setPayout] = useState<number>(0);

  const handleGameComplete = (winner: any, payout: number) => {
    setWinner(winner);
    setPayout(payout);
    setGameComplete(true);
  };

  const handleLeaveGame = () => {
    setGameComplete(false);
    setWinner(null);
    setPayout(0);
    // Refresh game or navigate if needed
  };

  const fakeGameState = {
    id: "demo-1",
    category: "Demo",
    entryFee: 100,
    players: dummyPlayers,
    maxPlayers: 5,
    status: gameComplete ? "completed" : "waiting",
    winner: winner || undefined,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <CoinFlipGame
        gameState={fakeGameState}
        onGameComplete={handleGameComplete}
        onLeaveGame={handleLeaveGame}
      />
    </div>
  );
};

export default PlayGamePage;
