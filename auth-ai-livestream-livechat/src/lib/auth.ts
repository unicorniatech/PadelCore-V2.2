import { createContext, useContext } from 'react';
//import { supabase } from './supabase';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import axios from 'axios'

export async function login(email: string, password: string) {
  const { data } = await axios.post('http://127.0.0.1:8000/api/auth/login/', {
    email,
    password
  })
  // data = { access, refresh, user: { id, email, rol, ... } }
  localStorage.setItem('accessToken', data.access)
  localStorage.setItem('refreshToken', data.refresh)
  // etc. (guarda user en state)
  return data
}


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
      const payload = {
        email: data.email.trim(),
        password: data.password,
        nombre_completo: data.fullName,
        // rol, username, etc. si quieres
      };
      const response = await axios.post('http://127.0.0.1:8000/api/auth/register/', payload);

      // response.data = { refresh, access, user: {...} }
      // Guardamos tokens
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast({
        title: "¡Registro Exitoso!",
        description: "Tu cuenta ha sido creada exitosamente.",
      });

      navigate(ROUTES.DASHBOARD);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Error al crear la cuenta',
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
      const data = await login(email, password);

      // data = { refresh, access, user: {...} }
      // Guardamos en localStorage (ya lo hizo "login"?),
      // pero podrías setear tu estado de user si deseas

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión exitosamente.",
      });

      // Redirigir a dashboard
      navigate(ROUTES.DASHBOARD);

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { signIn };
}