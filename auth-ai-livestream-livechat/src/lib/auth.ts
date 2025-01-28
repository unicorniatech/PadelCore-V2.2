import { createContext, useContext } from 'react';
import { supabase } from './supabase';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

export type UserRole = 'player' | 'admin' | 'sponsor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
}

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

// Helper to determine user role
export function getUserRole(email: string): 'admin' | 'sponsor' | 'player' {
  if (email.includes('admin')) return 'admin';
  if (email.includes('sponsor')) return 'sponsor';
  return 'player';
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useSignUp() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const signUp = async (data: SignUpData) => {
    try {
      const { error } = await supabase.auth.signUp({
        // Ensure email and password are trimmed
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          // Handle existing user error
          throw new Error('Este correo ya está registrado');
        }
        throw new Error('Error al crear la cuenta. Por favor intenta de nuevo.');
      }

      toast({
        title: "¡Registro Exitoso!",
        description: "Tu cuenta ha sido creada exitosamente.",
      });

      // Navigate after successful signup
      navigate(ROUTES.DASHBOARD);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { signUp };
}

export function useSignIn() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Credenciales inválidas. Por favor verifica tu email y contraseña.');
        }
        throw new Error('Error al iniciar sesión. Por favor intenta de nuevo.');
      }

      if (data.user) {
        // Wait for user state update before proceeding
        await updateUserState(data.user);
      }

      return { data };
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
      return null;
    }
  };

  return { signIn };
}