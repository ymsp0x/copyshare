import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getSession } from '../lib/supabase';
import { Session, AuthError } from '@supabase/supabase-js'; // Import AuthError

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: { session: Session | null; user: any; }; error: AuthError | null; }>; // Update return type
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for active session on load
    const initializeAuth = async () => {
      try {
        const currentSession = await getSession();
        setSession(currentSession);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      // Do not throw here, return data and error for caller to handle
      return { data, error }; 
    } catch (error) {
      console.error('Error signing in:', error);
      // Re-throw if it's an unexpected error
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};