import { StatsDashboard } from '../stats/stats-dashboard';
import { useEffect } from 'react';
import { useAuth } from '../auth/auth-provider';
import { toast } from '@/hooks/use-toast';

export function PlayerDashboard() {
  const { user } = useAuth()


  useEffect(() => {
    if (!user) return

    // Abre WS a /ws/jugador/
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/jugador/`)

    socket.onopen = () => {
      console.log('WS Jugador conectado')
    }

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data)
      console.log('WS Jugador msg:', data)

      // data.tiene tipo, p.ej. "nuevo_partido" o "rating_update"
      if (data.tipo === 'nuevo_partido') {
        toast({
          title: 'Nuevo Partido',
          description: '¡Te han agregado a un partido!',
        })
        // Opcional: re-fetch matches or rating
      } else if (data.tipo === 'rating_update') {
        toast({
          title: 'Rating Actualizado',
          description: `Tu nuevo rating es ${data.rating}`,
        })
        // Opcional: re-fetch user o manipular user en authProvider
      }
    }

    socket.onclose = (e) => console.log('WS Jugador cerrado:', e)
    socket.onerror = (err) => console.error('WS Jugador error:', err)

    return () => {
      socket.close()
    }
  }, [user])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Panel de Jugador</h1>
      <StatsDashboard />
    </div>
  )
}