import { useEffect, useState, createContext } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { getUserRole } from '@/lib/auth';


//----------------------Interfaces del backend
export interface User {
  id: number | string
  email: string
  name: string
  role: 'admin' | 'sponsor' | 'player'
}

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  logout: () => Promise<void>
}
//----------------------Qué se espera del formulario del registro
export interface SignUpData {
  email: string
  password: string
  username?: string
  fullName?: string
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

//URL de la api

