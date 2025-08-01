import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import CoinFlipGame from '../components/CoinFlipGame';
import toast from 'react-hot-toast';

interface Player {
  id: string;
  name: string;
  avatar: string;
}

interface GameState {
  id: string;
  category: string;
  entryFee: number;
  players: Player[];
  maxPlayers: number;
  status: 'waiting' | 'flipping' | 'completed';
  winner?: Player;
}

const GameRoom: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { userData, refetch } = useUserData(user?.id);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get('category');
  const amount = parseInt(searchParams.get('amount') || '0');

  useEffect(() => {
    if (!user || !userData || !category || !amount) {
      navigate('/user');
      return;
    }

    if (userData.wallet_balance < amount) {
      toast.error('Insufficient balance!');
      navigate('/user');
      return;
    }

    joinOrCreateGame();
  }, [user, userData, category, amount]);

  const joinOrCreateGame = async () => {
    if (!user || !userData) return;

    try {
      setLoading(true);

      // Check if user already has sufficient balance
      if (userData.wallet_balance < amount) {
        toast.error('Insufficient balance!');
        navigate('/user');
        return;
      }

      // Deduct entry fee from wallet
      const newBalance = userData.wallet_balance - amount;
      const { error: balanceError } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      // Create transaction record
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'game_entry',
        amount: -amount,
        status: 'completed',
        reference_id: `game_entry_${Date.now()}`
      });

      // Find or create game
      let { data: existingGame } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'waiting')
        .eq('entry_fee', amount)
        .lt('current_players', 10)
        .order('created_at')
        .limit(1)
        .single();

      let gameId: string;

      if (!existingGame) {
        // Create new game
        const { data: newGame, error: gameError } = await supabase
          .from('games')
          .insert({
            entry_fee: amount,
            max_players: 10,
            current_players: 0,
            status: 'waiting'
          })
          .select()
          .single();

        if (gameError) throw gameError;
        gameId = newGame.id;
      } else {
        gameId = existingGame.id;
      }

      // Join game
      const { error: participantError } = await supabase
        .from('game_participants')
        .insert({
          game_id: gameId,
          user_id: user.id,
          amount_paid: amount
        });

      if (participantError) throw participantError;

      // Update game player count
      const { data: participants } = await supabase
        .from('game_participants')
        .select('user_id, users(email)')
        .eq('game_id', gameId);

      const playerCount = participants?.length || 0;

      await supabase
        .from('games')
        .update({ current_players: playerCount })
        .eq('id', gameId);

      // Set initial game state
      const players: Player[] = participants?.map((p: any, index: number) => ({
        id: p.user_id,
        name: p.users?.email?.split('@')[0] || `Player ${index + 1}`,
        avatar: ''
      })) || [];

      setGameState({
        id: gameId,
        category: category || '',
        entryFee: amount,
        players,
        maxPlayers: 10,
        status: playerCount >= 10 ? 'flipping' : 'waiting'
      });

      // Subscribe to game updates
      const subscription = supabase
        .channel(`game-${gameId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_participants',
          filter: `game_id=eq.${gameId}`
        }, async () => {
          // Refresh game state
          const { data: updatedParticipants } = await supabase
            .from('game_participants')
            .select('user_id, users(email)')
            .eq('game_id', gameId);

          const updatedPlayers: Player[] = updatedParticipants?.map((p: any, index: number) => ({
            id: p.user_id,
            name: p.users?.email?.split('@')[0] || `Player ${index + 1}`,
            avatar: ''
          })) || [];

          setGameState(prev => prev ? {
            ...prev,
            players: updatedPlayers,
            status: updatedPlayers.length >= 10 ? 'flipping' : 'waiting'
          } : null);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };

    } catch (error: any) {
      console.error('Error joining game:', error);
      toast.error('Failed to join game');
      navigate('/user');
    } finally {
      setLoading(false);
    }
  };

  const handleGameComplete = async (winner: Player, payout: number) => {
    if (!gameState || !user) return;

    try {
      // Update game status
      await supabase
        .from('games')
        .update({
          status: 'completed',
          winner_id: winner.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', gameState.id);

      // Process payouts
      for (const player of gameState.players) {
        const isWinner = player.id === winner.id;
        const playerPayout = isWinner ? gameState.entryFee * 1.5 : gameState.entryFee * 0.8;

        // Update participant record
        await supabase
          .from('game_participants')
          .update({
            is_winner: isWinner,
            amount_won: playerPayout
          })
          .eq('game_id', gameState.id)
          .eq('user_id', player.id);

        // Don't update wallet balance here - let payments page handle it
      }

      setGameState(prev => prev ? { ...prev, winner, status: 'completed' } : null);
      
      if (winner.id === user.id) {
        toast.success(`🎉 You won ₹${payout.toLocaleString()}!`);
      } else {
        toast.success(`You received ₹${(gameState.entryFee * 0.8).toLocaleString()} back`);
      }

      // Navigate to payments page instead of refreshing
      setTimeout(() => {
        navigate(`/payments?gameId=${gameState.id}&winner=${winner.id === user.id}&amount=${winner.id === user.id ? payout : gameState.entryFee * 0.8}`);
      }, 3000);

    } catch (error: any) {
      console.error('Error completing game:', error);
      toast.error('Error processing game results');
    }
  };

  const handleLeaveGame = () => {
    navigate('/user');
  };

  if (loading || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  return (
    <CoinFlipGame
      gameState={gameState}
      onGameComplete={handleGameComplete}
      onLeaveGame={handleLeaveGame}
    />
  );
};

export default GameRoom;