import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import { LiveVideo } from './live-video';
import { LiveChat } from './live-chat';
import { AnalyticsOverlay } from './analytics-overlay';
import { BallTrackingAnalytics } from '@/lib/video/analytics';
import { Trophy, Users, Clock, Camera } from 'lucide-react';

export function LiveStreaming() {
  const [viewerCount, setViewerCount] = useState(1234);
  const [matchTime, setMatchTime] = useState('25:15');
  const [score, setScore] = useState({ team1: 6, team2: 4 });
  const videoRef = useRef<any>(null);
  const [analytics] = useState(() => new BallTrackingAnalytics());

  const [activeScene, setActiveScene] = useState('main');
  const [scenes] = useState([
    { id: 'main', name: 'Cancha Principal' },
    { id: 'side', name: 'Vista Lateral' },
    { id: 'aerial', name: 'Vista Aérea' },
    { id: 'replay', name: 'Repetición' },
  ]);

  const handleBallPosition = (position: { x: number; y: number }) => {
    analytics.addPosition(position.x, position.y);
  };

  const handleSceneChange = async (sceneId: string) => {
    if (videoRef.current && videoRef.current.streamManager) {
      await videoRef.current.streamManager.switchScene(sceneId);
      setActiveScene(sceneId);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Video and Match Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scene Controls */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              {scenes.map((scene) => (
                <Button
                  key={scene.id}
                  variant={activeScene === scene.id ? 'default' : 'outline'}
                  onClick={() => handleSceneChange(scene.id)}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {scene.name}
                </Button>
              ))}
            </div>
          </Card>

          <div className="relative">
            <LiveVideo
              ref={videoRef}
              width={1280}
              height={720}
              frameRate={30}
              onBallPosition={handleBallPosition}
              scene={activeScene}
            />
            <AnalyticsOverlay
              width={1280}
              height={720}
              analytics={analytics}
            />
          </div>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">
                Torneo Nacional - Cuartos de Final
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>{viewerCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{matchTime}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Trophy className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Premio</p>
                <p className="text-lg font-bold">$50,000</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Espectadores</p>
                <p className="text-lg font-bold">{viewerCount}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Tiempo</p>
                <p className="text-lg font-bold">{matchTime}</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold">Carlos Ramírez / Ana González</h2>
                <p className="text-sm text-muted-foreground">vs</p>
                <h2 className="font-semibold">Miguel Torres / Laura Hernández</h2>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {score.team1}-{score.team2}
                </p>
                <p className="text-sm text-muted-foreground">Set Actual</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Live Chat */}
        <div className="lg:col-span-1">
          <LiveChat />
        </div>
      </div>
    </div>
  );
}