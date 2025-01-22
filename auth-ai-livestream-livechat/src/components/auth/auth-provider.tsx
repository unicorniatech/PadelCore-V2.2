import { useEffect, useState } from 'react';
import { AuthContext, type User, type SignUpData, getUserRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        updateUserState(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        updateUserState(session.user);
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateUserState = async (authUser: any) => {
    try {
      // Wait for profile with improved error handling and backoff
      const getProfile = async (retries = 0, maxRetries = 10): Promise<any> => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url, rating')
            .eq('id', authUser.id)
            .single();

          // Profile found successfully
          if (data) {
            return data;
          }

          // Handle specific error cases
          if (error) {
            if (error.code === 'PGRST116') {
              // Profile doesn't exist yet, wait and retry
              console.log('Profile not ready, retrying...');
            } else {
              console.error('Profile fetch error:', error);
            }

            if (retries >= maxRetries) {
              throw new Error('Max retries reached waiting for profile');
            }

            // Exponential backoff with jitter
            const delay = Math.min(1000 * Math.pow(2, retries), 10000) 
              + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return getProfile(retries + 1, maxRetries);
          }
        } catch (error) {
          console.error('Profile fetch attempt failed:', error);
          if (retries >= maxRetries) {
            throw new Error('Failed to fetch profile after multiple attempts');
          }
          const delay = Math.min(1000 * Math.pow(2, retries), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          return getProfile(retries + 1, maxRetries);
        }
      };

      let profile;
      try {
        profile = await getProfile();
      } catch (error) {
        console.error('Failed to get profile:', error);
        throw new Error('No se pudo cargar el perfil del usuario');
      }

      // Get user role
      const role = await getUserRole(authUser.email || 'player@demo.com');
      
      const userData: User = {
        id: authUser.id,
        email: authUser.email,
        name: profile.full_name || profile.username || authUser.email?.split('@')[0],
        role,
        profile,
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      // Navigate to dashboard
      if (window.location.pathname === '/') {
        navigate(ROUTES.DASHBOARD);

        // Show welcome message
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión exitosamente.",
        });
      }

      return userData;
    } catch (error: any) {
      console.error('Error updating user state:', error);
      if (error.message !== 'No se pudo cargar el perfil del usuario') {
        toast({
          title: "Error",
          description: "No se pudo cargar el perfil. Por favor intenta de nuevo.",
          variant: "destructive",
        });
        
        // Clean up and redirect
        await logout();
        navigate('/');
      }
      
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        const userData = await updateUserState(data.user);
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión exitosamente.",
        });
        return { data: userData };
      }

      throw new Error('No se pudo iniciar sesión');
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión. Por favor intenta de nuevo.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName,
          },
        },
      });

      if (error) throw error;
      
      if (authData.user) {
        await updateUserState(authData.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('user');
    toast({
      title: "Sesión Cerrada",
      description: "Has cerrado sesión exitosamente.",
    });
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}