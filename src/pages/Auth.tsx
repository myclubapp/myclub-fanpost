import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email({ message: "Ungültige E-Mail-Adresse" });

const Auth = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { signInWithMagicLink, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    
    // Validate email
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setEmailError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error } = await signInWithMagicLink(email);
    setIsLoading(false);
    
    if (error) {
      toast({
        title: "Fehler beim Senden",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Magic Link gesendet!",
        description: "Überprüfen Sie Ihr E-Mail-Postfach für den Login-Link.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Willkommen bei Fanpost</CardTitle>
          <CardDescription className="text-center">
            Melden Sie sich mit Ihrer E-Mail-Adresse an
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="ihre.email@beispiel.ch"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                disabled={isLoading}
                className={emailError ? "border-destructive" : ""}
                required
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Wird gesendet...' : 'Magic Link senden'}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Sie erhalten eine E-Mail mit einem Login-Link
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
