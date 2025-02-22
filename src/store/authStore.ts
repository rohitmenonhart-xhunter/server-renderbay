import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { config } from '../config';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'artist' | 'admin';
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,

      signIn: async (email: string, password: string) => {
        try {
          const response = await fetch(config.endpoints.signIn, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to sign in');
          }

          set({ user: data.user, token: data.token });
          localStorage.setItem('token', data.token);
        } catch (error: any) {
          throw new Error(error.message || 'Failed to sign in');
        }
      },

      signUp: async (username: string, email: string, password: string) => {
        try {
          // Validate email format
          const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(email)) {
            throw new Error('Please enter a valid email address');
          }

          const response = await fetch(config.endpoints.signUp, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to sign up');
          }

          set({ user: data.user, token: data.token });
          localStorage.setItem('token', data.token);
        } catch (error: any) {
          throw new Error(error.message || 'Failed to sign up');
        }
      },

      signOut: () => {
        set({ user: null, token: null });
        localStorage.removeItem('token');
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);