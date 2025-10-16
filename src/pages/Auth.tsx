import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { z } from 'zod';

const Auth = () => {
  const { t } = useLanguage();
  const emailSchema = z.string().email({ message: t.auth.invalidEmail });

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { signInWithMagicLink, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      const redirect = searchParams.get('redirect');
      const selectedPlan = localStorage.getItem('selectedPlan');
      
      if (redirect === 'subscription' && selectedPlan) {
        navigate('/profile/subscription');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate, searchParams]);

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
        title: t.auth.errorTitle,
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t.auth.successTitle,
        description: t.auth.successDescription,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />
      <div className="flex items-center justify-center p-4 py-20">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">{t.auth.title}</CardTitle>
            <CardDescription className="text-center">
              {t.auth.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
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
                {isLoading ? t.auth.sendingButton : t.auth.sendButton}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground text-center mt-4">
              {t.auth.description}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
