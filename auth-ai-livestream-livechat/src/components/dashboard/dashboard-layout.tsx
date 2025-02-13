import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Activity, LogOut, Video } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';
import { NotificationsBell } from '../notifications/notifications-bell';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  const goToLive = () => {
    window.location.pathname = '/live';
  };

  const goToDashboard = () => {
    window.location.pathname = '/';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}