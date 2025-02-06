import React, { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'

// ==============================================
// Tipos de ejemplo. Ajusta según tu definición real
// ==============================================

export type UserRole = 'admin' | 'sponsor' | 'player' | 'usuario'

export interface User {
  id: number | string
  email: string
  name: string
  role: UserRole
  companyName?: string
  // cualquier otro campo que devuelva tu backend (club, rating_inicial, etc.)
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  logout: () => Promise<void>
}

export interface SignUpData {
  email: string
  password: string
  nombre_completo?: string
}

// Creamos el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ==============================================
// AuthProvider: Maneja estado de user y métodos
// ==============================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Al iniciar, leer user de localStorage
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  }) 

  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  // Opcional: al montar, si hay un accessToken en localStorage, podrías
  // configurar axios para que lo envíe siempre en "Authorization"
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [])

  // ==============================
  // signIn
  // ==============================
  async function signIn(email: string, password: string) {
    setLoading(true)
    try {
      // Petición a Django: POST /api/auth/login/
      const response = await axios.post('http://127.0.0.1:8000/api/auth/login/', {
        email,
        password,
      })
      // Estructura: { refresh, access, user: {...} }
      const { access, refresh, user: backendUser } = response.data

      // Guarda tokens y user en localStorage
      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)
      localStorage.setItem('user', JSON.stringify(backendUser))

      // Configurar axios para futuras llamadas
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`

      // Actualiza estado
      setUser({
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.nombre_completo || backendUser.email,
        role: (backendUser.rol as UserRole) || 'player',
      })

      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión exitosamente.',
      })

      // Navegar a Dashboard
      navigate(ROUTES.DASHBOARD)
    } catch (error: any) {
      console.error('Login error:', error)
      toast({
        title: 'Error',
        description:
          error.response?.data?.detail || 'No se pudo iniciar sesión. Verifica tus credenciales.',
        variant: 'destructive',
      })
      throw error
    }
  }

  // ==============================
  // signUp
  // ==============================
  async function signUp(data: SignUpData) {
    try {
      // Petición a Django: POST /api/auth/register/
      const response = await axios.post('http://127.0.0.1:8000/api/auth/register/', data)
      // data = { refresh, access, user: {...} }
      const { access, refresh, user: backendUser } = response.data

      // Guarda tokens y user
      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)
      localStorage.setItem('user', JSON.stringify(backendUser))

      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`

      setUser({
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.nombre_completo || backendUser.email,
        role: (backendUser.rol as UserRole) || 'player',
      })

      toast({
        title: 'Cuenta Creada',
        description: 'Se ha registrado tu cuenta exitosamente.',
      })

      navigate(ROUTES.DASHBOARD)
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast({
        title: 'Error',
        description:
          error.response?.data?.detail || 'No se pudo crear la cuenta. Revisa tus datos.',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  // ==============================
  // logout
  // ==============================
  async function logout() {
    // (Opcional) podrías llamar a un endpoint de logout en Django si usas blacklisting
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

  // Proveer valores en el contexto
  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

