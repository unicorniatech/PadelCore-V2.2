import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatchHistory } from './match-history';
import { PerformanceMetrics } from './performance-metrics';
import { HeadToHead } from './head-to-head';
import { ProgressTracking } from './progress-tracking';
import { Trophy, TrendingUp, Users, Activity } from 'lucide-react';
import { useAuth } from '../auth/auth-provider';
import { fetchPartidos, fetchDailyRanking } from '@/lib/api';
import { Partido, RankingRecord } from '@/lib/types';


export function StatsDashboard() {
  const { user } = useAuth();
  const [partidosCount, setPartidosCount] = useState(0)
  const [playerRank, setPlayerRank] = useState<string | number>('---');

  // 2) Cargar la lista de partidos y filtrar
  useEffect(() => {
    if (!user) return
    const userId = String(user.id)

    const loadMatches = async () => {
      try {
        const allMatches = await fetchPartidos()
        const filtered = allMatches.filter((match: Partido) => 
          match.equipo_1.includes(userId) || match.equipo_2.includes(userId)
        )
        setPartidosCount(filtered.length);
      } catch (error) {
        console.error('Error al cargar partidos:', error)
      }
    }
    loadMatches()
  }, [user])

  // 3) stats array
  useEffect(() => {
    if (!user) return

    const loadRanking = async () => {
      try {
        // Asumimos 'hoy' => date= new Date().toISOString().split('T')[0]
        const todayIso = new Date().toISOString().split('T')[0]
        const rankingRecords = await fetchDailyRanking(todayIso)

        // Buscar si hay un RankingRecord del user
        const record = rankingRecords.find((r: RankingRecord) => r.user === user.id)
        if (record) {
          setPlayerRank(record.position) // p.ej. 1, 2, etc.
        } else {
          // no está en la lista => '---'
          setPlayerRank('---')
        }
      } catch (error) {
        console.error('Error loading daily ranking:', error)
        setPlayerRank('---')
      }
    }
    loadRanking()
  }, [user])
  const stats = [
    { label: 'Ranking', value: playerRank, icon: Trophy },         
    { label: 'Puntos', value: user?.rating_inicial ?? 0, icon: TrendingUp },
    { label: 'Partidos', value: partidosCount, icon: Activity },
    { label: 'Victorias', value: '18', icon: Users },         // dummy
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4 lighting-card hover:shadow-lg hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3">
                <stat.icon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">
                  {stat.label === 'Ranking' && typeof stat.value === 'number'
                      ? `#${stat.value}`
                      : stat.value}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="headtohead">Head to Head</TabsTrigger>
          <TabsTrigger value="progress">Progreso</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <MatchHistory />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMetrics />
        </TabsContent>

        <TabsContent value="headtohead">
          <HeadToHead />
        </TabsContent>

        <TabsContent value="progress">
          <ProgressTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
}