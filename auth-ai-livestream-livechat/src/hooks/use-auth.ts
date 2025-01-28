import { useState } from 'react';
import axios from 'axios';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

// Reusar la misma interfaz
interface SignUpData {
  email: string
  password: string
  username?: string
  fullName?: string
}

// Este hook se parece mucho al signUp del AuthProvider. 
// Te serviría si no deseas usar AuthProvider para signUp, 
// sino un hook directo en tu formulario:
export function useSignUp() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  async function signUp({ email, password, username, fullName }: SignUpData) {
    try {
      setLoading(true)
      // Ajusta la URL y el payload a tu Django
      const payload = {
        email: email.trim(),
        password,
        nombre_completo: fullName || username || 'Sin Nombre',
      }
      const { data } = await axios.post('http://127.0.0.1:8000/api/auth/register/', payload)

      // data = { access, refresh, user: {...} }
      localStorage.setItem('accessToken', data.access)
      localStorage.setItem('refreshToken', data.refresh)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Configura axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.access}`

      toast({
        title: 'Cuenta Creada',
        description: 'Tu cuenta ha sido creada exitosamente.',
      })

      // Redirige al dashboard
      navigate(ROUTES.DASHBOARD)
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'No se pudo crear la cuenta.',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    signUp,
    loading,
  }
}
