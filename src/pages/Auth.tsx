import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import myclubLogo from '@/assets/myclub-logo.png';
import { Loader2 } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Bitte gib deine E-Mail-Adresse ein');
      return;
    }

    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        toast.error('Fehler beim Senden des Login-Links: ' + error.message);
      } else {
        toast.success('Magic Link wurde an deine E-Mail-Adresse gesendet!');
        setEmail('');
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img src={myclubLogo} alt="myclub" className="h-10 w-auto" />
            <div className="border-l border-border/50 pl-3">
              <h1 className="text-xl font-bold text-foreground">FanPost</h1>
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-[var(--shadow-card)] border-border">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Willkommen zurück
              </CardTitle>
              <CardDescription className="text-center">
                Melde dich mit deiner E-Mail-Adresse an
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="deine@email.ch"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sende Link...
                    </>
                  ) : (
                    'Magic Link senden'
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center mt-4">
                  Wir senden dir einen Login-Link per E-Mail. Klicke auf den Link um dich einzuloggen.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Auth;
