import { useEffect } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Header } from '@/components/Header';
import { ProfileSidebar } from '@/components/ProfileSidebar';
import { ProfileInfo } from '@/components/profile/ProfileInfo';
import { SubscriptionSection } from '@/components/profile/SubscriptionSection';
import { TeamSlotsSection } from '@/components/profile/TeamSlotsSection';
import { TemplateManagementSection } from '@/components/profile/TemplateManagementSection';
import { LogoManagementSection } from '@/components/profile/LogoManagementSection';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection';
import { Loader2 } from 'lucide-react';

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  if (authLoading || subscriptionLoading || !user) {
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
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Mein Profil</h1>
          
          <div className="grid md:grid-cols-[250px_1fr] gap-8">
            <ProfileSidebar />
            
            <main className="min-w-0">
              <Routes>
                <Route index element={<ProfileInfo />} />
                <Route path="subscription" element={<SubscriptionSection />} />
                <Route path="teams" element={<TeamSlotsSection />} />
                <Route path="templates" element={<TemplateManagementSection />} />
                <Route path="logos" element={<LogoManagementSection />} />
                <Route path="settings" element={<SettingsSection />} />
                <Route path="delete" element={<DeleteAccountSection />} />
                <Route path="*" element={<Navigate to="/profile" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
