import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../auth/auth-provider';
import { fetchPartidos } from '@/lib/api';
import { Partido } from '@/lib/types';


export function MatchHistory() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Partido[]>([])

  useEffect(() => {
    // Solo cargar partidos si hay usuario logueado
    if (!user) return

    const loadMatches = async () => {
      try {
        // 1) Obtener todos los partidos del backend
        const allMatches = await fetchPartidos()

        // 2) Filtrar los que involucren al user actual:
        //    equipo_1 y equipo_2 son arrays de IDs (string[]),
        //    y user.id lo convertimos a string para comparar
        const userId = String(user.id)

        const filtered = allMatches.filter((match) => {
          return (
            match.equipo_1.includes(userId) ||
            match.equipo_2.includes(userId)
          )
        })

        setMatches(filtered)
      } catch (error) {
        console.error('Error al cargar partidos:', error)
      }
    }

    loadMatches()
  }, [user])

  // Función extra (opcional) para determinar si el usuario ganó o perdió
  const getMatchStatus = (match: Partido): 'victoria' | 'derrota' => {
    // TODO: tu lógica. Por ejemplo, si match.resultado indica
    // que equipo_1 ganó y user está en equipo_1 => 'victoria'
    // De momento, podemos inferir 'derrota' si no es victoria
    return 'victoria'  // <--- Ajusta según tu parseo
  }

  return (
    <Card className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Torneo</TableHead>
            <TableHead>Oponentes</TableHead>
            <TableHead>Resultado</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => {
            // Determina si es victoria o derrota (dummy)
            const status = getMatchStatus(match)

            return (
              <TableRow key={match.id} className="hover:bg-muted/50">
                {/* Suponiendo que match.fecha_hora = "2024-04-12T00:00:00", 
                    mostramos solo la parte de la fecha */}
                <TableCell>
                  {match.fecha_hora ? match.fecha_hora.split('T')[0] : ''}
                </TableCell>
                <TableCell>{match.torneo}</TableCell>
                
                {/* Oponentes: si user está en equipo_1, 
                    mostramos equipo_2 como "oponentes" */}
                <TableCell>
                  {renderOpponents(match, user?.id)}
                </TableCell>
                
                <TableCell>{match.resultado || '-'}</TableCell>
                <TableCell>
                  <Badge
                    variant={status === 'victoria' ? 'success' : 'destructive'}
                  >
                    {status === 'victoria' ? 'Victoria' : 'Derrota'}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}

// Función para mostrar oponentes
function renderOpponents(match: Partido, userId?: number | string) {
  if (!userId) return ''

  const userIdStr = String(userId)
  const userInEquipo1 = match.equipo_1.includes(userIdStr)
  
  // Si user está en equipo_1, "oponentes" es equipo_2
  // Sino, "oponentes" es equipo_1
  const opponents = userInEquipo1 ? match.equipo_2 : match.equipo_1
  
  // Aquí podrías mapear IDs a nombres, 
  // si tu 'Partido' trae datos extras o si tuviste que 
  // pre-cargar un diccionario ID->nombre
  return opponents.join(', ')
}