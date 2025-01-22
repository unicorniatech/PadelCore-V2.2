import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

export function useSignUp() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const signUp = async ({
    email,
    password,
    username,
    fullName,
  }: {
    email: string;
    password: string;
    username: string;
    fullName: string;
  }) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.toLowerCase(),
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('Este correo ya está registrado');
        }
        throw error;
      }

      toast({
        title: "Cuenta Creada",
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
    } finally {
      setLoading(false);
    }
  };

  return {
    signUp,
    loading,
  };
}