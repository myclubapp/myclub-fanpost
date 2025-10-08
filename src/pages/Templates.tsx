import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Lock } from 'lucide-react';
import { TemplateList } from '@/components/templates/TemplateList';

const Templates = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPaidUser, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      navigate('/auth');
    }
  }, [mounted, authLoading, user, navigate]);

  if (authLoading || roleLoading || !mounted) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isPaidUser) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Premium Feature</CardTitle>
              <CardDescription>
                Der Template Editor ist nur für Paid Users verfügbar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Upgrade Sie Ihren Account, um eigene Templates zu erstellen und zu verwalten.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">Mit Paid Features erhalten Sie:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Unbegrenzte Custom Templates</li>
                  <li>• WYSIWYG Template Editor</li>
                  <li>• Bildgenerierung per AI</li>
                  <li>• Erweiterte Anpassungsoptionen</li>
                </ul>
              </div>
              <Button className="w-full" onClick={() => navigate('/')}>
                Zurück zur Startseite
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Meine Templates</h1>
              <p className="text-muted-foreground mt-1">
                Verwalten Sie Ihre eigenen Vorlagen für Spielvorschauen und Resultate
              </p>
            </div>
            <Button onClick={() => navigate('/templates/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Neues Template
            </Button>
          </div>

          <TemplateList />
        </div>
      </div>
    </div>
  );
};

export default Templates;
