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
const API_URL = 'http://127.0.0.1:8000/api'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  })

  const { toast } = useToast()
  const navigate = useNavigate()

  /**
   * Al montar el provider, si tenemos un accessToken almacenado,
   * lo ponemos en el header Authorization de axios.
   */
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [])

  /**
   * signIn: llama a tu endpoint Django /auth/login/
   * Espera que devuelva { refresh, access, user: {...} }
   */
  async function signIn(email: string, password: string) {
    try {
      const { data } = await axios.post(`${API_URL}/auth/login/`, {
        email,
        password,
      })
      // data = { refresh, access, user: { id, email, nombre_completo, ... } }
      const { access, refresh, user: backendUser } = data
      // El backend no envía Role, así que lo deducimos con getUserRole
      // p.ej. "admin@demo.com" => "admin"
      const role = getUserRole(backendUser.email)
      // Construimos el user final
      const newUser: User = {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.nombre_completo || backendUser.email, // Ajusta según tu backend
        role, // 'admin' | 'player' | 'sponsor'
      }
      // Guardamos tokens y user en localStorage
      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)
      localStorage.setItem('user', JSON.stringify(newUser))
      // Configuramos axios para futuras llamadas
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
      // Seteamos en estado
      setUser(newUser)
      // Navegamos a dashboard
      navigate(ROUTES.DASHBOARD)
      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión exitosamente.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'No se pudo iniciar sesión',
        variant: 'destructive',
      })
      console.error('Login error:', error)
      throw error
    }
  }
   /**
   * signUp: llama a tu endpoint Django /auth/register/
   * Espera que devuelva { refresh, access, user: {...} }
   */
   async function signUp(dataForm: SignUpData) {
    try {
      // Ajusta los campos que envías para coincidir con tu Django
      // Ejemplo: { email, password, nombre_completo }
      const payload = {
        email: dataForm.email,
        password: dataForm.password,
        nombre_completo: dataForm.fullName || 'Sin Nombre',
        // Podrías también mandar un "username: dataForm.username"
      }

      const { data } = await axios.post(`${API_URL}/auth/register/`, payload)
      // data = { refresh, access, user: {...} }

      const { access, refresh, user: backendUser } = data

      // Determina role si tu backend no lo manda
      const role = getUserRole(backendUser.email)

      const newUser: User = {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.nombre_completo || backendUser.email,
        role,
      }

      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)
      localStorage.setItem('user', JSON.stringify(newUser))

      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
      setUser(newUser)

      toast({
        title: 'Cuenta Creada',
        description: 'Tu cuenta ha sido creada exitosamente.',
      })

      // Después de registrarse, redirigir
      navigate(ROUTES.DASHBOARD)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'No se pudo crear la cuenta',
        variant: 'destructive',
      })
      console.error('Sign up error:', error)
      throw error
    }
  }

  /**
   * logout: simplemente elimina tokens y borra el user del state
   */
  async function logout() {
    // Si tu Django requiere un endpoint para invalidar refresh token, llámalo aquí
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')

    delete axios.defaults.headers.common['Authorization']
    setUser(null)

    toast({
      title: 'Sesión Cerrada',
      description: 'Has cerrado sesión exitosamente.',
    })
    navigate(ROUTES.HOME)
  }

  const contextValue: AuthContextType = {
    user,
    signIn,
    signUp,
    logout,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

