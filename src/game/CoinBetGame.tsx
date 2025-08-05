import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const CoinBetGame: React.FC = () => {
  const [entryFee, setEntryFee] = useState(10);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const navigate = useNavigate();

  const handleStartGame = async () => {
    try {
      const { data, error } = await supabase.from('games').insert([
        {
          entry_fee: entryFee,
          max_players: maxPlayers,
          current_players: 1,
          status: 'waiting',
        },
      ]).select(); // ✅ include select() to get inserted row

      if (error) throw error;

      const gameId = data?.[0]?.id;
      console.log('Game created:', gameId);

      if (gameId) {
        navigate(`/lobby/${gameId}`); // ✅ navigate to game lobby
      } else {
        console.error("No game ID returned");
      }

    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };  
  return (
    <div className="bg-white/5 rounded-lg p-4 mt-4">
      <div className="flex flex-col gap-3">
        {/* Entry Fee Input */}
        <label className="text-white">
          Entry Fee:
          <input
            type="number"
            value={entryFee}
            onChange={(e) => setEntryFee(Number(e.target.value))}
            className="ml-2 px-2 py-1 rounded bg-white/10 text-white"
            min={1}
          />
        </label>

        {/* Max Players Input */}
        <label className="text-white">
          Max Players:
          <input
            type="number"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="ml-2 px-2 py-1 rounded bg-white/10 text-white"
            min={2}
            max={10}
          />
        </label>

        {/* Start Game Button */}
        <button
          onClick={handleStartGame}
          className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

export default CoinBetGame;
