import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User as AppUser } from '../types';

export const useUserData = (userId: string | undefined) => {
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }

        setUserData(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('user-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      }, (payload) => {
        setUserData(payload.new as AppUser);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return { userData, loading, refetch: () => {
    if (userId) {
      supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
        .then(({ data }) => {
          if (data) setUserData(data);
        });
    }
  }};
};