import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { supabase, getCurrentUser } from './supabase';
import type { AppUser } from './types';

interface GlobalContextType {
  isLoggedIn: boolean;
  user: AppUser | null;
  loading: boolean;
  refetch: (params?: Record<string, string | number>) => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refetch = async (_params?: Record<string, string | number>) => {
    await loadUser();
  };

  return (
    <GlobalContext.Provider value={{ isLoggedIn: !!user, user, loading, refetch }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobalContext must be used within a GlobalProvider');
  return context;
};

export default GlobalProvider;
