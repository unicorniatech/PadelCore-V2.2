import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth/auth-provider';
import { NotificationsProvider } from '@/components/notifications/notifications-provider';
import { RootLayout } from '@/components/layouts/root-layout';
import { LandingPage } from '@/components/landing-page';
import { PlayerDashboard } from '@/components/dashboard/player-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { SponsorDashboard } from '@/components/dashboard/sponsor-dashboard';
import { LiveStreaming } from '@/components/live/live-streaming';
import { SocialFeed } from '@/components/feed/social-feed';
import { PublicFeed } from '@/components/feed/public-feed';
import { PricingPage } from '@/components/pricing/pricing-page';
import { RankingsPage } from '@/components/rankings/rankings-page';
import { CommunityPage } from '@/components/community/community-page';
import { TutorialsPage } from '@/components/tutorials/tutorials-page';
import { TournamentsPage } from '@/components/tournaments/tournaments-page';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { ProfileView } from '@/components/profile/profile-view';
import { SettingsView } from '@/components/settings/settings-view';

function DashboardRoute() {
  const { user } = useAuth();

  // Redirect to landing if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Route based on user role
  switch (user.rol) {
    case 'admin':
      return <AdminDashboard />;
    case 'sponsor':
      return <SponsorDashboard />;
    case 'player':
    case 'usuario':
      return <PlayerDashboard />;
    default:
      return <PlayerDashboard />; // Default to player dashboard
  }
}

function AppContent() {
  return (
    <RootLayout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/feed" element={<PublicFeed />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/tutorials" element={<TutorialsPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/profile" element={<ProfileView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <DashboardRoute />
            </DashboardLayout>
          }
        />
        <Route path="/live" element={<LiveStreaming />} />
      </Routes>
    </RootLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationsProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NotificationsProvider>
    </ThemeProvider>
  );
}