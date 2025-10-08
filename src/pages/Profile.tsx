import { useEffect } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { ProfileSidebar } from '@/components/ProfileSidebar';
import { ProfileInfo } from '@/components/profile/ProfileInfo';
import { SubscriptionSection } from '@/components/profile/SubscriptionSection';
import { CreditsSection } from '@/components/profile/CreditsSection';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-[calc(100vh-64px)] w-full pt-16">
          <ProfileSidebar />
          
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Mobile Trigger */}
              <div className="md:hidden mb-4">
                <SidebarTrigger />
              </div>

              <Routes>
                <Route index element={<ProfileInfo />} />
                <Route path="subscription" element={<SubscriptionSection />} />
                <Route path="credits" element={<CreditsSection />} />
                <Route path="settings" element={<SettingsSection />} />
                <Route path="delete" element={<DeleteAccountSection />} />
                <Route path="*" element={<Navigate to="/profile" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Profile;
